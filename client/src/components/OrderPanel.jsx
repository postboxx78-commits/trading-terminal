import { useState } from "react";
import axios from "axios";
import { ChevronDown, TrendingUp, TrendingDown, X } from "lucide-react";

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
    { id: "MARKET", label: "Market", desc: "At market" },
    { id: "LIMIT", label: "Limit", desc: "Specified price" },
    { id: "SL-M", label: "SL-M", desc: "Stop loss market" },
    { id: "SL", label: "SL", desc: "Stop loss limit" },
  ];
  const productTypes = [
    { id: "MIS", label: "MIS", desc: "Intraday" },
    { id: "CNC", label: "CNC", desc: "Delivery" },
    { id: "NRML", label: "NRML", desc: "Normal" },
  ];

  if (!selected) {
    return (
      <div className="bg-[#13151A] rounded-xl border border-[#2C2F36] p-3 text-center">
        <p className="text-xs text-gray-500">Select a symbol to order</p>
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
      setOrderStatus({ type: 'error', message: 'Enter price' });
      return false;
    }
    if ((orderType === "SL-M" || orderType === "SL") && (!triggerPrice || triggerPrice <= 0)) {
      setOrderStatus({ type: 'error', message: 'Enter trigger' });
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
      const res = await axios.post("http://140.245.234.6:3001/order", {
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
      if (res.data.success) {
        setOrderStatus({ type: 'success', message: 'Order placed!' });
        setPrice("");
        setTriggerPrice("");
        setTimeout(() => setOrderStatus(null), 2000);
      } else {
        setOrderStatus({ type: 'error', message: res.data.error || 'Failed' });
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
    <div className="bg-[#13151A] rounded-xl border border-[#2C2F36] p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#2C2F36]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-200">{selected.symbol}</span>
          <span className="text-[9px] text-gray-500 bg-[#1A1C23] px-1.5 py-0.5 rounded">{productType}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
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
              {isUp ? <TrendingUp className="w-3 h-3 text-[#00D09C]" /> : <TrendingDown className="w-3 h-3 text-[#FF4D4D]" />}
              <span className={`text-[9px] font-medium ${isUp ? 'text-[#00D09C]' : 'text-[#FF4D4D]'}`}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status message */}
      {orderStatus && (
        <div className={`mb-2 p-1.5 rounded text-[10px] text-center ${
          orderStatus.type === 'success' ? 'bg-[#00D09C]/10 text-[#00D09C]' : 'bg-[#FF4D4D]/10 text-[#FF4D4D]'
        }`}>
          {orderStatus.message}
        </div>
      )}

      {/* Product + Order type row (compact) */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <div className="relative">
          <button onClick={() => setShowProductTypes(!showProductTypes)} className="w-full py-1 text-[10px] bg-[#1A1C23] border border-[#2C2F36] rounded flex justify-between items-center px-1.5 text-gray-300">
            {productTypes.find(p => p.id === productType)?.label} <ChevronDown className="w-3 h-3" />
          </button>
          {showProductTypes && (
            <div className="absolute z-20 mt-1 w-full bg-[#13151A] border border-[#2C2F36] rounded shadow-lg">
              {productTypes.map(p => (
                <div key={p.id} onClick={() => { setProductType(p.id); setShowProductTypes(false); }} className="px-2 py-1 text-[10px] hover:bg-[#1A1C23] cursor-pointer text-gray-300">
                  {p.label} <span className="text-gray-500">({p.desc})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setShowOrderTypes(!showOrderTypes)} className="w-full py-1 text-[10px] bg-[#1A1C23] border border-[#2C2F36] rounded flex justify-between items-center px-1.5 text-gray-300">
            {orderTypes.find(o => o.id === orderType)?.label} <ChevronDown className="w-3 h-3" />
          </button>
          {showOrderTypes && (
            <div className="absolute z-20 mt-1 w-full bg-[#13151A] border border-[#2C2F36] rounded shadow-lg">
              {orderTypes.map(o => (
                <div key={o.id} onClick={() => { setOrderType(o.id); setShowOrderTypes(false); }} className="px-2 py-1 text-[10px] hover:bg-[#1A1C23] cursor-pointer text-gray-300">
                  {o.label} <span className="text-gray-500">({o.desc})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Validity + Quantity row */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <button onClick={() => setValidity(validity === "DAY" ? "IOC" : "DAY")} className="py-1 text-[10px] bg-[#1A1C23] border border-[#2C2F36] rounded text-gray-300">
          {validity}
        </button>
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="px-1.5 py-1 text-[10px] bg-[#1A1C23] border border-[#2C2F36] rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]" min="1" />
      </div>

      {/* Conditional price fields */}
      {(orderType === "LIMIT" || orderType === "SL") && (
        <div className="mb-2">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`Price (₹)`} className="w-full px-1.5 py-1 text-[10px] bg-[#1A1C23] border border-[#2C2F36] rounded text-gray-200" step="0.05" />
        </div>
      )}
      {(orderType === "SL-M" || orderType === "SL") && (
        <div className="mb-2">
          <input type="number" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} placeholder="Trigger price" className="w-full px-1.5 py-1 text-[10px] bg-[#1A1C23] border border-[#2C2F36] rounded text-gray-200" step="0.05" />
        </div>
      )}

      {/* Buy/Sell buttons */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <button onClick={() => setSide("BUY")} className={`py-1.5 text-xs font-bold rounded ${side === "BUY" ? "bg-[#00D09C] text-black" : "bg-[#1A1C23] text-gray-300 border border-[#2C2F36]"}`}>
          BUY
        </button>
        <button onClick={() => setSide("SELL")} className={`py-1.5 text-xs font-bold rounded ${side === "SELL" ? "bg-[#FF4D4D] text-white" : "bg-[#1A1C23] text-gray-300 border border-[#2C2F36]"}`}>
          SELL
        </button>
      </div>

      {/* Place button */}
      <button onClick={placeOrder} disabled={isPlacing} className={`w-full py-1.5 text-xs font-bold rounded ${side === "BUY" ? "bg-[#00D09C] hover:bg-[#00B886] text-black" : "bg-[#FF4D4D] hover:bg-[#E04444] text-white"} disabled:opacity-50`}>
        {isPlacing ? "Placing..." : `${side} ${selected.symbol}`}
      </button>
    </div>
  );
}