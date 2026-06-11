// client/src/pages/Login.jsx
import React, { useState } from "react";
import { totpLogin } from "../utils/auth";

function Login() {
  const [mobile, setMobile] = useState("918086515301");
  const [ucc, setUcc] = useState("X9YOZ");
  const [totp, setTotp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: 'var(--bg-main)',
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-panel)',
    backdropFilter: 'var(--backdrop-blur)',
    WebkitBackdropFilter: 'var(--backdrop-blur)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '40px',
    width: '400px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  };

  const titleStyle = {
    color: 'var(--color-accent)',
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
  };

  const subtitleStyle = {
    color: 'var(--text-secondary)',
    marginBottom: '32px',
    fontSize: '14px',
  };

  const formGroupStyle = {
    textAlign: 'left',
    marginBottom: '16px',
  };

  const labelStyle = {
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    display: 'block',
    textTransform: 'uppercase',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0d1117', // Darkest input bg
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: loading ? 'var(--text-secondary)' : 'var(--color-accent)',
    color: '#000', // Black text on cyan
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '16px',
    transition: 'opacity 0.2s',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await totpLogin(mobile, ucc, totp);
      window.location.reload();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <form style={cardStyle} onSubmit={handleLogin}>
        <h2 style={titleStyle}>NeoTerminal</h2>
        <p style={subtitleStyle}>Kotak Neo API Access</p>
        
        {error && <div style={{color: 'var(--color-bear)', background: 'var(--color-bear-dim)', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px'}}>{error}</div>}

        <div style={formGroupStyle}>
          <label style={labelStyle}>Registered Mobile</label>
          <input style={inputStyle} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91..." required />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>UCC Code</label>
          <input style={inputStyle} value={ucc} onChange={e => setUcc(e.target.value)} placeholder="Enter UCC" required />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>6-Digit TOTP</label>
          <input style={{...inputStyle, textAlign: 'center', letterSpacing: '4px'}} value={totp} onChange={e => setTotp(e.target.value)} maxLength={6} placeholder="000000" required autoFocus />
        </div>

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Authenticating..." : "Login with TOTP"}
        </button>
      </form>
    </div>
  );
}

export default Login;
