import React, { useState } from "react";
import { Search, X } from "lucide-react";

export default function SymbolSearch({ onClose }) {
  const [query, setQuery] = useState("");

  return (
    <div className="relative mb-4">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400" />
        <input 
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:bg-white text-gray-800 text-sm transition-colors"
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="Search Nifty, Reliance..." 
          autoFocus 
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
