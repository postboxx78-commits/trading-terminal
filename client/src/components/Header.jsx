// client/src/components/Header.jsx
import React from "react";
import { LogOut, UserCircle, Settings } from "lucide-react";
import { getSession } from "../utils/auth";
import { socket } from "../utils/socket";

function Header() {
  const session = getSession();

  const headerStyle = {
    backgroundColor: 'var(--bg-panel)',
    backdropFilter: 'var(--backdrop-blur)',
    WebkitBackdropFilter: 'var(--backdrop-blur)', // For Safari support
    borderBottom: '1px solid var(--border-color)',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--color-accent)', // Electric Cyan
    letterSpacing: '-0.5px',
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  };

  const socketStatusStyle = {
    color: socket.connected ? 'var(--color-bull)' : 'var(--color-bear)', // Green/Red
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const userControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  };

  const iconStyle = {
    color: 'var(--color-accent)', // Electric Cyan
    cursor: 'pointer',
    opacity: 0.8,
  };

  return (
    <div style={headerStyle}>
      <h1 style={titleStyle}>NeoTerminal</h1>
      
      <div style={rightSectionStyle}>
        <span style={socketStatusStyle}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: socket.connected ? 'var(--color-bull)' : 'var(--color-bear)' }}></span>
          {socket.connected ? 'LIVE FEED CONNECTED' : 'LIVE FEED OFFLINE'}
        </span>
        
        <Settings size={20} style={iconStyle} className="hover-scale" />

        <div style={userControlStyle}>
          <UserCircle size={22} style={iconStyle} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            {session.ucc || 'Guest'}
          </span>
        </div>
        
        <LogOut size={20} style={{...iconStyle, color: 'var(--color-bear)'}} className="hover-scale" />
      </div>
    </div>
  );
}

export default Header;
