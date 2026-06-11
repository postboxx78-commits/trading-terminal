import { useState } from "react";
import axios from "axios";
import { ChevronDown, Circle, CheckCircle, X, TrendingUp, TrendingDown } from "lucide-react";

export default function OrderPanel({ selected, onClose, ltpData, currentPrice }) {
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [orderType, setOrderType] = useState("MARKET");
  const [side, setSide] = useState("BUY");
  const [productType, setProductType] = useState("MIS");
  const [validity, setValidity] = useState("DAY");
  const [showOrderTypes, setShowOrderTypes] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  const orderTypes = [
    { id: "MARKET", label: "Market", description: "At market price" },
    { id: "LIMIT", label: "Limit", description: "At specified price" },
    { id: "SL-M", label: "SL-M", description: "Stop loss market" },
    { id: "SL", label: "SL", description: "Stop loss limit" },
  ];
  const productTypes = [
    { id: "MIS", label: "MIS", description: "Intraday" },
    { id: "CNC", label: "CNC", description: "Delivery" },
    { id: "NRML", label: "NRML", description: "Normal" },
  ];
  const validityTypes = [
    { id: "DAY", label: "Day", description: "Valid for day" },
    { id: "IOC", label: "IOC", description: "Immediate or cancel" },
  ];

  if (!selected) {
    return (
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] p-3 text-center">
        <p className="text-xs text-gray-400">Select a symbol to order</p>
      </div>
    );
  }

  const validateOrder = () => {
    if (!qty || qty <= 0) {
      setOrderStatus({ type: 'error', message: 'Invalid quantity' });
      setTimeout(() => setOrderStatus(null), 2000);
      return false;
    }
    if ((orderType === "LIMIT" || orderType === "SL") && (!price || price <= 0)) {
      setOrderStatus({ type: 'error', message: 'Enter valid price' });
      setTimeout(() => setOrderStatus(null), 2000);
      return false;
    }
    if ((orderType === "SL-M" || orderType === "SL") && (!triggerPrice || triggerPrice <= 0)) {
      setOrderStatus({ type: 'error', message: 'Enter trigger price' });
      setTimeout(() => setOrderStatus(null), 2000);
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!validateOrder()) return;
    setIsPlacing(true);
    setOrderStatus(null);
    try {
      const apiSide = side === "BUY" ? "B" : "S";
      const response = await axios.post("http://140.245.234.6:3001/order", {
        symbol: selected.symbol,
        exch: selected.exch || "nse_cm",
        qty: parseInt(qty),
        side: apiSide,
        orderType: orderType,
        productType: productType,
        validity: validity,
        price: (orderType === "LIMIT" || orderType === "SL") ? parseFloat(price) : 0,
        triggerPrice: (orderType === "SL-M" || orderType === "SL") ? parseFloat(triggerPrice) : 0
      });
      if (response.data.success) {
        setOrderStatus({ type: 'success', message: 'Order placed!' });
        setPrice("");
        setTriggerPrice("");
        setTimeout(() => setOrderStatus(null), 2000);
      } else {
        setOrderStatus({ type: 'error', message: response.data.error || 'Failed' });
      }
    } catch (err) {
      setOrderStatus({ type: 'error', message: err.response?.data?.error || 'Order failed' });
    } finally {
      setIsPlacing(false);
    }
  };

  const symbolData = ltpData[selected.symbol];
  const displayPrice = currentPrice || symbolData?.price || "---";
  const priceChange = symbolData?.change ? parseFloat(symbolData.change) : 0;
  const isUp = priceChange > 0;

  return (
    <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] p-2">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#2a2a3e]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-300">{selected.symbol}</span>
          <span className="text-[10px] text-gray-500 bg-[#252540] px-1.5 py-0.5 rounded">{productType}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* LTP ticker */}
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] text-gray-400">LTP</span>
        <div className="text-right">
          <span className="text-sm font-bold text-white">₹{displayPrice}</span>
          {symbolData && (
            <div className="flex items-center justify-end gap-1">
              {isUp ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
              <span className={`text-[9px] font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Order status */}
      {orderStatus && (
        <div className={`mb-2 p-1.5 rounded text-[10px] text-center ${
          orderStatus.type === 'success' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-rose-900/40 text-rose-300'
        }`}>
          {orderStatus.message}
        </div>
      )}

      {/* Compact row: product + order type + validity */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        <div className="relative">
          <button onClick={() => setShowProductTypes(!showProductTypes)} className="w-full py-1 text-[10px] bg-[#252540] border border-[#3a3a4e] rounded flex justify-between items-center px-1">
            {productTypes.find(p => p.id === productType)?.label} <ChevronDown className="w-3 h-3" />
          </button>
          {showProductTypes && (
            <div className="absolute z-20 mt-1 w-full bg-[#1e1e2e] border border-[#3a3a4e] rounded shadow-lg">
              {productTypes.map(p => (
                <div key={p.id} onClick={() => { setProductType(p.id); setShowProductTypes(false); }} className="px-2 py-1 text-[10px] hover:bg-[#2a2a3e] cursor-pointer">
                  {p.label} <span className="text-gray-500">({p.description})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setShowOrderTypes(!showOrderTypes)} className="w-full py-1 text-[10px] bg-[#252540] border border-[#3a3a4e] rounded flex justify-between items-center px-1">
            {orderTypes.find(o => o.id === orderType)?.label} <ChevronDown className="w-3 h-3" />
          </button>
          {showOrderTypes && (
            <div className="absolute z-20 mt-1 w-full bg-[#1e1e2e] border border-[#3a3a4e] rounded shadow-lg">
              {orderTypes.map(o => (
                <div key={o.id} onClick={() => { setOrderType(o.id); setShowOrderTypes(false); }} className="px-2 py-1 text-[10px] hover:bg-[#2a2a3e] cursor-pointer">
                  {o.label} <span className="text-gray-500">({o.description})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setValidity(validity === "DAY" ? "IOC" : "DAY")} className="w-full py-1 text-[10px] bg-[#252540] border border-[#3a3a4e] rounded">
            {validity}
          </button>
        </div>
      </div>

      {/* Buy/Sell buttons compact */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <button onClick={() => setSide("BUY")} className={`py-1.5 text-xs font-bold rounded ${side === "BUY" ? "bg-emerald-700 text-white" : "bg-[#252540] text-gray-300"}`}>BUY</button>
        <button onClick={() => setSide("SELL")} className={`py-1.5 text-xs font-bold rounded ${side === "SELL" ? "bg-rose-700 text-white" : "bg-[#252540] text-gray-300"}`}>SELL</button>
      </div>

      {/* Quantity row */}
      <div className="mb-2">
        <label className="text-[9px] text-gray-400 block mb-0.5">Qty</label>
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full px-2 py-1 text-xs bg-[#252540] border border-[#3a3a4e] rounded focus:outline-none focus:ring-1 focus:ring-[#0f3460]" min="1" />
      </div>

      {/* Conditional price fields (compact) */}
      {(orderType === "LIMIT" || orderType === "SL") && (
        <div className="mb-2">
          <label className="text-[9px] text-gray-400 block mb-0.5">Price (₹)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`LTP ${displayPrice}`} className="w-full px-2 py-1 text-xs bg-[#252540] border border-[#3a3a4e] rounded" step="0.05" />
        </div>
      )}
      {(orderType === "SL-M" || orderType === "SL") && (
        <div className="mb-2">
          <label className="text-[9px] text-gray-400 block mb-0.5">Trigger (₹)</label>
          <input type="number" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} className="w-full px-2 py-1 text-xs bg-[#252540] border border-[#3a3a4e] rounded" step="0.05" />
        </div>
      )}

      {/* Place order button */}
      <button onClick={placeOrder} disabled={isPlacing} className={`w-full py-1.5 text-xs font-bold rounded mt-1 ${side === "BUY" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"} disabled:opacity-50`}>
        {isPlacing ? "Placing..." : `${side} ${selected.symbol}`}
      </button>
    </div>
  );
}