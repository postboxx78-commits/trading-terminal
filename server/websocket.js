// websocket.js
import WebSocket from "ws";
import { getSession } from "./auth.js";

let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
let pingInterval = null;

export function startWebSocketStream(io, activeSubscriptions) {
  const session = getSession();
  
  if (!session?.wsUrl) {
    console.log("⚠️ No WebSocket URL available, falling back to polling");
    return false;
  }

  connectWebSocket(io, activeSubscriptions);
  return true;
}

function connectWebSocket(io, activeSubscriptions) {
  const session = getSession();
  
  if (!session) {
    console.log("❌ No session available for WebSocket");
    return;
  }

  try {
    // Construct WebSocket URL with authentication
    // Format may vary based on Kotak Neo's actual WebSocket endpoint
    const wsUrl = `${session.wsUrl}?token=${session.wsToken}&sid=${session.tradeSid}&uid=${session.userId || ''}`;
    
    console.log("🔌 Connecting to WebSocket:", wsUrl.replace(/token=[^&]+/, 'token=HIDDEN'));
    
    ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('✅ WebSocket connected for real-time quotes');
      reconnectAttempts = 0;
      
      // Start ping to keep connection alive
      startPing();
      
      // Subscribe to all active symbols
      setTimeout(() => {
        subscribeToAllSymbols(ws, activeSubscriptions);
      }, 1000);
    });

    ws.on('message', (data) => {
      try {
        const message = data.toString();
        handleWebSocketMessage(message, io, activeSubscriptions);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket disconnected: ${code} - ${reason || 'No reason'}`);
      stopPing();
      
      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(() => connectWebSocket(io, activeSubscriptions), RECONNECT_DELAY * reconnectAttempts);
      } else {
        console.log('❌ Max reconnection attempts reached');
      }
    });

  } catch (error) {
    console.error('❌ WebSocket connection error:', error);
  }
}

function startPing() {
  pingInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Send ping message - format depends on Kotak Neo's requirements
      const pingMsg = JSON.stringify({ type: 'ping', timestamp: Date.now() });
      ws.send(pingMsg);
    }
  }, 30000); // Send ping every 30 seconds
}

function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

function subscribeToAllSymbols(ws, activeSubscriptions) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log("WebSocket not ready for subscription");
    return;
  }

  const subscriptions = Array.from(activeSubscriptions.values());
  
  if (subscriptions.length === 0) {
    // Subscribe to Nifty by default
    const subscribeMsg = {
      type: 'subscribe',
      symbols: [{ exchange: 'NSE', token: '26000' }] // Nifty pSymbol
    };
    ws.send(JSON.stringify(subscribeMsg));
    console.log("📡 Subscribed to Nifty (default)");
  } else {
    // Subscribe to all symbols using pSymbols
    const symbols = subscriptions.map(sub => ({ 
      exchange: 'NSE', 
      token: sub.pSymbol 
    }));
    
    const subscribeMsg = {
      type: 'subscribe',
      symbols: symbols
    };
    
    ws.send(JSON.stringify(subscribeMsg));
    console.log(`📡 Subscribed to ${symbols.length} symbols via WebSocket`);
  }
}

function handleWebSocketMessage(message, io, activeSubscriptions) {
  try {
    // Try to parse as JSON
    const data = JSON.parse(message);
    
    // Handle different message types based on Kotak Neo's format
    // This is a generic handler - adjust based on actual API response
    
    if (data.type === 'quote' || data.type === 'ltp' || data.tk) {
      // Common formats: { tk: '2885', lp: '1423.50', ch: '2.50', pc: '0.18' }
      const pSymbol = data.tk || data.token || data.exchange_token;
      const ltp = data.lp || data.ltp || data.lastPrice;
      const change = data.ch || data.change;
      const perChange = data.pc || data.per_change;
      const volume = data.v || data.volume;
      const timestamp = data.ts || data.timestamp || Date.now();
      
      if (pSymbol && ltp) {
        // Find the trading symbol for this pSymbol
        let tradingSymbol = null;
        let sockets = new Set();
        
        // Look through active subscriptions
        for (const [key, sub] of activeSubscriptions.entries()) {
          if (sub.pSymbol === pSymbol.toString()) {
            tradingSymbol = sub.tradingSymbol;
            sockets = sub.sockets;
            break;
          }
        }
        
        if (tradingSymbol && sockets.size > 0) {
          const tickData = {
            tradingSymbol: tradingSymbol,
            lastPrice: ltp,
            status: "LIVE",
            change: change || "0",
            perChange: perChange || "0",
            volume: volume || "0",
            timestamp: timestamp.toString(),
            exchange: "NSE"
          };

          // Emit to all subscribed sockets
          sockets.forEach(socketId => {
            io.to(socketId).emit("tick", tickData);
          });
          
          console.log(`📈 WebSocket ${tradingSymbol}:`, ltp);
        }
      }
    } else if (data.type === 'pong' || data.type === 'heartbeat') {
      // Ignore heartbeat messages
    } else {
      // console.log("Other WebSocket message:", data);
    }
  } catch (e) {
    // If not JSON, might be binary or other format
    // console.log("Non-JSON message:", message.substring(0, 100));
  }
}

export function updateWebSocketSubscriptions(activeSubscriptions) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  
  subscribeToAllSymbols(ws, activeSubscriptions);
}

export function closeWebSocket() {
  stopPing();
  if (ws) {
    ws.close();
    ws = null;
  }
}