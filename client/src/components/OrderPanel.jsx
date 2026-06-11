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
      <div className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
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
    <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-800">{selected.symbol}</span>
          <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{productType}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* LTP ticker */}
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] text-gray-400">LTP</span>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-800">₹{displayPrice}</span>
          {symbolData && (
            <div className="flex items-center justify-end gap-1">
              {isUp ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
              <span className={`text-[9px] font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status message */}
      {orderStatus && (
        <div className={`mb-2 p-1.5 rounded text-[10px] text-center ${
          orderStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {orderStatus.message}
        </div>
      )}

      {/* Product + Order type row (compact) */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <div className="relative">
          <button onClick={() => setShowProductTypes(!showProductTypes)} className="w-full py-1 text-[10px] bg-gray-50 border border-gray-200 rounded flex justify-between items-center px-1.5 text-gray-700">
            {productTypes.find(p => p.id === productType)?.label} <ChevronDown className="w-3 h-3" />
          </button>
          {showProductTypes && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg">
              {productTypes.map(p => (
                <div key={p.id} onClick={() => { setProductType(p.id); setShowProductTypes(false); }} className="px-2 py-1 text-[10px] hover:bg-gray-50 cursor-pointer text-gray-700">
                  {p.label} <span className="text-gray-400">({p.desc})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setShowOrderTypes(!showOrderTypes)} className="w-full py-1 text-[10px] bg-gray-800 text-white border border-gray-700 rounded flex justify-between items-center px-1.5">
            {orderTypes.find(o => o.id === orderType)?.label} <ChevronDown className="w-3 h-3" />
          </button>
          {showOrderTypes && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg">
              {orderTypes.map(o => (
                <div key={o.id} onClick={() => { setOrderType(o.id); setShowOrderTypes(false); }} className="px-2 py-1 text-[10px] hover:bg-gray-50 cursor-pointer text-gray-700">
                  {o.label} <span className="text-gray-400">({o.desc})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Validity + Quantity row */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <button onClick={() => setValidity(validity === "DAY" ? "IOC" : "DAY")} className="py-1 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-700">
          {validity}
        </button>
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="px-1.5 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" min="1" />
      </div>

      {/* Conditional price fields */}
      {(orderType === "LIMIT" || orderType === "SL") && (
        <div className="mb-2">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`Price (₹)`} className="w-full px-1.5 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-800" step="0.05" />
        </div>
      )}
      {(orderType === "SL-M" || orderType === "SL") && (
        <div className="mb-2">
          <input type="number" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} placeholder="Trigger price" className="w-full px-1.5 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-800" step="0.05" />
        </div>
      )}

      {/* Buy/Sell buttons */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <button onClick={() => setSide("BUY")} className={`py-1.5 text-xs font-bold rounded ${side === "BUY" ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
          BUY
        </button>
        <button onClick={() => setSide("SELL")} className={`py-1.5 text-xs font-bold rounded ${side === "SELL" ? "bg-red-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
          SELL
        </button>
      </div>

      {/* Place button */}
      <button onClick={placeOrder} disabled={isPlacing} className={`w-full py-1.5 text-xs font-bold rounded ${side === "BUY" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"} disabled:opacity-50`}>
        {isPlacing ? "Placing..." : `${side} ${selected.symbol}`}
      </button>
    </div>
  );
}