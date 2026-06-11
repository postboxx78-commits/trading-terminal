// Watchlist.jsx - Updated to notify parent of symbol changes
import { useState, useEffect } from "react";
import SymbolSearch from "./SymbolSearch";
import { Star, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

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

  // Load saved watchlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      try {
        setList(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load watchlist:', e);
      }
    }
  }, []);

  // Save watchlist to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(list));
  }, [list]);

  const isConnected = Object.keys(ltpData).length > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with connection status */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Watchlist
          </h2>
          <div className="flex items-center space-x-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[8px] text-gray-400">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <SymbolSearch onSelect={(s) => {
          if (!list.find(item => item.symbol === s.symbol)) {
            const newList = [...list, s];
            setList(newList);
            // Auto-select the newly added symbol
            handleSelect(s);
          } else {
            // If symbol already exists, just select it
            handleSelect(s);
          }
        }} />
      </div>
      
      {/* Watchlist Items */}
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="p-6 text-center">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Search and add symbols to watchlist</p>
            <p className="text-[10px] text-gray-300 mt-1">Prices will update automatically</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
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
                    group relative px-3 py-2.5 cursor-pointer transition-all
                    hover:bg-gray-50
                    ${isSelected ? 'bg-blue-50/50 border-l-3 border-blue-600' : 'border-l-3 border-transparent'}
                  `}
                >
                  {/* Main Row */}
                  <div className="flex items-center justify-between">
                    {/* Left side - Symbol and Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => toggleFavorite(e, item)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`w-3.5 h-3.5 transition-colors ${
                              isFavorite 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-300 group-hover:text-gray-400'
                            }`} 
                          />
                        </button>
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-blue-700' : 'text-gray-800'
                        }`}>
                          {item.symbol}
                        </span>
                        {/* Live indicator for updating symbols */}
                        {ltpItem && (
                          <span className="text-[8px] text-green-500 animate-pulse">●</span>
                        )}
                      </div>
                      {item.name && (
                        <div className="text-[10px] text-gray-400 truncate mt-0.5 ml-6">
                          {item.name}
                        </div>
                      )}
                    </div>

                    {/* Right side - Price and Change */}
                    <div className="text-right ml-2">
                      <div className={`text-sm font-semibold tabular-nums ${
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
                          <span className={`text-[10px] font-medium tabular-nums ${
                            isPositive ? 'text-green-600' : 
                            isNegative ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {changePercent > 0 ? '+' : ''}{changePercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exchange and Remove - Bottom row */}
                  <div className="flex items-center justify-between mt-1 ml-6">
                    <span className="text-[9px] text-gray-400 uppercase">
                      {item.exch || 'NSE'}
                    </span>
                    <button
                      onClick={(e) => removeFromWatchlist(e, item)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Watchlist Stats */}
      {list.length > 0 && (
        <div className="p-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between text-[9px] text-gray-400">
            <span>{list.length} items • {Object.keys(ltpData).length} active</span>
            <button 
              onClick={() => setList([])} 
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}