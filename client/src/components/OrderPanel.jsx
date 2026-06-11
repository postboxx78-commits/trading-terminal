// OrderPanel.jsx - Updated to receive and display real LTP
import { useState, useEffect } from "react";
import axios from "axios";
import { ChevronDown, Circle, CheckCircle, X, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

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

  // Update price field when LTP changes (optional - can be used to set default price)
  useEffect(() => {
    if (currentPrice && orderType === "LIMIT" && !price) {
      // Optionally set default price to LTP for limit orders
      // setPrice(currentPrice.toString());
    }
  }, [currentPrice, orderType]);

  const orderTypes = [
    { id: "MARKET", label: "Market", description: "Execute at current price", apiType: "MKT" },
    { id: "LIMIT", label: "Limit", description: "Execute at specified price", apiType: "L" },
    { id: "SL-M", label: "Stop Loss Market", description: "Market order when trigger hits", apiType: "SL-M" },
    { id: "SL", label: "Stop Loss Limit", description: "Limit order when trigger hits", apiType: "SL" },
  ];

  const productTypes = [
    { id: "MIS", label: "MIS", description: "Intraday" },
    { id: "CNC", label: "CNC", description: "Delivery" },
    { id: "NRML", label: "NRML", description: "Normal" },
  ];

  const validityTypes = [
    { id: "DAY", label: "Day", description: "Valid for the day" },
    { id: "IOC", label: "IOC", description: "Immediate or Cancel" },
  ];

  if (!selected) {
    return (
      <div className="text-center py-6 px-2">
        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">Select a symbol to place order</p>
      </div>
    );
  }

  const validateOrder = () => {
    if (!qty || qty <= 0) {
      setOrderStatus({ type: 'error', message: 'Please enter valid quantity' });
      return false;
    }

    if ((orderType === "LIMIT" || orderType === "SL") && (!price || price <= 0)) {
      setOrderStatus({ type: 'error', message: 'Please enter valid price' });
      return false;
    }

    if ((orderType === "SL-M" || orderType === "SL") && (!triggerPrice || triggerPrice <= 0)) {
      setOrderStatus({ type: 'error', message: 'Please enter valid trigger price' });
      return false;
    }

    return true;
  };

  const placeOrder = async () => {
    if (!validateOrder()) return;

    setIsPlacing(true);
    setOrderStatus(null);

    try {
      // Map side to API format
      const apiSide = side === "BUY" ? "B" : "S";
      
      // Map exchange
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
        setOrderStatus({ 
          type: 'success', 
          message: `Order placed successfully! Order ID: ${response.data.orderId}` 
        });
        
        // Clear form after successful order
        setPrice("");
        setTriggerPrice("");
        
        // Auto-clear status after 5 seconds
        setTimeout(() => setOrderStatus(null), 5000);
      } else {
        setOrderStatus({ type: 'error', message: response.data.error || 'Order failed' });
      }
      
    } catch (error) {
      console.error("Order failed:", error);
      setOrderStatus({ 
        type: 'error', 
        message: error.response?.data?.error || error.message || 'Failed to place order' 
      });
    } finally {
      setIsPlacing(false);
    }
  };

  // Get the latest price data for the selected symbol
  const symbolData = selected ? ltpData[selected.symbol] : null;
  const displayPrice = currentPrice || symbolData?.price || selected?.ltp || "2345.50";
  
  // Calculate price change if available
  const priceChange = symbolData?.change ? parseFloat(symbolData.change) : 0;
  const priceChangePercent = symbolData?.perChange ? parseFloat(symbolData.perChange) : 0;
  const isPriceUp = priceChange > 0;
  const isPriceDown = priceChange < 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Place Order</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {selected.symbol}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status Message */}
      {orderStatus && (
        <div className={`mb-3 p-2 rounded text-xs ${
          orderStatus.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {orderStatus.message}
        </div>
      )}

      {/* Current Price with Live Updates */}
      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">LTP (Live)</span>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-800">
              ₹{typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
            </span>
            {symbolData && (
              <div className="flex items-center justify-end space-x-1 mt-0.5">
                {isPriceUp ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : isPriceDown ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : null}
                <span className={`text-[10px] font-medium ${
                  isPriceUp ? 'text-green-600' : isPriceDown ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>
        {symbolData?.volume && (
          <div className="flex items-center justify-between mt-1 text-[9px] text-gray-400">
            <span>Volume</span>
            <span>{parseInt(symbolData.volume).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Product Type Selection */}
      <div className="relative mb-3">
        <label className="block text-xs text-gray-500 mb-1">Product Type</label>
        <button
          onClick={() => setShowProductTypes(!showProductTypes)}
          className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded flex items-center justify-between hover:bg-gray-100"
        >
          <span>{productTypes.find(p => p.id === productType)?.label}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showProductTypes ? 'rotate-180' : ''}`} />
        </button>
        
        {showProductTypes && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg">
            {productTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => {
                  setProductType(type.id);
                  setShowProductTypes(false);
                }}
                className="px-2 py-1.5 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center">
                  {productType === type.id ? (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-gray-300 mr-1.5" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-gray-800">{type.label}</span>
                    <span className="text-[9px] text-gray-400 ml-1">{type.description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Type Selection */}
      <div className="relative mb-3">
        <label className="block text-xs text-gray-500 mb-1">Order Type</label>
        <button
          onClick={() => setShowOrderTypes(!showOrderTypes)}
          className="w-full px-2 py-1.5 text-xs bg-gray-800 text-white border border-gray-700 rounded flex items-center justify-between hover:bg-gray-700"
        >
          <span>{orderTypes.find(t => t.id === orderType)?.label}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-300 transition-transform ${showOrderTypes ? 'rotate-180' : ''}`} />
        </button>
        
        {showOrderTypes && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg">
            {orderTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => {
                  setOrderType(type.id);
                  setShowOrderTypes(false);
                }}
                className="px-2 py-1.5 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center">
                  {orderType === type.id ? (
                    <CheckCircle className="w-3.5 h-3.5 text-gray-800 mr-1.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-gray-300 mr-1.5" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-gray-800">{type.label}</span>
                    <span className="text-[9px] text-gray-400 ml-1">{type.description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validity Selection */}
      <div className="relative mb-3">
        <label className="block text-xs text-gray-500 mb-1">Validity</label>
        <button
          onClick={() => setShowValidityTypes(!showValidityTypes)}
          className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded flex items-center justify-between hover:bg-gray-100"
        >
          <span>{validityTypes.find(v => v.id === validity)?.label}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showValidityTypes ? 'rotate-180' : ''}`} />
        </button>
        
        {showValidityTypes && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg">
            {validityTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => {
                  setValidity(type.id);
                  setShowValidityTypes(false);
                }}
                className="px-2 py-1.5 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center">
                  {validity === type.id ? (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-gray-300 mr-1.5" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-gray-800">{type.label}</span>
                    <span className="text-[9px] text-gray-400 ml-1">{type.description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buy/Sell Buttons */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <button
          onClick={() => setSide("BUY")}
          className={`py-1.5 text-xs font-medium rounded ${
            side === "BUY"
              ? "bg-green-700 text-white border border-green-800"
              : "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600"
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide("SELL")}
          className={`py-1.5 text-xs font-medium rounded ${
            side === "SELL"
              ? "bg-red-700 text-white border border-red-800"
              : "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600"
          }`}
        >
          SELL
        </button>
      </div>

      {/* Quantity */}
      <div className="mb-2">
        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
          min="1"
          disabled={isPlacing}
        />
      </div>

      {/* Price for Limit Orders */}
      {(orderType === "LIMIT" || orderType === "SL") && (
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
            placeholder={`Current: ₹${displayPrice}`}
            step="0.05"
            min="0.05"
            disabled={isPlacing}
          />
        </div>
      )}

      {/* Trigger Price for Stop Loss Orders */}
      {(orderType === "SL-M" || orderType === "SL") && (
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Trigger (₹)</label>
          <input
            type="number"
            value={triggerPrice}
            onChange={(e) => setTriggerPrice(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
            placeholder="Enter trigger price"
            step="0.05"
            min="0.05"
            disabled={isPlacing}
          />
          {displayPrice && (
            <p className="text-[8px] text-gray-400 mt-1">
              Current LTP: ₹{typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
            </p>
          )}
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={placeOrder}
        disabled={isPlacing}
        className={`w-full py-2 text-xs font-medium rounded mt-2 ${
          side === "BUY"
            ? "bg-green-700 hover:bg-green-800 text-white border border-green-800"
            : "bg-red-700 hover:bg-red-800 text-white border border-red-800"
        } ${isPlacing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isPlacing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Placing Order...
          </span>
        ) : (
          `${side === "BUY" ? "BUY" : "SELL"} ${selected.symbol}`
        )}
      </button>

      {/* Order Info */}
      <div className="mt-2 text-[8px] text-gray-400 text-center">
        {productType} • {orderType} • {validity}
      </div>
    </div>
  );
}