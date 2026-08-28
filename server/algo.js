import axios from "axios";
import { getCachedPrice } from "./ltp.js";
import { getTradingSymbol, searchSymbols } from "./symbols.js";

// In-memory store for active algo rules
export const activeRules = [];

export function parseAndAddRule(prompt, defaultQty = 1) {
  // Regex to extract: action, symbol, metric, operator, price
  // Matches: "enter on tmpv a close above 360" or "exit from reliance below 2500"
  const regex = /(enter|exit)\s+(?:on|from)\s+([a-zA-Z0-9]+).*?(above|below)\s+(\d+(\.\d+)?)/i;
  const match = prompt.match(regex);

  if (!match) throw new Error("Invalid prompt format.");

  const action = match[1].toLowerCase() === "enter" ? "B" : "S";
  const rawSymbol = match[2].toUpperCase();
  const operator = match[3].toLowerCase();
  const targetPrice = parseFloat(match[4]);

  // Attempt to resolve the exact trading symbol (e.g., TMPV -> TMPV-EQ)
  const searchResults = searchSymbols(rawSymbol);
  const tradingSymbol = searchResults.length > 0 ? searchResults[0].symbol : `${rawSymbol}-EQ`;

  const rule = {
    id: Date.now(),
    prompt,
    symbol: tradingSymbol,
    action,
    operator,
    targetPrice,
    qty: defaultQty,
    active: true
  };

  activeRules.push(rule);
  return rule;
}

export async function evaluateAlgoRules() {
  for (let rule of activeRules) {
    if (!rule.active) continue;

    const tick = getCachedPrice(rule.symbol);
    if (!tick || !tick.lastPrice) continue;

    const ltp = parseFloat(tick.lastPrice);
    let conditionMet = false;

    if (rule.operator === "above" && ltp > rule.targetPrice) conditionMet = true;
    if (rule.operator === "below" && ltp < rule.targetPrice) conditionMet = true;

    if (conditionMet) {
      rule.active = false; // Disable rule immediately to prevent duplicate firing
      console.log(`⚡ ALGO TRIGGERED: ${rule.symbol} crossed ${rule.targetPrice}`);
      await executeAlgoOrder(rule, ltp);
    }
  }
}

async function executeAlgoOrder(rule, currentLtp) {
  try {
    // 0.5% buffer for Marketable Limit Order to bypass API MKT restrictions
    const buffer = 0.005; 
    const limitPrice = rule.action === "B" 
      ? (currentLtp * (1 + buffer)).toFixed(2) 
      : (currentLtp * (1 - buffer)).toFixed(2);

    const payload = {
      symbol: rule.symbol,
      exch: "nse_cm",
      qty: rule.qty,
      side: rule.action,
      orderType: "LIMIT",
      price: limitPrice.toString(),
      productType: "MIS",
      validity: "DAY"
    };

    // Call your own internal order API endpoint
    const PORT = process.env.PORT || 3001;
    const response = await axios.post(`http://127.0.0.1:${PORT}/order`, payload);
    console.log(`✅ ALGO ORDER PLACED:`, response.data.orderId);
  } catch (error) {
    console.error(`❌ ALGO EXECUTION FAILED:`, error.response?.data || error.message);
    rule.active = true; // Re-enable if API fails (optional, depending on risk logic)
  }
}