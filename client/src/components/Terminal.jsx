// Terminal.jsx - Updated with LimitsPanel in right sidebar and LTP data passed to Positions
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Main Trading Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Watchlist */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <Watchlist 
            onSelect={setSelected} 
            onUpdateSymbols={updateWatchlistSymbols}
            ltpData={ltpData}
          />
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Order Panel */}
          <div className="bg-white border-b border-gray-200 p-2">
            <OrderPanel 
              selected={selected} 
              onClose={() => setSelected(null)} 
              ltpData={ltpData}
              currentPrice={getSelectedSymbolLTP()}
            />
          </div>

          {/* Bottom Panel - Positions & Orders */}
          <div className="flex-1 bg-gray-50 p-4 overflow-hidden">
            {/* View Toggle */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveView("positions")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeView === "positions"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                Positions
              </button>
              <button
                onClick={() => setActiveView("orders")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeView === "orders"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                Orders
              </button>
            </div>

            {/* Content - Pass ltpData to Positions component */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[calc(100%-48px)] overflow-hidden">
              {activeView === "positions" ? 
                <Positions ltpData={ltpData} /> : 
                <Orders />
              }
            </div>
          </div>
        </div>

        {/* Right Sidebar - Market Info & Limits */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">MARKET OVERVIEW</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">NIFTY 50</span>
                <span className="text-sm font-medium text-gray-800">
                  {ltpData["Nifty 50"] ? `₹${ltpData["Nifty 50"].price}` : '22,345.50'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">BANK NIFTY</span>
                <span className="text-sm font-medium text-gray-800">47,890.25</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">INDIA VIX</span>
                <span className="text-sm font-medium text-gray-800">14.25</span>
              </div>
            </div>

            {/* Add Limits Panel here */}
            <LimitsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}