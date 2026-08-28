import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { totpLogin, mpinValidate, getSession, tradingHeaders, clearSession } from "./auth.js";
import { loadSymbols, searchSymbols, getPSymbol, getAllSymbols, getTradingSymbol } from "./symbols.js";
import { startLTP, stopLTP, isUsingWebSocket } from "./ltp.js";
import { updateWebSocketSubscriptions } from "./websocket.js";
import { parseAndAddRule, evaluateAlgoRules, activeRules } from "./algo.js";

const app = express();
app.use(cors());
app.use(express.json());

// Store active symbol subscriptions
const activeSubscriptions = new Map(); // pSymbol -> { tradingSymbol, pSymbol, sockets }

// ---------------- AUTH ENDPOINTS ----------------

app.post("/auth/login", async (req, res) => {
  try {
    const { mobile, ucc, totp } = req.body;
    await totpLogin(mobile, ucc, totp);
    res.json({ status: "totp-ok" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

app.post("/auth/validate", async (req, res) => {
  try {
    const s = await mpinValidate(req.body.mpin);
    
    // Start LTP streaming after successful validation
    startLTP(io, activeSubscriptions);
    
    res.json({
      success: true,
      session: {
        loggedIn: s.loggedIn,
        baseUrl: s.baseUrl,
        lastLogin: s.lastLogin,
        usingWebSocket: isUsingWebSocket()
      }
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

app.post("/auth/logout", (req, res) => {
  try {
    clearSession();
    stopLTP();
    activeSubscriptions.clear();
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- SYMBOL ENDPOINTS ----------------

app.get("/symbols", async (req, res) => {
  try {
    const s = getSession();
    if (!s?.baseUrl) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const r = await axios.get(
      `${s.baseUrl}/script-details/1.0/masterscrip/file-paths`,
      {
        headers: {
          Auth: s.tradeToken,
          Sid: s.tradeSid,
          "neo-fin-key": "neotradeapi"
        }
      }
    );
    res.json(r.data);
  } catch (error) {
    console.error("Symbols error:", error);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

app.get("/search", (req, res) => {
  try {
    const query = req.query.q || "";
    const results = searchSymbols(query);
    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/symbols", (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || "";
    
    let symbols = getAllSymbols();
    
    if (search) {
      const searchUpper = search.toUpperCase();
      symbols = symbols.filter(s => 
        s.tradingSymbol.includes(searchUpper) || 
        (s.name && s.name.toUpperCase().includes(searchUpper))
      );
    }
    
    const start = (page - 1) * limit;
    const paginatedSymbols = symbols.slice(start, start + limit);
    
    res.json({
      page,
      limit,
      total: symbols.length,
      data: paginatedSymbols
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/symbols/:tradingSymbol", (req, res) => {
  try {
    const { tradingSymbol } = req.params;
    const symbols = getAllSymbols();
    const symbol = symbols.find(s => s.tradingSymbol === tradingSymbol);
    
    if (!symbol) {
      return res.status(404).json({ error: "Symbol not found" });
    }
    
    res.json(symbol);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- QUOTE ENDPOINTS ----------------

app.get("/api/ltp/:exchange/:symbol", async (req, res) => {
  try {
    const s = getSession();
    if (!s?.baseUrl) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { exchange, symbol } = req.params;
    const exchangeMap = {
      'NSE': 'nse_cm',
      'BSE': 'bse_cm',
      'NFO': 'nse_fo',
      'BFO': 'bse_fo',
      'CDS': 'cde_fo'
    };

    const exch = exchangeMap[exchange] || exchange;
    
    // Get pSymbol for the trading symbol
    const pSymbol = getPSymbol(symbol);
    const symbolForQuote = pSymbol || symbol;
    
    const r = await axios.get(
      `${s.baseUrl}/script-details/1.0/quotes/neosymbol/${exch}|${encodeURIComponent(symbolForQuote)}/ltp`,
      {
        headers: {
          "Authorization": process.env.NEO_ACCESS_TOKEN,
          "Content-Type": "application/json"
        },
        timeout: 5000
      }
    );
    
    res.json({
      symbol,
      pSymbol: symbolForQuote,
      data: r.data
    });
  } catch (error) {
    console.error("LTP error:", error);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ---------------- ALGO ENDPOINTS ----------------
app.post("/api/algo/prompt", (req, res) => {
  try {
    const { prompt, qty } = req.body;
    const rule = parseAndAddRule(prompt, qty || 1);

    // Ensure the symbol is actively streaming via WebSocket so the algo can evaluate it
    if (!activeSubscriptions.has(rule.symbol)) {
      // Send a dummy subscribe request locally to trigger your existing WebSocket logic
      io.emit('subscribe', [rule.symbol]); 
    }

    res.json({ success: true, rule, message: "Algo condition activated" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/algo/rules", (req, res) => {
  res.json({ success: true, data: activeRules });
});


// ---------------- ORDER ENDPOINTS ----------------

// ---------------- ORDER ENDPOINTS - UPDATED ----------------

app.post("/order", async (req, res) => {
  try {
    const { 
      symbol,        // trading symbol (ts field)
      exch,          // exchange segment (es field)
      qty,           // quantity (qt field)
      side,          // B for Buy, S for Sell (tt field)
      orderType,     // MKT, L, SL, SL-M (pt field)
      price = "0",   // price for limit orders (pr field)
      triggerPrice = "0", // trigger price for SL orders (tp field)
      productType = "MIS", // MIS, CNC, NRML (pc field)
      disclosedQty = "0", // disclosed quantity (dq field)
      afterMarket = "NO", // AMO flag (am field)
      validity = "DAY"    // DAY, IOC (rt field)
    } = req.body;
    
    const s = getSession();

    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!symbol || !exch || !qty || !side || !orderType) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["symbol", "exch", "qty", "side", "orderType"]
      });
    }

    // Convert order type to API format
    let apiOrderType = orderType;
    if (orderType === "MARKET") apiOrderType = "MKT";
    if (orderType === "LIMIT") apiOrderType = "L";
    // Keep SL and SL-M as is
    
    // Convert product type to uppercase
    const apiProductType = productType.toUpperCase();
    
    // Validate product type
    const validProductTypes = ["MIS", "CNC", "NRML", "CO", "BO", "MTF"];
    if (!validProductTypes.includes(apiProductType)) {
      return res.status(400).json({ 
        error: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}` 
      });
    }

    // Build the order payload according to Kotak Neo API spec
    const orderPayload = {
      am: afterMarket,        // After Market Order flag
      dq: disclosedQty,       // Disclosed quantity
      es: exch,               // Exchange segment
      mp: "0",                // Market protection value
      pc: apiProductType,     // Product code
      pf: "N",                // Portfolio flag
      pr: price.toString(),   // Price
      pt: apiOrderType,       // Order type
      qt: qty.toString(),     // Quantity
      rt: validity,           // Validity
      tp: triggerPrice.toString(), // Trigger price
      ts: symbol,             // Trading symbol
      tt: side                // Transaction type (B or S)
    };

    // For BO (Bracket Orders) - you can add these fields when needed
    if (apiProductType === "BO" && req.body.boParams) {
      Object.assign(orderPayload, {
        sot: req.body.boParams.squareOffType || "Absolute",
        slt: req.body.boParams.stopLossType || "Absolute",
        slv: req.body.boParams.stopLossValue || "0",
        sov: req.body.boParams.squareOffValue || "0",
        tlt: req.body.boParams.trailingStopLoss ? "Y" : "N",
        tsv: req.body.boParams.trailingStopLossValue || "0",
        lat: "LTP"
      });
    }

    // Convert to URLSearchParams as per API requirement
    const params = new URLSearchParams();
    params.append('jData', JSON.stringify(orderPayload));

    console.log("📤 Order Request:", {
      url: `${s.baseUrl}/quick/order/rule/ms/place`,
      payload: orderPayload
    });

    const response = await axios.post(
      `${s.baseUrl}/quick/order/rule/ms/place`,
      params,  // Send as URLSearchParams
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );

    // Check if order was successful
    if (response.data.stat === "Ok") {
      console.log("✅ Order placed successfully:", response.data.nOrdNo);
      res.json({
        success: true,
        orderId: response.data.nOrdNo,
        message: "Order placed successfully",
        data: response.data
      });
    } else {
      console.error("❌ Order failed:", response.data);
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Order failed",
        code: response.data.stCode,
        data: response.data
      });
    }

  } catch (error) {
    console.error("❌ ORDER ERROR:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Handle different error scenarios
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.emsg || 
                        error.response?.data?.message || 
                        error.message;
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

// ---------------- HEALTH CHECK ----------------

app.get("/health", (req, res) => {
  const s = getSession();
  const subscriptions = Array.from(activeSubscriptions.entries()).map(([key, value]) => ({
    pSymbol: key,
    tradingSymbol: value.tradingSymbol,
    subscribers: value.sockets.size
  }));
  
  res.json({
    status: "ok",
    authenticated: !!s?.tradeToken,
    usingWebSocket: isUsingWebSocket(),
    timestamp: new Date().toISOString(),
    activeSubscriptions: subscriptions
  });
});

// ---------------- limit check ----------------
app.post("/api/limits", async (req, res) => {
  try {
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { 
      seg = "ALL",    // ALL, CASH, CUR, FO
      exch = "ALL",   // ALL, NSE, BSE
      prod = "ALL"    // ALL, NRML, CNC, MIS
    } = req.body;

    // Build the jData payload
    const limitsPayload = {
      seg: seg,
      exch: exch,
      prod: prod
    };

    // Convert to URLSearchParams as per API requirement
    const params = new URLSearchParams();
    params.append('jData', JSON.stringify(limitsPayload));

    console.log("📊 Fetching limits with payload:", limitsPayload);

    const response = await axios.post(
      `${s.baseUrl}/quick/user/limits`,
      params,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );

    // Check if limits fetch was successful
    if (response.data.stat === "Ok") {
      console.log("✅ Limits fetched successfully");
      
      // Format the response for better usability
      const formattedData = {
        success: true,
        data: {
          // Main account info
          accountId: response.data.EntityId,
          category: response.data.Category,
          
          // Key financial metrics
          netAvailable: parseFloat(response.data.Net || "0").toFixed(2),
          marginUsed: parseFloat(response.data.MarginUsed || "0").toFixed(2),
          collateralValue: parseFloat(response.data.CollateralValue || "0").toFixed(2),
          boardLotLimit: parseFloat(response.data.BoardLotLimit || "0").toFixed(2),
          adhocMargin: parseFloat(response.data.AdhocMargin || "0").toFixed(2),
          
          // Margin details
          spanMargin: parseFloat(response.data.SpanMarginPrsnt || "0").toFixed(2),
          exposureMargin: parseFloat(response.data.ExposureMarginPrsnt || "0").toFixed(2),
          varMargin: parseFloat(response.data.MarginVarPrsnt || "0").toFixed(2),
          specialMargin: parseFloat(response.data.SpecialMarginPrsnt || "0").toFixed(2),
          premiumMargin: parseFloat(response.data.PremiumPrsnt || "0").toFixed(2),
          
          // P&L
          unrealizedMTOM: parseFloat(response.data.UnrealizedMtomPrsnt || "0").toFixed(2),
          realizedMTOM: parseFloat(response.data.RealizedMtomPrsnt || "0").toFixed(2),
          
          // Cash
          notionalCash: parseFloat(response.data.NotionalCash || "0").toFixed(2),
          
          // Raw data for debugging
          raw: response.data
        },
        timestamp: Date.now()
      };
      
      res.json(formattedData);
    } else {
      console.error("❌ Limits fetch failed:", response.data);
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to fetch limits",
        code: response.data.stCode,
        data: response.data
      });
    }

  } catch (error) {
    console.error("❌ LIMITS ERROR:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.emsg || 
                        error.response?.data?.message || 
                        error.message;
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

// Add a GET endpoint for quick limits overview
app.get("/api/limits/overview", async (req, res) => {
  try {
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Use default ALL parameters for overview
    const params = new URLSearchParams();
    params.append('jData', JSON.stringify({
      seg: "ALL",
      exch: "ALL",
      prod: "ALL"
    }));

    const response = await axios.post(
      `${s.baseUrl}/quick/user/limits`,
      params,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );

    if (response.data.stat === "Ok") {
      // Return simplified overview
      res.json({
        success: true,
        data: {
          netAvailable: parseFloat(response.data.Net || "0").toFixed(2),
          marginUsed: parseFloat(response.data.MarginUsed || "0").toFixed(2),
          collateral: parseFloat(response.data.CollateralValue || "0").toFixed(2),
          unrealizedPnL: parseFloat(response.data.UnrealizedMtomPrsnt || "0").toFixed(2),
          realizedPnL: parseFloat(response.data.RealizedMtomPrsnt || "0").toFixed(2)
        },
        timestamp: Date.now()
      });
    } else {
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to fetch limits"
      });
    }

  } catch (error) {
    console.error("❌ LIMITS OVERVIEW ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ---------------- POSITIONS ENDPOINT - FIXED VERSION ----------------

app.get("/api/positions", async (req, res) => {
  try {
    const s = getSession();
    
    if (!s?.tradeToken) {
      console.log("❌ Positions: No session token");
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("📊 Fetching positions with session:", {
      baseUrl: s.baseUrl,
      hasToken: !!s.tradeToken,
      hasSid: !!s.tradeSid
    });

    // Make sure we have the correct base URL
    if (!s.baseUrl) {
      console.log("❌ Positions: No base URL");
      return res.status(400).json({ error: "No base URL available" });
    }

    const url = `${s.baseUrl}/quick/user/positions`;
    console.log("📡 GET:", url);

    const response = await axios.get(url, {
      headers: {
        "Auth": s.tradeToken,
        "Sid": s.tradeSid,
        "neo-fin-key": "neotradeapi",
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 10000
    });

    console.log("📥 Positions response status:", response.status);
    console.log("📥 Positions response data:", JSON.stringify(response.data, null, 2));

    // Check if response has the expected structure - FIXED CONDITION
    // The API returns 'ok' (lowercase), not 'Ok' (uppercase)
    if (response.data && (response.data.stat === "ok" || response.data.stat === "Ok")) {
      console.log(`✅ Positions fetched successfully: ${response.data.data?.length || 0} positions`);
      
      // Format the positions data
      const positions = response.data.data?.map(pos => {
        const netQty = parseInt(pos.qty || pos.flBuyQty - pos.flSellQty || "0");
        const buyAmt = parseFloat(pos.buyAmt || "0");
        const sellAmt = parseFloat(pos.sellAmt || "0");
        const buyQty = parseInt(pos.flBuyQty || "0");
        const sellQty = parseInt(pos.flSellQty || "0");
        
        // Calculate average buy/sell price
        const avgBuyPrice = buyQty > 0 ? buyAmt / buyQty : 0;
        const avgSellPrice = sellQty > 0 ? sellAmt / sellQty : 0;
        
        // Determine position type based on net quantity
        const positionType = netQty > 0 ? "LONG" : netQty < 0 ? "SHORT" : "FLAT";
        
        return {
          accountId: pos.actId,
          product: pos.prod,
          exchange: pos.exSeg,
          tradingSymbol: pos.trdSym,
          symbol: pos.sym || pos.trdSym?.replace('-EQ', ''),
          quantity: netQty,
          buyQuantity: buyQty,
          sellQuantity: sellQty,
          buyAmount: buyAmt,
          sellAmount: sellAmt,
          averageBuyPrice: avgBuyPrice,
          averageSellPrice: avgSellPrice,
          lastPrice: 0,
          pnl: 0,
          pnlPercentage: 0,
          positionType: positionType,
          isOpen: pos.posFlg === "true",
          canSquareOff: pos.sqrFlg === "Y",
          boardLot: parseInt(pos.brdLtQty || "1"),
          lotSize: parseInt(pos.lotSz || "1"),
          strikePrice: parseFloat(pos.stkPrc || "0"),
          updatedTime: pos.hsUpTm,
          raw: pos
        };
      }) || [];

      console.log(`✅ Formatted ${positions.length} positions`);

      res.json({
        success: true,
        data: positions,
        count: positions.length,
        timestamp: Date.now()
      });

    } else {
      // Handle API error response
      const errorMsg = response.data?.emsg || response.data?.message || "Unknown error";
      console.error("❌ Positions API error:", response.data);
      res.status(400).json({
        success: false,
        error: errorMsg,
        details: response.data,
        code: response.data?.stCode
      });
    }

  } catch (error) {
    console.error("❌ POSITIONS ERROR DETAILS:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.emsg || 
                        error.response?.data?.message || 
                        error.message;
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

// Add endpoint to square off a position
app.post("/api/positions/squareoff", async (req, res) => {
  try {
    const { 
      tradingSymbol, 
      exchange, 
      productType,
      quantity,
      positionType // "LONG" or "SHORT"
    } = req.body;
    
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!tradingSymbol || !exchange || !quantity || !positionType) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["tradingSymbol", "exchange", "quantity", "positionType"]
      });
    }

    // Determine side for square off
    // If LONG position, we need to SELL to square off
    // If SHORT position, we need to BUY to square off
    const side = positionType === "LONG" ? "S" : "B";

    // Place market order to square off
    const orderPayload = {
      am: "NO",
      dq: "0",
      es: exchange,
      mp: "0",
      pc: productType || "MIS",
      pf: "N",
      pr: "0",
      pt: "MKT",
      qt: Math.abs(quantity).toString(),
      rt: "DAY",
      tp: "0",
      ts: tradingSymbol,
      tt: side
    };

    const params = new URLSearchParams();
    params.append('jData', JSON.stringify(orderPayload));

    console.log("📤 Square off order:", orderPayload);

    const response = await axios.post(
      `${s.baseUrl}/quick/order/rule/ms/place`,
      params,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );

    if (response.data.stat === "Ok") {
      console.log("✅ Square off order placed:", response.data.nOrdNo);
      res.json({
        success: true,
        orderId: response.data.nOrdNo,
        message: "Square off order placed successfully"
      });
    } else {
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to square off position"
      });
    }

  } catch (error) {
    console.error("❌ SQUARE OFF ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ---------------- ORDER BOOK ENDPOINT ----------------
app.get("/api/orders/book", async (req, res) => {
  try {
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("📚 Fetching order book...");

    const response = await axios.get(
      `${s.baseUrl}/quick/user/orders`,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Accept": "application/json"
        }
      }
    );

    if (response.data.stat === "Ok") {
      console.log(`✅ Order book fetched: ${response.data.data?.length || 0} orders`);
      
      // Format the orders data
      const orders = response.data.data?.map(order => ({
        orderId: order.nOrdNo,
        tradingSymbol: order.trdSym,
        symbol: order.trdSym?.replace('-EQ', ''),
        status: order.ordSt || order.stat,
        quantity: parseInt(order.qty || "0"),
        filledQuantity: parseInt(order.fldQty || order.fillQty || "0"),
        price: parseFloat(order.prc || "0"),
        averagePrice: parseFloat(order.avgPrc || "0"),
        transactionType: order.trnsTp === "B" ? "BUY" : "SELL",
        orderType: order.prcTp === "L" ? "LIMIT" : 
                   order.prcTp === "MKT" ? "MARKET" :
                   order.prcTp === "SL" ? "SL" : "SL-M",
        productType: order.prod || "MIS",
        validity: order.vldt || "DAY",
        exchange: order.exSeg,
        rejectionReason: order.rejRsn,
        orderDateTime: order.ordDtTm,
        isAMO: order.ordGenTp === "AMO",
        raw: order
      })) || [];

      res.json({
        success: true,
        data: orders,
        count: orders.length,
        timestamp: Date.now()
      });

    } else {
      console.error("❌ Order book fetch failed:", response.data);
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to fetch orders",
        code: response.data.stCode
      });
    }

  } catch (error) {
    console.error("❌ ORDER BOOK ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ---------------- TRADE BOOK ENDPOINT ----------------
app.get("/api/orders/trades", async (req, res) => {
  try {
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("📊 Fetching trade book...");

    const response = await axios.get(
      `${s.baseUrl}/quick/user/trades`,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Accept": "application/json"
        }
      }
    );

    if (response.data.stat === "Ok") {
      console.log(`✅ Trade book fetched: ${response.data.data?.length || 0} trades`);
      
      // Format the trades data
      const trades = response.data.data?.map(trade => ({
        orderId: trade.nOrdNo,
        exchangeOrderId: trade.exOrdId,
        tradingSymbol: trade.trdSym,
        symbol: trade.trdSym?.replace('-EQ', ''),
        quantity: parseInt(trade.qty || "0"),
        filledQuantity: parseInt(trade.fldQty || "0"),
        price: parseFloat(trade.avgPrc || "0"),
        transactionType: trade.trnsTp === "B" ? "BUY" : "SELL",
        orderType: trade.prcTp === "L" ? "LIMIT" : 
                   trade.prcTp === "MKT" ? "MARKET" : "SL",
        productType: trade.prod || "MIS",
        validity: trade.ordDur || "DAY",
        exchange: trade.exSeg,
        tradeDate: trade.flDt,
        tradeTime: trade.exTm,
        userId: trade.usrId,
        raw: trade
      })) || [];

      res.json({
        success: true,
        data: trades,
        count: trades.length,
        timestamp: Date.now()
      });

    } else {
      console.error("❌ Trade book fetch failed:", response.data);
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to fetch trades",
        code: response.data.stCode
      });
    }

  } catch (error) {
    console.error("❌ TRADE BOOK ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ---------------- ORDER HISTORY ENDPOINT ----------------
app.post("/api/orders/history", async (req, res) => {
  try {
    const { orderId } = req.body;
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log(`📜 Fetching history for order: ${orderId}`);

    const params = new URLSearchParams();
    params.append('jData', JSON.stringify({ nOrdNo: orderId }));

    const response = await axios.post(
      `${s.baseUrl}/quick/order/history`,
      params,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );

    if (response.data.stat === "Ok") {
      console.log(`✅ Order history fetched: ${response.data.data?.length || 0} entries`);
      
      // Format the history data
      const history = response.data.data?.map(entry => ({
        orderId: entry.nOrdNo,
        status: entry.ordSt,
        quantity: parseInt(entry.qty || "0"),
        price: parseFloat(entry.prc || "0"),
        averagePrice: parseFloat(entry.avgPrc || "0"),
        transactionType: entry.trnsTp === "B" ? "BUY" : "SELL",
        orderType: entry.prcTp === "L" ? "LIMIT" : 
                   entry.prcTp === "MKT" ? "MARKET" : "SL",
        productType: entry.prod || "MIS",
        filledDateTime: entry.flDtTm,
        rejectionReason: entry.rejRsn,
        raw: entry
      })) || [];

      res.json({
        success: true,
        data: history,
        count: history.length,
        orderId: orderId,
        timestamp: Date.now()
      });

    } else {
      console.error("❌ Order history fetch failed:", response.data);
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to fetch order history",
        code: response.data.stCode
      });
    }

  } catch (error) {
    console.error("❌ ORDER HISTORY ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ---------------- CANCEL ORDER ENDPOINT ----------------
app.post("/api/orders/cancel", async (req, res) => {
  try {
    const { orderId, tradingSymbol, exchange } = req.body;
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!orderId || !tradingSymbol || !exchange) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["orderId", "tradingSymbol", "exchange"]
      });
    }

    console.log(`❌ Cancelling order: ${orderId}`);

    // Cancel order payload
    const cancelPayload = {
      nOrdNo: orderId,
      ts: tradingSymbol,
      es: exchange
    };

    const params = new URLSearchParams();
    params.append('jData', JSON.stringify(cancelPayload));

    const response = await axios.post(
      `${s.baseUrl}/quick/order/rule/ms/cancel`,
      params,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );

    if (response.data.stat === "Ok") {
      console.log(`✅ Order cancelled successfully: ${orderId}`);
      res.json({
        success: true,
        message: "Order cancelled successfully",
        orderId: orderId,
        data: response.data
      });
    } else {
      console.error("❌ Cancel order failed:", response.data);
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to cancel order",
        code: response.data.stCode
      });
    }

  } catch (error) {
    console.error("❌ CANCEL ORDER ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ---------------- MODIFY ORDER ENDPOINT ----------------
app.post("/api/orders/modify", async (req, res) => {
  try {
    const { 
      orderId, 
      tradingSymbol, 
      exchange, 
      quantity, 
      price,
      triggerPrice,
      orderType,
      validity 
    } = req.body;
    
    const s = getSession();
    
    if (!s?.tradeToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!orderId || !tradingSymbol || !exchange || !quantity) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["orderId", "tradingSymbol", "exchange", "quantity"]
      });
    }

    console.log(`✏️ Modifying order: ${orderId}`);

    // Map order type to API format
    let apiOrderType = orderType;
    if (orderType === "MARKET") apiOrderType = "MKT";
    if (orderType === "LIMIT") apiOrderType = "L";

    // Modify order payload
    const modifyPayload = {
      nOrdNo: orderId,
      ts: tradingSymbol,
      es: exchange,
      qt: quantity.toString(),
      pr: price?.toString() || "0",
      tp: triggerPrice?.toString() || "0",
      pt: apiOrderType || "MKT",
      rt: validity || "DAY"
    };

    const params = new URLSearchParams();
    params.append('jData', JSON.stringify(modifyPayload));

    const response = await axios.post(
      `${s.baseUrl}/quick/order/rule/ms/modify`,
      params,
      {
        headers: {
          "Auth": s.tradeToken,
          "Sid": s.tradeSid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );

    if (response.data.stat === "Ok") {
      console.log(`✅ Order modified successfully: ${orderId}`);
      res.json({
        success: true,
        message: "Order modified successfully",
        orderId: orderId,
        data: response.data
      });
    } else {
      console.error("❌ Modify order failed:", response.data);
      res.status(400).json({
        success: false,
        error: response.data.emsg || "Failed to modify order",
        code: response.data.stCode
      });
    }

  } catch (error) {
    console.error("❌ MODIFY ORDER ERROR:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ---------------- DEBUG ENDPOINTS ----------------

app.get("/debug/symbol/:query", (req, res) => {
  const results = searchSymbols(req.params.query);
  res.json({
    query: req.params.query,
    results: results.slice(0, 10),
    total: results.length,
    withPSymbol: results.map(s => ({
      ...s,
      pSymbol: getPSymbol(s.symbol)
    }))
  });
});

app.get("/debug/map/:symbol", (req, res) => {
  const symbol = req.params.symbol;
  const pSymbol = getPSymbol(symbol);
  const tradingSymbol = pSymbol ? getTradingSymbol(pSymbol) : null;
  
  res.json({
    tradingSymbol: symbol,
    pSymbol: pSymbol,
    mappedBackTo: tradingSymbol,
    works: tradingSymbol === symbol
  });
});

// ---------------- WEB SOCKET SETUP ----------------

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  socket.emit('connected', { 
    id: socket.id,
    timestamp: Date.now(),
    message: 'Connected to trading terminal'
  });

  // Handle subscription requests
  socket.on('subscribe', (symbols) => {
    try {
      const symbolList = Array.isArray(symbols) ? symbols : [symbols];
      let subscriptionsChanged = false;
      
      symbolList.forEach(symbol => {
        if (!symbol) return;
        
        const pSymbol = getPSymbol(symbol);
        
        if (pSymbol) {
          // Track subscription with pSymbol as key
          if (!activeSubscriptions.has(pSymbol)) {
            activeSubscriptions.set(pSymbol, {
              tradingSymbol: symbol,
              pSymbol: pSymbol,
              sockets: new Set()
            });
            subscriptionsChanged = true;
          }
          activeSubscriptions.get(pSymbol).sockets.add(socket.id);
          
        } else {
          console.log(`⚠️ No pSymbol found for ${symbol}`);
        }
      });

      if (subscriptionsChanged) {
        // Update WebSocket subscriptions if active
        updateWebSocketSubscriptions(activeSubscriptions);
      }

      socket.emit('subscribed', { 
        symbols: symbolList,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Subscription error:', error);
      socket.emit('error', { message: 'Failed to subscribe', error: error.message });
    }
  });

  // Handle unsubscribe requests
  socket.on('unsubscribe', (symbols) => {
    try {
      const symbolList = Array.isArray(symbols) ? symbols : [symbols];
      let subscriptionsChanged = false;
      
      symbolList.forEach(symbol => {
        const pSymbol = getPSymbol(symbol);
        const key = pSymbol || symbol;
        
        if (activeSubscriptions.has(key)) {
          activeSubscriptions.get(key).sockets.delete(socket.id);
          if (activeSubscriptions.get(key).sockets.size === 0) {
            activeSubscriptions.delete(key);
            subscriptionsChanged = true;
          }
        }
      });

      if (subscriptionsChanged) {
        updateWebSocketSubscriptions(activeSubscriptions);
      }

      console.log(`📴 Client ${socket.id} unsubscribed from:`, symbolList);
      socket.emit('unsubscribed', { 
        symbols: symbolList,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Unsubscribe error:', error);
      socket.emit('error', { message: 'Failed to unsubscribe', error: error.message });
    }
  });

  // Handle get all active symbols
  socket.on('getActiveSymbols', () => {
    const symbols = Array.from(activeSubscriptions.values()).map(s => s.tradingSymbol);
    socket.emit('activeSymbols', { symbols });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    
    // Clean up subscriptions
    let subscriptionsChanged = false;
    activeSubscriptions.forEach((data, key) => {
      if (data.sockets.has(socket.id)) {
        data.sockets.delete(socket.id);
        if (data.sockets.size === 0) {
          activeSubscriptions.delete(key);
          subscriptionsChanged = true;
        }
      }
    });
    
    if (subscriptionsChanged) {
      updateWebSocketSubscriptions(activeSubscriptions);
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error for client', socket.id, ':', error);
  });
});

// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 CORS enabled for all origins`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopLTP();
  io.close(() => {
    console.log('Socket.io server closed');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});

// Run the algo evaluation loop every 1 second
setInterval(() => {
  evaluateAlgoRules().catch(err => console.error("Algo Loop Error:", err));
}, 1000);

export { io, activeSubscriptions };