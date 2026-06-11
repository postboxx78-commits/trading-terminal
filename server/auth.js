import axios from "axios";
import { loadSymbols } from "./symbols.js";

let SESSION = {
  viewToken: null,
  viewSid: null,
  tradeToken: null,
  tradeSid: null,
  baseUrl: null,
  wsUrl: null,
  wsToken: null,
  loggedIn: false,
  lastLogin: null
};

// ---------------- HELPERS ----------------

function authHeaders(extra = {}) {
  return {
    Authorization: process.env.NEO_ACCESS_TOKEN,
    "neo-fin-key": "neotradeapi",
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra
  };
}

export function tradingHeaders() {
  if (!SESSION.tradeToken) return null;

  return {
    Auth: SESSION.tradeToken,
    Sid: SESSION.tradeSid,
    "neo-fin-key": "neotradeapi",
    "Content-Type": "application/json"
  };
}

export function isLoggedIn() {
  return !!SESSION.tradeToken;
}

export function getSession() {
  return SESSION;
}

// ---------------- TOTP LOGIN ----------------

export async function totpLogin(mobile, ucc, totp) {
  try {
    const res = await axios.post(
      "https://mis.kotaksecurities.com/login/1.0/tradeApiLogin",
      {
        mobileNumber: mobile,
        ucc: ucc.toUpperCase(),
        totp
      },
      {
        headers: authHeaders()
      }
    );

    SESSION.viewToken = res.data.data.token;
    SESSION.viewSid = res.data.data.sid;

    console.log("✅ TOTP OK");

    return true;
  } catch (e) {
    console.error("❌ TOTP ERROR:", e.response?.data || e.message);
    throw e;
  }
}

// ---------------- MPIN VALIDATE ----------------

export async function mpinValidate(mpin) {
  try {
    if (!SESSION.viewToken) throw "Run TOTP login first";

    const res = await axios.post(
      "https://mis.kotaksecurities.com/login/1.0/tradeApiValidate",
      { mpin },
      {
        headers: authHeaders({
          Auth: SESSION.viewToken,
          Sid: SESSION.viewSid
        })
      }
    );

    SESSION.tradeToken = res.data.data.token;
    SESSION.tradeSid = res.data.data.sid;
    SESSION.baseUrl = res.data.data.baseUrl;
    
    // Try to get WebSocket URL from response
    SESSION.wsUrl = res.data.data.wsUrl || res.data.data.websocketUrl || null;
    SESSION.wsToken = res.data.data.wsToken || SESSION.tradeToken;
    
    SESSION.loggedIn = true;
    SESSION.lastLogin = Date.now();

    console.log("✅ MPIN OK");
    console.log("🚀 Trading Session Ready");
    console.log("Base URL:", SESSION.baseUrl);
    if (SESSION.wsUrl) {
      console.log("🔌 WebSocket URL:", SESSION.wsUrl);
    }

    // ---------------- LOAD MASTER SCRIP ----------------
    try {
      const master = await axios.get(
        `${SESSION.baseUrl}/script-details/1.0/masterscrip/file-paths`,
        {
          headers: {
            Authorization: process.env.NEO_ACCESS_TOKEN
          }
        }
      );

      const files = master.data.data.filesPaths;
      
      // Find NSE CM file - look for both nse_cm and nse_cm-v1 patterns
      const nseCmFile = files.find(f => f.includes("nse_cm") || f.includes("nse_cm-v1"));

      if (!nseCmFile) {
        console.error("NSE CM file not found in:", files);
        throw "NSE CM file not found";
      }

      console.log("Loading symbols from:", nseCmFile);
      await loadSymbols(nseCmFile);
      console.log("📦 Symbols cached");

    } catch (masterError) {
      console.error("❌ MASTER SCRIP ERROR:", masterError.response?.data || masterError.message);
      // Don't throw - session is still valid even if symbol loading fails
    }

    return SESSION;
  } catch (e) {
    console.error("❌ MPIN ERROR:", e.response?.data || e.message);
    throw e;
  }
}

// ---------------- CLEAR SESSION ----------------

export function clearSession() {
  SESSION = {
    viewToken: null,
    viewSid: null,
    tradeToken: null,
    tradeSid: null,
    baseUrl: null,
    wsUrl: null,
    wsToken: null,
    loggedIn: false,
    lastLogin: null
  };
}