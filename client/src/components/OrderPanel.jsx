// client/src/components/OrderPanel.jsx
import React from "react";
import OrderForm from "./OrderForm";

function OrderPanel() {
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
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  };

  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>Order Entry</h3>
      <OrderForm />
    </div>
  );
}

export default OrderPanel;
