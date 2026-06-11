// hooks/useLTP.js
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

export default function useLTP(watchlistSymbols = []) {
  const [ltpData, setLtpData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to socket server
    socketRef.current = io("http://140.245.234.6:3001");

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      setIsConnected(true);
      
      // Subscribe to watchlist symbols when connected
      if (watchlistSymbols.length > 0) {
        console.log("📡 Subscribing to:", watchlistSymbols);
        socketRef.current.emit("subscribe", watchlistSymbols);
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket server");
      setIsConnected(false);
    });

    // Listen for market ticks
    socketRef.current.on("tick", (data) => {
      console.log("📊 Received tick:", data);
      
      setLtpData(prev => {
        const symbol = data.tradingSymbol;
        const currentPrice = parseFloat(data.lastPrice) || 0;
        const prevPrice = prev[symbol]?.price || currentPrice;
        
        // Calculate real-time change
        const change = currentPrice - prevPrice;
        const perChange = prevPrice ? ((change / prevPrice) * 100) : 0;
        
        const newData = {
          ...prev,
          [symbol]: {
            price: currentPrice,
            prevPrice: prevPrice,
            status: data.status,
            change: data.change || change.toFixed(2),
            perChange: data.perChange || perChange.toFixed(2),
            timestamp: data.timestamp,
            volume: data.volume,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close
          }
        };
        
        console.log(`🔄 Updated ${symbol}:`, newData[symbol]);
        return newData;
      });
    });

    // Handle subscription confirmation
    socketRef.current.on("subscribed", (data) => {
      console.log("✅ Subscribed to:", data.symbols);
    });

    // Handle errors
    socketRef.current.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Update subscriptions when watchlist changes
  useEffect(() => {
    if (socketRef.current?.connected && watchlistSymbols.length > 0) {
      console.log("🔄 Updating subscriptions to:", watchlistSymbols);
      socketRef.current.emit("subscribe", watchlistSymbols);
    }
  }, [watchlistSymbols]);

  // Log ltpData changes for debugging
  useEffect(() => {
    if (Object.keys(ltpData).length > 0) {
      console.log("📊 Current LTP Data:", ltpData);
    }
  }, [ltpData]);

  return {
    ltpData,
    isConnected
  };
}