// symbols.js
import axios from "axios";
import csv from "csvtojson";

let SYMBOLS = [];
let SYMBOL_MAP = new Map(); // Map trading symbol to pSymbol
let PSYMBOL_TO_TRADING = new Map(); // Map pSymbol to trading symbol

export async function loadSymbols(url) {
  try {
    console.log("Loading symbols from:", url);
    const csvData = await axios.get(url);
    const json = await csv().fromString(csvData.data);

    SYMBOLS = json
      .filter(r => r.pTrdSymbol && r.pSymbol)   // only valid rows with both fields
      .map(r => ({
        tradingSymbol: r.pTrdSymbol,     // For orders (ts field)
        pSymbol: r.pSymbol,               // For quotes (pSymbol field)
        exch: r.pExchSeg || "nse_cm",
        lot: Number(r.lLotSize || 1),
        name: r.pSymbolName || r.pSymbol || "",
        series: r.pSeries || "",
        instrument: r.pInstrumentName || ""
      }));

    // Create maps for quick lookup
    SYMBOLS.forEach(item => {
      // Map trading symbol to pSymbol
      SYMBOL_MAP.set(item.tradingSymbol, item.pSymbol);
      
      // Map pSymbol to trading symbol - IMPORTANT: store as string for comparison
      PSYMBOL_TO_TRADING.set(item.pSymbol.toString(), item.tradingSymbol);
      
      // Also map without -EQ suffix for convenience
      if (item.tradingSymbol.endsWith('-EQ')) {
        const withoutEQ = item.tradingSymbol.replace('-EQ', '');
        SYMBOL_MAP.set(withoutEQ, item.pSymbol);
      }
      
      // Map by name if available
      if (item.name) {
        SYMBOL_MAP.set(item.name.toUpperCase(), item.pSymbol);
      }
    });

    console.log("✅ Symbols loaded:", SYMBOLS.length);
    console.log("📊 Sample symbols:", SYMBOLS.slice(0, 3).map(s => ({
      trading: s.tradingSymbol,
      pSymbol: s.pSymbol,
      name: s.name
    })));
    
    // Test RELIANCE mapping
    const reliancePSymbol = SYMBOL_MAP.get("RELIANCE-EQ");
    const relianceTrading = PSYMBOL_TO_TRADING.get("2885");
    console.log("🔍 RELIANCE mapping test:", {
      tradingToPSymbol: reliancePSymbol,
      pSymbolToTrading: relianceTrading
    });
    
    return SYMBOLS;
  } catch (error) {
    console.error("Error loading symbols:", error);
    throw error;
  }
}

export function searchSymbols(q) {
  if (!q) return [];

  q = q.toUpperCase().trim();

  // Search in trading symbols and names
  const results = SYMBOLS
    .filter(s => 
      (s.tradingSymbol && s.tradingSymbol.includes(q)) ||
      (s.name && s.name.toUpperCase().includes(q))
    )
    .slice(0, 20)
    .map(s => ({
      symbol: s.tradingSymbol,
      pSymbol: s.pSymbol,
      exch: s.exch,
      lot: s.lot,
      name: s.name,
      series: s.series
    }));

  return results;
}

export function getPSymbol(tradingSymbol) {
  if (!tradingSymbol) return null;
  
  // Clean the trading symbol
  const cleanSymbol = tradingSymbol.trim();
  
  // Try exact match
  if (SYMBOL_MAP.has(cleanSymbol)) {
    return SYMBOL_MAP.get(cleanSymbol);
  }
  
  // Try without -EQ
  if (cleanSymbol.endsWith('-EQ')) {
    const withoutEQ = cleanSymbol.replace('-EQ', '');
    if (SYMBOL_MAP.has(withoutEQ)) {
      return SYMBOL_MAP.get(withoutEQ);
    }
  }
  
  // Try with -EQ if it doesn't have it
  if (!cleanSymbol.endsWith('-EQ')) {
    const withEQ = cleanSymbol + '-EQ';
    if (SYMBOL_MAP.has(withEQ)) {
      return SYMBOL_MAP.get(withEQ);
    }
  }
  
  // Try case-insensitive match
  for (const [key, value] of SYMBOL_MAP.entries()) {
    if (key.toUpperCase() === cleanSymbol.toUpperCase()) {
      return value;
    }
  }
  
  console.log(`❌ No pSymbol found for: ${tradingSymbol}`);
  return null;
}

export function getTradingSymbol(pSymbol) {
  if (!pSymbol) return null;
  
  // Convert to string for comparison
  const pSymbolStr = pSymbol.toString();
  
  // Try direct lookup
  if (PSYMBOL_TO_TRADING.has(pSymbolStr)) {
    return PSYMBOL_TO_TRADING.get(pSymbolStr);
  }
  
  // Try without leading zeros if it's a number
  const pSymbolNum = parseInt(pSymbolStr);
  for (const [key, value] of PSYMBOL_TO_TRADING.entries()) {
    if (parseInt(key) === pSymbolNum) {
      return value;
    }
  }
  
  console.log(`❌ No trading symbol found for pSymbol: ${pSymbol}`);
  return null;
}

export function getAllSymbols() {
  return SYMBOLS;
}

export function getSymbolByTrading(tradingSymbol) {
  return SYMBOLS.find(s => s.tradingSymbol === tradingSymbol) || null;
}

export function getSymbolByPSymbol(pSymbol) {
  return SYMBOLS.find(s => s.pSymbol === pSymbol.toString()) || null;
}