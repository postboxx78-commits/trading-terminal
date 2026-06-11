// client/src/components/Positions.jsx
import React from "react";

function Positions() {
  const panelStyle = {
    backgroundColor: 'var(--bg-panel)',
    backdropFilter: 'var(--backdrop-blur)',
    WebkitBackdropFilter: 'var(--backdrop-blur)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
  };

  const titleStyle = {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  };

  const thStyle = {
    textAlign: 'left',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    paddingBottom: '8px',
    textTransform: 'uppercase',
    fontSize: '11px',
  };

  const tdStyle = {
    padding: '10px 0',
    color: 'var(--text-primary)',
    borderTop: '1px solid var(--border-color)',
  };

  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>Open Positions</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Instrument</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>LTP</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>P&L</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{...tdStyle, fontWeight: '600'}}>NIFTY 22000 CE</td>
            <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-bull)' }}>50</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>130.15</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: 'var(--color-bull)' }}>+232.50</td>
          </tr>
          <tr>
            <td style={{...tdStyle, fontWeight: '600'}}>RELIANCE</td>
            <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-bear)' }}>-100</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>2855.00</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: 'var(--color-bear)' }}>-485.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Positions;
