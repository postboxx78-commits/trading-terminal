// SymbolSearch.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Search, X, Loader } from "lucide-react";

export default function SymbolSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://140.245.234.6:3001/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to search symbols");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (symbol) => {
    onSelect(symbol);
    setQuery("");
    setResults([]);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setError(null);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbols (e.g., RELIANCE, TCS)"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {isSearching && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Searching...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-red-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((symbol) => (
            <div
              key={symbol.symbol}
              onClick={() => handleSelect(symbol)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{symbol.symbol}</span>
                {symbol.name && (
                  <span className="text-xs text-gray-500">{symbol.name}</span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-gray-400">{symbol.exch || 'NSE'}</span>
                {symbol.lot > 1 && (
                  <span className="text-xs text-gray-400">Lot: {symbol.lot}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query.length >= 2 && !isSearching && results.length === 0 && !error && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-500">No symbols found</p>
        </div>
      )}
    </div>
  );
}