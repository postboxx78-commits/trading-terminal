// client/src/components/Orders.jsx
import React from "react";

function Orders() {
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

  const getStatusColor = (status) => {
    if (status === "COMPLETE") return 'var(--color-bull)';
    if (status === "REJECTED") return 'var(--color-bear)';
    return 'var(--color-accent)'; // Pending/Active in cyan
  };

  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>Order Book</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Time</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Instrument</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>14:32:01</td>
            <td style={{ ...tdStyle, color: 'var(--color-bear)' }}>SELL</td>
            <td style={tdStyle}>RELIANCE</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>100</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>2850.15</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: getStatusColor("COMPLETE") }}>COMPLETE</td>
          </tr>
          <tr>
            <td style={tdStyle}>14:30:15</td>
            <td style={{ ...tdStyle, color: 'var(--color-bull)' }}>BUY</td>
            <td style={tdStyle}>NIFTY 22000 CE</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>50</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>125.50</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: getStatusColor("COMPLETE") }}>COMPLETE</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Orders;
