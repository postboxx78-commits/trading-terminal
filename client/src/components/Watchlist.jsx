import { useState, useEffect } from "react";
import SymbolSearch from "./SymbolSearch";
import { Star, Activity, X } from "lucide-react";

export default function Watchlist({ onSelect, onUpdateSymbols, ltpData, onCloseMobile }) {
  const [list, setList] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    onUpdateSymbols(list.map(item => item.symbol));
  }, [list]);

  useEffect(() => {
    const saved = localStorage.getItem('watchlist');
    if (saved) setList(JSON.parse(saved));
    const fav = localStorage.getItem('favorites');
    if (fav) setFavorites(JSON.parse(fav));
  }, []);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(list));
  }, [list]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

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
    setFavorites(prev => prev.includes(symbol.symbol) ? prev.filter(s => s !== symbol.symbol) : [...prev, symbol.symbol]);
  };

  const getPriceChange = (symbol) => {
    const data = ltpData[symbol];
    if (!data) return { change: 0, changePercent: 0, isPositive: false, isNegative: false };
    return {
      change: parseFloat(data.change) || 0,
      changePercent: parseFloat(data.perChange) || 0,
      isPositive: parseFloat(data.change) > 0,
      isNegative: parseFloat(data.change) < 0
    };
  };

  const isConnected = Object.keys(ltpData).length > 0;

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">Markets</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e] animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-500 font-medium">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            {onCloseMobile && (
              <button onClick={onCloseMobile} className="lg:hidden text-gray-400 hover:text-gray-600 ml-2">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <SymbolSearch onSelect={(s) => {
          if (!list.find(item => item.symbol === s.symbol)) {
            setList([...list, s]);
            handleSelect(s);
          } else {
            handleSelect(s);
          }
        }} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <Activity className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">Search to add symbols</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((item) => {
              const isSelected = selectedSymbol?.symbol === item.symbol;
              const isFavorite = favorites.includes(item.symbol);
              const ltpItem = ltpData[item.symbol];
              const price = ltpItem?.price;
              const { changePercent, isPositive, isNegative } = getPriceChange(item.symbol);

              return (
                <div
                  key={item.symbol}
                  onClick={() => handleSelect(item)}
                  className={`group relative px-4 py-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-gray-50 border-l-4 border-[#22c55e]' : 'border-l-4 border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => toggleFavorite(e, item)} className="focus:outline-none shrink-0">
                          <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 group-hover:text-gray-400'}`} />
                        </button>
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{item.symbol}</span>
                      </div>
                      <div className="text-[10px] font-medium text-gray-400 ml-6 uppercase">{item.exch || 'NSE'}</div>
                    </div>

                    <div className="text-right ml-3 shrink-0">
                      <div className={`text-sm font-bold tabular-nums ${isPositive ? 'text-[#22c55e]' : isNegative ? 'text-red-500' : 'text-gray-900'}`}>
                        {price ? (typeof price === 'number' ? price.toFixed(2) : price) : '---'}
                      </div>
                      {price && (
                        <div className={`text-[11px] font-medium flex items-center justify-end gap-1 mt-0.5 tabular-nums ${isPositive ? 'text-[#22c55e]' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                          {changePercent > 0 ? '+' : ''}{changePercent}%
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => removeFromWatchlist(e, item)} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-all border border-gray-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
