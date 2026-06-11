// OrderPanel.jsx - Enhanced with modern UI components and better feedback
import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronDown, Circle, CheckCircle, X, AlertCircle, TrendingUp, TrendingDown, Info } from "lucide-react";

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
  const [showValidityTypes, setShowValidityTypes] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  const orderTypes = [
    { id: "MARKET", label: "Market", description: "Execute at current price", apiType: "MKT", color: "purple" },
    { id: "LIMIT", label: "Limit", description: "Execute at specified price", apiType: "L", color: "blue" },
    { id: "SL-M", label: "Stop Loss Market", description: "Market order when trigger hits", apiType: "SL-M", color: "orange" },
    { id: "SL", label: "Stop Loss Limit", description: "Limit order when trigger hits", apiType: "SL", color: "red" },
  ];

  const productTypes = [
    { id: "MIS", label: "MIS", description: "Intraday", color: "purple" },
    { id: "CNC", label: "CNC", description: "Delivery", color: "blue" },
    { id: "NRML", label: "NRML", description: "Normal", color: "green" },
  ];

  const validityTypes = [
    { id: "DAY", label: "Day", description: "Valid for the day" },
    { id: "IOC", label: "IOC", description: "Immediate or Cancel" },
  ];

  if (!selected) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Select a symbol to place order</p>
        <p className="text-xs text-gray-400 mt-1">Click on any symbol from your watchlist</p>
      </div>
    );
  }

  const validateOrder = () => {
    if (!qty || qty <= 0) {
      setOrderStatus({ type: 'error', message: 'Please enter valid quantity' });
      setTimeout(() => setOrderStatus(null), 3000);
      return false;
    }

    if ((orderType === "LIMIT" || orderType === "SL") && (!price || price <= 0)) {
      setOrderStatus({ type: 'error', message: 'Please enter valid price' });
      setTimeout(() => setOrderStatus(null), 3000);
      return false;
    }

    if ((orderType === "SL-M" || orderType === "SL") && (!triggerPrice || triggerPrice <= 0)) {
      setOrderStatus({ type: 'error', message: 'Please enter valid trigger price' });
      setTimeout(() => setOrderStatus(null), 3000);
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
      const exchange = selected.exch || "nse_cm";

      const orderData = {
        symbol: selected.symbol,
        exch: exchange,
        qty: parseInt(qty),
        side: apiSide,
        orderType: orderType,
        productType: productType,
        validity: validity,
        price: (orderType === "LIMIT" || orderType === "SL") ? parseFloat(price) : 0,
        triggerPrice: (orderType === "SL-M" || orderType === "SL") ? parseFloat(triggerPrice) : 0
      };

      console.log("Placing order:", orderData);
      const response = await axios.post("http://140.245.234.6:3001/order", orderData);

      if (response.data.success) {
        setOrderStatus({ type: 'success', message: `✓ Order placed successfully! Order ID: ${response.data.orderId || 'Generated'}` });
        setPrice("");
        setTriggerPrice("");
        setTimeout(() => setOrderStatus(null), 4000);
      } else {
        setOrderStatus({ type: 'error', message: `✗ ${response.data.error || 'Order failed'}` });
        setTimeout(() => setOrderStatus(null), 4000);
      }
      
    } catch (error) {
      console.error("Order failed:", error);
      setOrderStatus({ type: 'error', message: `✗ ${error.response?.data?.error || error.message || 'Failed to place order'}` });
      setTimeout(() => setOrderStatus(null), 4000);
    } finally {
      setIsPlacing(false);
    }
  };

  const symbolData = selected ? ltpData[selected.symbol] : null;
  const displayPrice = currentPrice || symbolData?.price || selected?.ltp || "2345.50";
  const priceChange = symbolData?.change ? parseFloat(symbolData.change) : 0;
  const priceChangePercent = symbolData?.perChange ? parseFloat(symbolData.perChange) : 0;
  const isPriceUp = priceChange > 0;
  const isPriceDown = priceChange < 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">📝</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Place Order</span>
            <div className="text-sm font-bold text-gray-800">{selected.symbol}</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status Message */}
      {orderStatus && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-slide-down ${
          orderStatus.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200'
        }`}>
          {orderStatus.message}
        </div>
      )}

      {/* Current Price Card */}
      <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">LTP (Live)</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-800">
              ₹{typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
            </span>
            {symbolData && (
              <div className="flex items-center justify-end space-x-1 mt-1">
                {isPriceUp ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : isPriceDown ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : null}
                <span className={`text-[10px] font-semibold ${isPriceUp ? 'text-green-600' : isPriceDown ? 'text-red-600' : 'text-gray-400'}`}>
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Product Type */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Product Type</label>
          <button
            onClick={() => setShowProductTypes(!showProductTypes)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium">{productTypes.find(p => p.id === productType)?.label}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProductTypes ? 'rotate-180' : ''}`} />
          </button>
          
          {showProductTypes && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {productTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    setProductType(type.id);
                    setShowProductTypes(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center">
                    {productType === type.id ? <CheckCircle className="w-4 h-4 text-blue-600 mr-2" /> : <Circle className="w-4 h-4 text-gray-300 mr-2" />}
                    <div>
                      <span className="text-sm font-medium text-gray-800">{type.label}</span>
                      <span className="text-xs text-gray-400 ml-1">{type.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Type */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Order Type</label>
          <button
            onClick={() => setShowOrderTypes(!showOrderTypes)}
            className="w-full px-3 py-2 text-sm bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg flex items-center justify-between hover:from-gray-900 hover:to-gray-950 transition-all shadow-sm"
          >
            <span className="font-medium">{orderTypes.find(t => t.id === orderType)?.label}</span>
            <ChevronDown className="w-4 h-4 text-gray-300 transition-transform" />
          </button>
          
          {showOrderTypes && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {orderTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    setOrderType(type.id);
                    setShowOrderTypes(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center">
                    {orderType === type.id ? <CheckCircle className="w-4 h-4 text-gray-800 mr-2" /> : <Circle className="w-4 h-4 text-gray-300 mr-2" />}
                    <div>
                      <span className="text-sm font-medium text-gray-800">{type.label}</span>
                      <span className="text-xs text-gray-400 ml-1">{type.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validity */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Validity</label>
          <button
            onClick={() => setShowValidityTypes(!showValidityTypes)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <span className="font-medium">{validityTypes.find(v => v.id === validity)?.label}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showValidityTypes ? 'rotate-180' : ''}`} />
          </button>
          
          {showValidityTypes && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {validityTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    setValidity(type.id);
                    setShowValidityTypes(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center">
                    {validity === type.id ? <CheckCircle className="w-4 h-4 text-blue-600 mr-2" /> : <Circle className="w-4 h-4 text-gray-300 mr-2" />}
                    <div>
                      <span className="text-sm font-medium text-gray-800">{type.label}</span>
                      <span className="text-xs text-gray-400 ml-1">{type.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buy/Sell Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSide("BUY")}
            className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
              side === "BUY"
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide("SELL")}
            className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
              side === "SELL"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            SELL
          </button>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            min="1"
            disabled={isPlacing}
          />
        </div>

        {/* Price for Limit Orders */}
        {(orderType === "LIMIT" || orderType === "SL") && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={`Current: ₹${displayPrice}`}
              step="0.05"
              min="0.05"
              disabled={isPlacing}
            />
          </div>
        )}

        {/* Trigger Price for Stop Loss */}
        {(orderType === "SL-M" || orderType === "SL") && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Trigger (₹)</label>
            <input
              type="number"
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter trigger price"
              step="0.05"
              min="0.05"
              disabled={isPlacing}
            />
            {displayPrice && (
              <p className="text-[9px] text-gray-400 mt-1">Current LTP: ₹{typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}</p>
            )}
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={placeOrder}
          disabled={isPlacing}
          className={`w-full py-3 text-sm font-bold rounded-lg mt-2 transition-all duration-200 transform hover:scale-[1.02] ${
            side === "BUY"
              ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
              : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md"
          } ${isPlacing ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
        >
          {isPlacing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Placing Order...
            </span>
          ) : (
            `${side === "BUY" ? "BUY" : "SELL"} ${selected.symbol}`
          )}
        </button>

        {/* Order Info Tag */}
        <div className="mt-3 pt-2 text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[9px] font-medium bg-gray-100 text-gray-500">
            {productType} • {orderTypes.find(t => t.id === orderType)?.label} • {validity}
          </span>
        </div>
      </div>
    </div>
  );
}