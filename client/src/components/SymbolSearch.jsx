import { useState, useEffect } from "react";
import axios from "axios";
import { Search, X, Loader } from "lucide-react";

export default function SymbolSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) performSearch();
      else setResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const res = await axios.get(`http://140.245.234.6:3001/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) { setError("Search failed"); setResults([]); }
    finally { setIsSearching(false); }
  };

  const handleSelect = (s) => { onSelect(s); setQuery(""); setResults([]); };
  const clear = () => { setQuery(""); setResults([]); setError(null); };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search NSE symbols..."
          className="w-full pl-7 pr-6 py-1.5 text-xs bg-[#1A1C23] border border-[#2C2F36] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-white placeholder-gray-500"
        />
        {query && <button onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-gray-500" /></button>}
      </div>
      {isSearching && <div className="absolute z-50 mt-1 w-full bg-[#13151A] border border-[#2C2F36] rounded p-2 text-center"><Loader className="w-3 h-3 animate-spin inline" /><span className="text-[10px] ml-1 text-gray-400">Searching...</span></div>}
      {error && <div className="absolute z-50 mt-1 w-full bg-[#13151A] border border-[#FF4D4D] rounded p-2 text-[#FF4D4D] text-[10px]">{error}</div>}
      {results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#13151A] border border-[#2C2F36] rounded-lg max-h-48 overflow-auto">
          {results.map(s => (
            <div key={s.symbol} onClick={() => handleSelect(s)} className="px-2 py-1.5 hover:bg-[#1A1C23] cursor-pointer border-b border-[#2C2F36] last:border-0">
              <div className="flex justify-between"><span className="text-sm font-medium text-white">{s.symbol}</span><span className="text-[9px] text-gray-400">{s.exch || 'NSE'}</span></div>
              {s.name && <div className="text-[9px] text-gray-500 truncate">{s.name}</div>}
            </div>
          ))}
        </div>
      )}
      {query.length >= 2 && !isSearching && results.length === 0 && !error && <div className="absolute z-50 mt-1 w-full bg-[#13151A] border border-[#2C2F36] rounded p-2 text-center text-[10px] text-gray-400">No symbols found</div>}
    </div>
  );
}