// client/src/components/LimitsPanel.jsx
import React from "react";

function LimitsPanel() {
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
    fontSize: '14px',
  };

  const thStyle = {
    textAlign: 'left',
    color: 'var(--text-secondary)', // Muted gray text
    fontWeight: '500',
    paddingBottom: '8px',
    textTransform: 'uppercase',
    fontSize: '12px',
  };

  const tdStyle = {
    padding: '10px 0',
    color: 'var(--text-primary)',
    borderTop: '1px solid var(--border-color)',
  };

  const limitValueStyle = {
    fontWeight: '700',
    color: 'var(--color-accent)', // Highlight specific limit in cyan
  };

  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>Trading Limits</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Particulars</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Cash Balance</td>
            <td style={{ ...tdStyle, textAlign: 'right', ...limitValueStyle }}>1,45,230.50</td>
          </tr>
          <tr>
            <td style={tdStyle}>Collateral Value</td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>0.00</td>
          </tr>
          <tr>
            <td style={tdStyle}>Utilized Margin</td>
            <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-bear)' }}>22,100.00</td>
          </tr>
          <tr>
            <td style={tdStyle}>Available Limit</td>
            <td style={{ ...tdStyle, textAlign: 'right', ...limitValueStyle, color: 'var(--color-bull)' }}>1,23,130.50</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default LimitsPanel;
