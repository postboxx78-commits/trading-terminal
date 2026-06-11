import { useState, useEffect } from "react";
import SymbolSearch from "./SymbolSearch";
import { Star, TrendingUp, TrendingDown, Minus, Activity, X } from "lucide-react";

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
    <div className="h-full flex flex-col bg-[#13151A]">
      <div className="p-3 border-b border-[#2C2F36]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Watchlist</h2>
          <div className="flex items-center gap-2">
            <div className={`live-pulse ${isConnected ? '' : 'opacity-30'}`} />
            <span className="text-[8px] text-gray-500">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            {onCloseMobile && (
              <button onClick={onCloseMobile} className="lg:hidden text-gray-400 hover:text-white ml-2">
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
          <div className="p-6 text-center">
            <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Add symbols to watchlist</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2C2F36]">
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
                  className={`group relative px-3 py-2 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#1E293B] border-l-4 border-[#3B82F6]' : 'border-l-4 border-transparent hover:bg-[#1A1C23]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => toggleFavorite(e, item)} className="focus:outline-none">
                          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                        </button>
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>{item.symbol}</span>
                        {ltpItem && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D09C] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00D09C]"></span>
                          </span>
                        )}
                      </div>
                      {item.name && <div className="text-[9px] text-gray-500 truncate ml-5">{item.name}</div>}
                    </div>
                    <div className="text-right ml-2">
                      <div className={`text-sm font-semibold tabular-nums ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {price ? `₹${typeof price === 'number' ? price.toFixed(2) : price}` : '---'}
                      </div>
                      {price && (
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {isPositive ? <TrendingUp className="w-3 h-3 text-[#00D09C]" /> : isNegative ? <TrendingDown className="w-3 h-3 text-[#FF4D4D]" /> : <Minus className="w-3 h-3 text-gray-500" />}
                          <span className={`text-[9px] font-medium tabular-nums ${isPositive ? 'text-[#00D09C]' : isNegative ? 'text-[#FF4D4D]' : 'text-gray-500'}`}>
                            {changePercent > 0 ? '+' : ''}{changePercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 ml-5">
                    <span className="text-[8px] text-gray-500 uppercase">{item.exch || 'NSE'}</span>
                    <button onClick={(e) => removeFromWatchlist(e, item)} className="opacity-0 group-hover:opacity-100 text-[8px] text-[#FF4D4D] hover:text-[#FF6B6B]">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {list.length > 0 && (
        <div className="p-2 border-t border-[#2C2F36] text-center">
          <button onClick={() => setList([])} className="text-[9px] text-gray-500 hover:text-[#FF4D4D]">Clear all</button>
        </div>
      )}
    </div>
  );
}