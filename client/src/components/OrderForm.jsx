import { useState } from "react";
import axios from "axios";

export default function OrderForm({ selectedSymbol }) {
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState("MKT");
  const [side, setSide] = useState("B");

  const submit = async () => {
    try {
      const response = await axios.post("http://140.245.234.6:3001/order", {
        symbol: selectedSymbol?.symbol || "NIFTY",
        exch: "nse_cm",
        qty: parseInt(qty),
        side: side,
        orderType: orderType,
        price: price || "0"
      });
      
      console.log("Order placed:", response.data);
      alert("Order placed successfully");
      
    } catch (error) {
      console.error("Order failed:", error);
      alert("Order failed: " + (error.response?.data?.emsg || error.message));
    }
  };

  if (!selectedSymbol) {
    return <div className="p-4 text-gray-500">Select a symbol to place order</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold mb-3">Place Order - {selectedSymbol.symbol}</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            min="1"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Order Type</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="MKT">Market</option>
            <option value="LMT">Limit</option>
          </select>
        </div>

        {orderType === "LMT" && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              step="0.05"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSide("B");
              submit();
            }}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
          >
            BUY
          </button>
          <button
            onClick={() => {
              setSide("S");
              submit();
            }}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
          >
            SELL
          </button>
        </div>
      </div>
    </div>
  );
}