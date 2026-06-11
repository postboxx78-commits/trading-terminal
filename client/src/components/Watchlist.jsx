// Watchlist.jsx - Enhanced UI with improved interactions and visual design
import { useState, useEffect } from "react";
import SymbolSearch from "./SymbolSearch";
import { Star, TrendingUp, TrendingDown, Minus, Activity, Zap } from "lucide-react";

export default function Watchlist({ onSelect, onUpdateSymbols, ltpData }) {
  const [list, setList] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Notify parent whenever watchlist changes
  useEffect(() => {
    const symbols = list.map(item => item.symbol);
    onUpdateSymbols(symbols);
  }, [list, onUpdateSymbols]);

  const handleSelect = (symbol) => {
    setSelectedSymbol(symbol);
    onSelect(symbol);
  };

  const removeFromWatchlist = (e, symbolToRemove) => {
    e.stopPropagation();
    setList(list.filter(item => item.symbol !== symbolToRemove.symbol));
    if (selectedSymbol?.symbol === symbolToRemove.symbol) {
      setSelectedSymbol(null);
      onSelect(null);
    }
  };

  const toggleFavorite = (e, symbol) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(symbol.symbol) 
        ? prev.filter(s => s !== symbol.symbol)
        : [...prev, symbol.symbol]
    );
  };

  const getPriceChange = (symbol) => {
    const data = ltpData[symbol];
    if (!data) return { change: 0, changePercent: 0, isPositive: false, isNegative: false };
    
    const change = data.change ? parseFloat(data.change) : 0;
    const changePercent = data.perChange ? parseFloat(data.perChange) : 0;
    
    return {
      change,
      changePercent,
      isPositive: change > 0,
      isNegative: change < 0
    };
  };

  // Load saved watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      try {
        setList(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load watchlist:', e);
      }
    }
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(list));
  }, [list]);
  
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const isConnected = Object.keys(ltpData).length > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with gradient accent */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50/30 to-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>Watchlist</span>
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-lg' : 'bg-red-500'}`} />
            <span className="text-[8px] text-gray-400 font-medium">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <SymbolSearch onSelect={(s) => {
          if (!list.find(item => item.symbol === s.symbol)) {
            const newList = [...list, s];
            setList(newList);
            handleSelect(s);
          } else {
            handleSelect(s);
          }
        }} />
      </div>
      
      {/* Watchlist Items */}
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Search and add symbols to watchlist</p>
            <p className="text-[10px] text-gray-400 mt-1">Prices update automatically</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((item) => {
              const isSelected = selectedSymbol?.symbol === item.symbol;
              const isFavorite = favorites.includes(item.symbol);
              const ltpItem = ltpData[item.symbol];
              const price = ltpItem?.price;
              const { change, changePercent, isPositive, isNegative } = getPriceChange(item.symbol);

              return (
                <div
                  key={item.symbol}
                  onClick={() => handleSelect(item)}
                  className={`
                    group relative px-4 py-3 cursor-pointer transition-all duration-200
                    hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent
                    ${isSelected ? 'bg-gradient-to-r from-blue-50/50 to-transparent border-l-4 border-blue-500' : 'border-l-4 border-transparent'}
                  `}
                >
                  {/* Main Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={(e) => toggleFavorite(e, item)}
                          className="focus:outline-none transform transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-4 h-4 transition-all duration-200 ${
                              isFavorite 
                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm' 
                                : 'text-gray-300 group-hover:text-gray-400'
                            }`} 
                          />
                        </button>
                        <span className={`text-sm font-semibold tracking-tight ${
                          isSelected ? 'text-blue-700' : 'text-gray-800'
                        }`}>
                          {item.symbol}
                        </span>
                        {ltpItem && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                      </div>
                      {item.name && (
                        <div className="text-[10px] text-gray-400 truncate mt-1 ml-6">
                          {item.name}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-3">
                      <div className={`text-sm font-bold tabular-nums ${
                        isSelected ? 'text-blue-700' : 'text-gray-800'
                      }`}>
                        {price ? `₹${typeof price === 'number' ? price.toFixed(2) : price}` : '---'}
                      </div>
                      {price && (
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : isNegative ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : (
                            <Minus className="w-3 h-3 text-gray-400" />
                          )}
                          <span className={`text-[10px] font-semibold tabular-nums ${
                            isPositive ? 'text-green-600' : 
                            isNegative ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {changePercent > 0 ? '+' : ''}{changePercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1 ml-6">
                    <span className="text-[9px] text-gray-400 uppercase font-mono">
                      {item.exch || 'NSE'}
                    </span>
                    <button
                      onClick={(e) => removeFromWatchlist(e, item)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-[9px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded"
                    >
                      Remove
                    </button>
                  </div>

                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-blue-500 rounded-r-full shadow-sm"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {list.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-gray-500 font-medium">{list.length} items • {Object.keys(ltpData).length} active</span>
            <button 
              onClick={() => setList([])} 
              className="text-gray-400 hover:text-red-500 transition-all duration-200 hover:bg-red-50 px-2 py-1 rounded"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}