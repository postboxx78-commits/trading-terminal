import axios from "axios";
import { getCachedPrice } from "./ltp.js";
import { searchSymbols } from "./symbols.js";

export const activeRules = [];

// In-memory Tick-to-Candle Aggregator
const liveCandles = {}; // Structure: { "RELIANCE-EQ": { "5": [{open, high, low, close, time}], "15": [...] } }

export function parseAndAddRule(prompt, defaultQty = 1) {
  const p = prompt.toLowerCase();
  
  // Extract Base Intent
  const actionMatch = p.match(/(enter|buy|short|exit|sell)/);
  const symbolMatch = p.match(/(?:on|from)\s+([a-z0-9]+)/);
  const tfMatch = p.match(/(\d+)m/);
  const slMatch = p.match(/sl\s+(\d+(\.\d+)?)/);
  const tgtMatch = p.match(/(?:target|tgt)\s+(\d+(\.\d+)?)/);

  if (!actionMatch || !symbolMatch) throw new Error("Could not parse action (enter/exit) or symbol.");

  const action = ["enter", "buy"].includes(actionMatch[1]) ? "B" : "S";
  const rawSymbol = symbolMatch[1].toUpperCase();
  const tf = tfMatch ? parseInt(tfMatch[1]) : 0; // 0 = tick level, 5 = 5m, 15 = 15m

  // Resolve Symbol
  const searchResults = searchSymbols(rawSymbol);
  const tradingSymbol = searchResults.length > 0 ? searchResults[0].symbol : `${rawSymbol}-EQ`;

  // Extract Condition Logic
  let condition = { type: "tick_cross", operator: "", price: 0 };

  if (p.includes("rejection")) {
    condition = { type: "rejection", style: action === "B" ? "bullish" : "bearish" };
  } else if (p.includes("prev") || p.includes("previous")) {
    const isAbove = p.includes("above");
    const isHigh = p.includes("high");
    condition = { 
      type: "previous_candle", 
      operator: isAbove ? "above" : "below", 
      target: isHigh ? "high" : "low" 
    };
  } else if (p.includes("close")) {
    const priceMatch = p.match(/(?:above|below)\s+(\d+(\.\d+)?)/);
    if (!priceMatch) throw new Error("Missing price for close condition.");
    condition = { 
      type: "tf_close", 
      operator: p.includes("above") ? "above" : "below", 
      price: parseFloat(priceMatch[1]) 
    };
  } else {
    // Basic tick cross fallback
    const priceMatch = p.match(/(?:above|below)\s+(\d+(\.\d+)?)/);
    if (priceMatch) {
      condition = { type: "tick_cross", operator: p.includes("above") ? "above" : "below", price: parseFloat(priceMatch[1]) };
    }
  }

  const rule = {
    id: Date.now(),
    prompt,
    symbol: tradingSymbol,
    action,
    tf,
    condition,
    slPrice: slMatch ? parseFloat(slMatch[1]) : null,
    tgtPrice: tgtMatch ? parseFloat(tgtMatch[1]) : null,
    qty: defaultQty,
    active: true
  };

  activeRules.push(rule);
  return rule;
}

// Tick-to-Candle Aggregator
function updateCandles(symbol, ltp, timestampStr) {
  const ts = parseInt(timestampStr) || Date.now();
  const ltpFloat = parseFloat(ltp);
  
  if (!liveCandles[symbol]) liveCandles[symbol] = { "5": [], "15": [] };

  [5, 15].forEach(tf => {
    const tfMs = tf * 60 * 1000;
    const candleTime = Math.floor(ts / tfMs) * tfMs; // Snap to nearest interval

    let history = liveCandles[symbol][tf];
    let currentCandle = history.length > 0 ? history[history.length - 1] : null;

    if (!currentCandle || currentCandle.time !== candleTime) {
      // New candle started. Close the old one and push new.
      if (currentCandle) currentCandle.isClosed = true;
      history.push({ time: candleTime, open: ltpFloat, high: ltpFloat, low: ltpFloat, close: ltpFloat, isClosed: false });
      if (history.length > 5) history.shift(); // Keep memory light (only last 5 candles)
    } else {
      // Update ongoing candle
      currentCandle.high = Math.max(currentCandle.high, ltpFloat);
      currentCandle.low = Math.min(currentCandle.low, ltpFloat);
      currentCandle.close = ltpFloat;
    }
  });
}

