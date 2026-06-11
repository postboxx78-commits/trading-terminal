// client/src/components/Watchlist.jsx
import React, { useState, useEffect } from "react";
import { Plus, X, Search, TrendingUp, TrendingDown } from "lucide-react";
import { socket } from "../utils/socket";
import SymbolSearch from "./SymbolSearch";

function Watchlist() {
  const [watchlist, setWatchlist] = useState(["NIFTY", "BANKNIFTY", "RELIANCE", "HDFCBANK"]);
  const [ltpData, setLtpData] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    socket.on("ltp-update", (data) => {
      setLtpData((prev) => ({ ...prev, [data.symbol]: data }));
    });
    return () => socket.off("ltp-update");
  }, []);

  const panelStyle = {
    backgroundColor: 'var(--bg-panel)',
    backdropFilter: 'var(--backdrop-blur)',
    WebkitBackdropFilter: 'var(--backdrop-blur)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    height: 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  };

  const addButtonStyle = {
    backgroundColor: 'transparent',
    border: `1px solid var(--border-color)`,
    color: 'var(--color-accent)', // Cyan accent
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
  };

  const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    overflowY: 'auto',
    flex: 1,
  };

  const listItemStyle = (symbol) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: `1px solid var(--border-color)`,
    cursor: 'pointer',
    backgroundColor: selectedSymbol === symbol ? 'var(--color-accent-dim)' : 'transparent',
    transition: 'background-color 0.2s',
  });

  const getPriceChangeColor = (change) => {
    if (change > 0) return 'var(--color-bull)'; // Lime Green
    if (change < 0) return 'var(--color-bear)'; // Red
    return 'var(--text-secondary)';
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>MarketWatch</h3>
        <button style={addButtonStyle} onClick={() => setShowSearch(true)}>
          <Search size={14} /> Add
        </button>
      </div>

      {showSearch && <SymbolSearch onClose={() => setShowSearch(false)} />}

      <ul style={listStyle}>
        {watchlist.map((symbol) => {
          const data = ltpData[symbol] || {};
          const change = parseFloat(data.change) || 0;
          const priceColor = getPriceChangeColor(change);

          return (
            <li key={symbol} style={listItemStyle(symbol)} onClick={() => setSelectedSymbol(symbol)}>
              <div>
                <span style={{ fontWeight: '600', color: selectedSymbol === symbol ? 'var(--color-accent)' : 'var(--text-primary)' }}>{symbol}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>NSE</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: '700', color: priceColor, fontSize: '15px' }}>{data.ltp || "0.00"}</span>
                <div style={{ fontSize: '12px', color: priceColor, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  {change > 0 ? <TrendingUp size={12}/> : change < 0 ? <TrendingDown size={12}/> : null}
                  {change.toFixed(2)} ({data.percentChange || "0.00"}%)
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Watchlist;
