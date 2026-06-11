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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { ltpData, isConnected } = useLTP(watchlistSymbols);

  const updateWatchlistSymbols = (symbols) => {
    setWatchlistSymbols(symbols);
  };

  const getSelectedSymbolLTP = () => {
    if (!selected) return null;
    return ltpData[selected.symbol]?.price || null;
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f0f1a]">
      <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar - Watchlist (mobile drawer) */}
        <div className={`
          fixed lg:relative z-30 w-80 h-full bg-[#1a1a2e] border-r border-[#2a2a3e] transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Watchlist 
            onSelect={setSelected} 
            onUpdateSymbols={updateWatchlistSymbols}
            ltpData={ltpData}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-2 lg:p-3">
          {/* Compact Order Panel */}
          <div className="mb-3">
            <OrderPanel 
              selected={selected} 
              onClose={() => setSelected(null)} 
              ltpData={ltpData}
              currentPrice={getSelectedSymbolLTP()}
            />
          </div>

          {/* Bottom Panel - Positions & Orders */}
          <div className="flex-1 min-h-0 bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] overflow-hidden">
            <div className="flex space-x-1 p-2 border-b border-[#2a2a3e] bg-[#16162a]">
              <button
                onClick={() => setActiveView("positions")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeView === "positions"
                    ? "bg-[#0f3460] text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#252540]"
                }`}
              >
                Positions
              </button>
              <button
                onClick={() => setActiveView("orders")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeView === "orders"
                    ? "bg-[#0f3460] text-white"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#252540]"
                }`}
              >
                Orders
              </button>
            </div>
            <div className="h-[calc(100%-48px)] overflow-auto">
              {activeView === "positions" ? 
                <Positions ltpData={ltpData} /> : 
                <Orders />
              }
            </div>
          </div>
        </div>

        {/* Right Sidebar - Market Overview & Limits (hidden on small screens, can be toggled) */}
        <div className="hidden lg:block w-80 bg-[#1a1a2e] border-l border-[#2a2a3e] overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Market Overview</h3>
              <div className="flex items-center space-x-1">
                <div className={`live-pulse ${isConnected ? '' : 'opacity-30'}`} />
                <span className="text-[9px] text-gray-500">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { name: "NIFTY 50", value: ltpData["Nifty 50"]?.price || "22,345.50", change: "+0.25%" },
                { name: "BANK NIFTY", value: ltpData["Bank Nifty"]?.price || "47,890.25", change: "+0.18%" },
                { name: "INDIA VIX", value: ltpData["India VIX"]?.price || "14.25", change: "-2.30%" }
              ].map((idx) => (
                <div key={idx.name} className="flex justify-between items-center p-2 bg-[#252540] rounded-lg">
                  <span className="text-sm font-medium text-gray-300">{idx.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">₹{idx.value}</span>
                    <span className={`text-[10px] ml-2 ${idx.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {idx.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <LimitsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}