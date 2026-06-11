// ltp.js
import axios from "axios";
import { getSession } from "./auth.js";
import { startWebSocketStream, closeWebSocket, updateWebSocketSubscriptions } from "./websocket.js";

let pollingInterval = null;
let usingWebSocket = false;
let lastPrice = null;
let priceCache = new Map();

export function startLTP(io, activeSubscriptions) {
  // Try WebSocket first for real-time updates
  const wsStarted = startWebSocketStream(io, activeSubscriptions);
  
  if (wsStarted) {
    usingWebSocket = true;
    console.log("🔌 Using WebSocket for real-time quotes");
    
    // Still start a slow polling fallback (every 10 seconds) in case WebSocket misses updates
    startSlowPollingFallback(io, activeSubscriptions);
    return;
  }
  
  // Fallback to fast polling if WebSocket not available
  console.log("⚠️ WebSocket not available, falling back to fast polling (1s intervals)");
  startFastPolling(io, activeSubscriptions);
}

function startFastPolling(io, activeSubscriptions) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  pollingInterval = setInterval(async () => {
    const s = getSession();
    if (!s?.tradeToken || !s?.baseUrl) {
      return;
    }

    try {
      const subscribedPSymbols = Array.from(activeSubscriptions.keys());
      
      if (subscribedPSymbols.length === 0) {
        await fetchAndEmitNifty(io, s);
      } else {
        await fetchBulkQuotes(io, s, subscribedPSymbols, activeSubscriptions);
      }

    } catch (error) {
      console.error("Polling Error:", error.response?.data || error.message);
    }
  }, 1000); // 1 second for fast updates
}

function startSlowPollingFallback(io, activeSubscriptions) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  pollingInterval = setInterval(async () => {
    // Only poll if WebSocket is not working or has missed updates
    const s = getSession();
    if (!s?.tradeToken || !s?.baseUrl || usingWebSocket) {
      return;
    }

    try {
      const subscribedPSymbols = Array.from(activeSubscriptions.keys());
      
      if (subscribedPSymbols.length === 0) {
        await fetchAndEmitNifty(io, s);
      } else {
        await fetchBulkQuotes(io, s, subscribedPSymbols, activeSubscriptions);
      }

    } catch (error) {
      console.error("Fallback Polling Error:", error.message);
    }
  }, 10000); // 10 seconds as fallback
}

async function fetchAndEmitNifty(io, session) {
  try {
    const response = await axios.get(
      `${session.baseUrl}/script-details/1.0/quotes/neosymbol/nse_cm|Nifty 50/ltp`,
      {
        headers: {
          "Authorization": process.env.NEO_ACCESS_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const data = response.data[0];
      lastPrice = data.ltp;

      const tickData = {
        tradingSymbol: "Nifty 50",
        lastPrice: data.ltp,
        status: "LIVE",
        change: data.change || "0",
        perChange: data.per_change || "0",
        volume: data.last_volume || "0",
        timestamp: data.lstup_time || Date.now().toString(),
        exchange: "nse_cm",
        open: data.ohlc?.open,
        high: data.ohlc?.high,
        low: data.ohlc?.low,
        close: data.ohlc?.close
      };

      priceCache.set("Nifty 50", tickData);
      io.emit("tick", tickData);
    }
  } catch (error) {
    // Silent fail for polling
  }
}

async function fetchBulkQuotes(io, session, pSymbols, activeSubscriptions) {
  try {
    const batchSize = 10;
    for (let i = 0; i < pSymbols.length; i += batchSize) {
      const batch = pSymbols.slice(i, i + batchSize);
      await fetchQuoteBatch(io, session, batch, activeSubscriptions);
    }
  } catch (error) {
    console.error("Error in bulk quotes:", error.message);
  }
}

async function fetchQuoteBatch(io, session, pSymbols, activeSubscriptions) {
  try {
    const queryParts = [];
    
    for (const pSymbol of pSymbols) {
      if (pSymbol === "Nifty 50") continue;
      queryParts.push(`nse_cm|${pSymbol}`);
    }

    if (queryParts.length === 0) return;

    const queryString = queryParts.join(',');
    
    const response = await axios.get(
      `${session.baseUrl}/script-details/1.0/quotes/neosymbol/${queryString}/ltp`,
      {
        headers: {
          "Authorization": process.env.NEO_ACCESS_TOKEN,
          "Content-Type": "application/json"
        },
        timeout: 5000
      }
    );

    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(data => {
        const pSymbolFromResponse = data.exchange_token?.toString();
        
        if (pSymbolFromResponse) {
          const subscription = activeSubscriptions.get(pSymbolFromResponse);
          
          if (subscription && subscription.tradingSymbol) {
            const tickData = {
              tradingSymbol: subscription.tradingSymbol,
              lastPrice: data.ltp,
              status: "LIVE",
              change: data.change || "0",
              perChange: data.per_change || "0",
              volume: data.last_volume || "0",
              timestamp: data.lstup_time || Date.now().toString(),
              exchange: "nse_cm",
              open: data.ohlc?.open,
              high: data.ohlc?.high,
              low: data.ohlc?.low,
              close: data.ohlc?.close
            };

            priceCache.set(subscription.tradingSymbol, tickData);
            
            subscription.sockets.forEach(socketId => {
              io.to(socketId).emit("tick", tickData);
            });
          }
        }
      });
    }
  } catch (error) {
    // Silent fail for polling
  }
}

export function stopLTP() {
  closeWebSocket();
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  console.log("📊 LTP streaming stopped");
}

export function getCachedPrice(symbol) {
  return priceCache.get(symbol) || null;
}

export function isUsingWebSocket() {
  return usingWebSocket;
}