// Evaluation Loop
export async function evaluateAlgoRules() {
  for (let rule of activeRules) {
    if (!rule.active) continue;

    const tick = getCachedPrice(rule.symbol);
    if (!tick || !tick.lastPrice) continue;
    const ltp = parseFloat(tick.lastPrice);

    // Update candle aggregator with the latest tick
    updateCandles(rule.symbol, ltp, tick.timestamp);

    let conditionMet = false;

    // 1. Tick Level (Instant Execution)
    if (rule.condition.type === "tick_cross") {
      if (rule.condition.operator === "above" && ltp > rule.condition.price) conditionMet = true;
      if (rule.condition.operator === "below" && ltp < rule.condition.price) conditionMet = true;
    } 
    // 2. Timeframe Dependent Execution
    else if (rule.tf > 0 && liveCandles[rule.symbol]?.[rule.tf]?.length >= 2) {
      const history = liveCandles[rule.symbol][rule.tf];
      const lastClosedCandle = history[history.length - 2]; 
      
      // We only evaluate exactly when a candle closes (to prevent duplicate firing during the minute)
      if (lastClosedCandle && lastClosedCandle.evaluatedFor !== rule.id) {
        
        // A. Timeframe Close Above/Below
        if (rule.condition.type === "tf_close") {
          if (rule.condition.operator === "above" && lastClosedCandle.close > rule.condition.price) conditionMet = true;
          if (rule.condition.operator === "below" && lastClosedCandle.close < rule.condition.price) conditionMet = true;
        }
        
        // B. Rejection Candle (Pin Bar)
        if (rule.condition.type === "rejection") {
          const totalSize = lastClosedCandle.high - lastClosedCandle.low;
          if (totalSize > 0) {
            if (rule.condition.style === "bullish") {
              const lowerWick = Math.min(lastClosedCandle.open, lastClosedCandle.close) - lastClosedCandle.low;
              // Bullish Rejection: Lower wick is > 60% of total candle size
              if (lowerWick / totalSize > 0.6) conditionMet = true;
            } else if (rule.condition.style === "bearish") {
              const upperWick = lastClosedCandle.high - Math.max(lastClosedCandle.open, lastClosedCandle.close);
              // Bearish Rejection: Upper wick is > 60% of total candle size
              if (upperWick / totalSize > 0.6) conditionMet = true;
            }
          }
        }
        
        // C. Close relative to Previous Candle
        if (rule.condition.type === "previous_candle" && history.length >= 3) {
          const prevCandle = history[history.length - 3]; // The candle before the one that just closed
          const comparePrice = rule.condition.target === "high" ? prevCandle.high : prevCandle.low;
          
          if (rule.condition.operator === "above" && lastClosedCandle.close > comparePrice) conditionMet = true;
          if (rule.condition.operator === "below" && lastClosedCandle.close < comparePrice) conditionMet = true;
        }

        lastClosedCandle.evaluatedFor = rule.id; // Mark as evaluated to prevent firing again
      }
    }

    if (conditionMet) {
      rule.active = false; 
      console.log(`⚡ ALGO TRIGGERED: ${rule.symbol} met condition [${rule.condition.type}]`);
      await executeAlgoOrder(rule, ltp);
    }
  }
}

async function executeAlgoOrder(rule, currentLtp) {
  try {
    const buffer = 0.005; // 0.5% limit buffer
    const limitPrice = rule.action === "B" ? currentLtp * (1 + buffer) : currentLtp * (1 - buffer);
    const entryPrc = parseFloat(limitPrice.toFixed(2));
    const isBracketOrder = rule.slPrice || rule.tgtPrice;

    const payload = {
      symbol: rule.symbol,
      exch: "nse_cm",
      qty: rule.qty,
      side: rule.action,
      orderType: "LIMIT",
      price: entryPrc.toString(),
      productType: isBracketOrder ? "BO" : "MIS",
      validity: "DAY"
    };

    if (isBracketOrder) {
      const slDiff = rule.slPrice ? Math.abs(entryPrc - rule.slPrice).toFixed(2) : "0";
      const tgtDiff = rule.tgtPrice ? Math.abs(rule.tgtPrice - entryPrc).toFixed(2) : "0";
      payload.boParams = {
        squareOffType: "Absolute",
        stopLossType: "Absolute",
        stopLossValue: slDiff,
        squareOffValue: tgtDiff,
        trailingStopLoss: false
      };
    }

    const PORT = process.env.PORT || 3001;
    const response = await axios.post(`http://127.0.0.1:${PORT}/order`, payload);
    console.log(`✅ ALGO ORDER PLACED:`, response.data.orderId);
  } catch (error) {
    console.error(`❌ ALGO EXECUTION FAILED:`, error.response?.data || error.message);
    rule.active = true; 
  }
}