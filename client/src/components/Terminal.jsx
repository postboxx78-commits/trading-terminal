// Terminal.jsx - Enhanced layout with better visual hierarchy and responsive design
import { useState } from "react";
import Header from "./Header";
import Watchlist from "./Watchlist";
import OrderPanel from "./OrderPanel";
import Positions from "./Positions";
import Orders from "./Orders";
import LimitsPanel from "./LimitsPanel";
import useLTP from "../hooks/useLTP";

export default function Terminal() {
  const [selected, setSelected] = useState(null);
  const [activeView, setActiveView] = useState("positions");
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  
  const { ltpData, isConnected } = useLTP(watchlistSymbols);

  const updateWatchlistSymbols = (symbols) => {
    setWatchlistSymbols(symbols);
  };

  const getSelectedSymbolLTP = () => {
    if (!selected) return null;
    return ltpData[selected.symbol]?.price || null;
  };

  const marketIndices = [
    { name: "NIFTY 50", symbol: "Nifty 50", value: ltpData["Nifty 50"]?.price || "22,345.50", change: ltpData["Nifty 50"]?.change || "+0.25%" },
    { name: "BANK NIFTY", symbol: "Bank Nifty", value: ltpData["Bank Nifty"]?.price || "47,890.25", change: "+0.18%" },
    { name: "INDIA VIX", symbol: "India VIX", value: ltpData["India VIX"]?.price || "14.25", change: "-2.30%" },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      {/* Main Trading Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Watchlist */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
          <Watchlist 
            onSelect={setSelected} 
            onUpdateSymbols={updateWatchlistSymbols}
            ltpData={ltpData}
          />
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Order Panel */}
          <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
            <OrderPanel 
              selected={selected} 
              onClose={() => setSelected(null)} 
              ltpData={ltpData}
              currentPrice={getSelectedSymbolLTP()}
            />
          </div>

          {/* Bottom Panel - Positions & Orders */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* View Toggle with enhanced styling */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveView("positions")}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeView === "positions"
                    ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                📊 Positions
              </button>
              <button
                onClick={() => setActiveView("orders")}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeView === "orders"
                    ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                📋 Orders
              </button>
            </div>

            {/* Content - Enhanced card design */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-md h-[calc(100%-52px)] overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {activeView === "positions" ? 
                <Positions ltpData={ltpData} /> : 
                <Orders />
              }
            </div>
          </div>
        </div>

        {/* Right Sidebar - Market Info & Limits */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MARKET OVERVIEW</h3>
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[8px] text-gray-400">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {marketIndices.map((index) => (
                <div key={index.name} className="group flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl hover:from-gray-100 hover:to-gray-100 transition-all duration-200 cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">{index.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-800">₹{index.value}</span>
                    <span className={`text-[10px] ml-2 ${index.change.startsWith('+') ? 'text-green-600' : index.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'}`}>
                      {index.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Limits Panel with improved styling */}
            <LimitsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}