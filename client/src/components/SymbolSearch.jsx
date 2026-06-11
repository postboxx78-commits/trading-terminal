// client/src/components/SymbolSearch.jsx
import React, { useState } from "react";
import { X, Search } from "lucide-react";

function SymbolSearch({ onClose }) {
  const [query, setQuery] = useState("");

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '100px',
  };

  const modalContentStyle = {
    backgroundColor: 'var(--bg-panel)',
    backdropFilter: 'var(--backdrop-blur)',
    WebkitBackdropFilter: 'var(--backdrop-blur)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    width: '500px',
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
  };

  const searchInputWrapperStyle = {
    position: 'relative',
    marginBottom: '16px',
  };

  const searchInputStyle = {
    width: '100%',
    padding: '12px 12px 12px 40px',
    backgroundColor: '#0d1117',
    border: `1px solid var(--color-accent)`, // Highlight search input in cyan
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '16px',
    boxSizing: 'border-box',
  };

  const searchIconStyle = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-accent)',
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Add Symbol</h3>
          <X size={20} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={onClose} />
        </div>

        <div style={searchInputWrapperStyle}>
          <Search size={20} style={searchIconStyle} />
          <input 
            style={searchInputStyle} 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Search Nifty, BankNifty, Reliance..." 
            autoFocus 
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '40px' }}>
          Type a symbol to begin search...
        </div>
      </div>
    </div>
  );
}

export default SymbolSearch;
