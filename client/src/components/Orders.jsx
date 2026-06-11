import { useState, useEffect } from "react";
import axios from "axios";
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, Filter, X, Edit2, Trash2 } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [filter, setFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyData, setModifyData] = useState({ quantity: 0, price: "", validity: "DAY" });

  const fetchOrderBook = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://140.245.234.6:3001/api/orders/book");
      if (res.data.success) {
        setOrders(res.data.data);
        setLastUpdated(new Date());
      } else setError(res.data.error);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const fetchTradeBook = async () => {
    try {
      const res = await axios.get("http://140.245.234.6:3001/api/orders/trades");
      if (res.data.success) setTrades(res.data.data);
    } catch (err) { console.error(err); }
  };
  const fetchOrderHistory = async (orderId) => {
    try {
      const res = await axios.post("http://140.245.234.6:3001/api/orders/history", { orderId });
      if (res.data.success) { setOrderHistory(res.data.data); setShowHistoryModal(true); }
      else alert("Failed to fetch history");
    } catch (err) { alert("Error fetching history"); }
  };
  const cancelOrder = async (order) => {
    if (!confirm(`Cancel order ${order.orderId}?`)) return;
    setCancellingOrder(order.orderId);
    try {
      const res = await axios.post("http://140.245.234.6:3001/api/orders/cancel", { orderId: order.orderId, tradingSymbol: order.tradingSymbol, exchange: order.exchange || "nse_cm" });
      if (res.data.success) { alert("Cancelled"); fetchOrderBook(); }
      else alert("Cancel failed");
    } catch (err) { alert("Error cancelling"); }
    finally { setCancellingOrder(null); }
  };
  const modifyOrder = async () => {
    try {
      const res = await axios.post("http://140.245.234.6:3001/api/orders/modify", {
        orderId: selectedOrder.orderId,
        tradingSymbol: selectedOrder.tradingSymbol,
        exchange: selectedOrder.exchange || "nse_cm",
        quantity: modifyData.quantity,
        price: modifyData.price,
        validity: modifyData.validity
      });
      if (res.data.success) { alert("Modified"); setShowModifyModal(false); fetchOrderBook(); }
      else alert("Modify failed");
    } catch (err) { alert("Error modifying"); }
  };

  useEffect(() => {
    fetchOrderBook(); fetchTradeBook();
    let interval;
    if (autoRefresh) interval = setInterval(() => { fetchOrderBook(); fetchTradeBook(); }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete') || s.includes('executed')) return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (s.includes('reject') || s.includes('failed')) return <XCircle className="w-3 h-3 text-red-500" />;
    if (s.includes('pending') || s.includes('open')) return <Clock className="w-3 h-3 text-yellow-500" />;
    return <AlertCircle className="w-3 h-3 text-gray-400" />;
  };
  const filteredOrders = orders.filter(o => {
    if (filter === "ALL") return true;
    const s = o.status?.toLowerCase() || '';
    if (filter === "OPEN") return s.includes('pending') || s.includes('open');
    if (filter === "COMPLETED") return s.includes('complete');
    if (filter === "REJECTED") return s.includes('reject');
    if (filter === "CANCELLED") return s.includes('cancel');
    return false;
  });

  if (error) return <div className="p-4 text-red-500 text-center">{error}<button onClick={fetchOrderBook} className="ml-2 text-gray-500">Retry</button></div>;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <button onClick={() => setActiveTab("orders")} className={`px-2 py-1 text-[10px] rounded ${activeTab === "orders" ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white border border-gray-200'}`}>Orders ({orders.length})</button>
          <button onClick={() => setActiveTab("trades")} className={`px-2 py-1 text-[10px] rounded ${activeTab === "trades" ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white border border-gray-200'}`}>Trades ({trades.length})</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`text-[9px] px-1.5 py-0.5 rounded ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>Auto</button>
          <button onClick={() => { fetchOrderBook(); fetchTradeBook(); }} disabled={loading}><RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''} text-gray-500`} /></button>
        </div>
        {activeTab === "orders" && (
          <select value={filter} onChange={e => setFilter(e.target.value)} className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-600">
            <option value="ALL">All</option><option value="OPEN">Open</option><option value="COMPLETED">Completed</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option>
          </select>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab === "orders" ? (
          filteredOrders.length === 0 ? <div className="p-4 text-center text-gray-400">No orders</div> : (
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-white text-gray-500"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Symbol</th><th className="p-2 text-left">Type</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Actions</th></tr></thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.orderId} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-2 font-mono text-gray-600">{o.orderId.slice(-6)}</td>
                    <td className="p-2 font-medium text-gray-800">{o.symbol}</td>
                    <td className="p-2"><span className={o.transactionType === "BUY" ? "text-green-600" : "text-red-600"}>{o.transactionType}</span><div className="text-[8px] text-gray-400">{o.orderType}</div></td>
                    <td className="p-2 text-right">{o.quantity}</td>
                    <td className="p-2 text-right">₹{o.price.toFixed(2)}</td>
                    <td className="p-2"><div className="flex items-center gap-1">{getStatusIcon(o.status)}<span className="text-[9px]">{o.status}</span></div></td>
                    <td className="p-2"><div className="flex gap-1"><button onClick={() => fetchOrderHistory(o.orderId)}><Eye className="w-3 h-3 text-gray-400" /></button><button onClick={() => { setSelectedOrder(o); setModifyData({ quantity: o.quantity, price: o.price, validity: o.validity }); setShowModifyModal(true); }}><Edit2 className="w-3 h-3 text-gray-400" /></button><button onClick={() => cancelOrder(o)} disabled={cancellingOrder === o.orderId}>{cancellingOrder === o.orderId ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 text-gray-400" />}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          trades.length === 0 ? <div className="p-4 text-center text-gray-400">No trades</div> : (
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-white text-gray-500"><tr><th className="p-2 text-left">Order ID</th><th className="p-2 text-left">Symbol</th><th className="p-2 text-left">Type</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-left">Time</th></tr></thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.exchangeOrderId} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-2 font-mono text-gray-600">{t.orderId?.slice(-6)}</td>
                    <td className="p-2 text-gray-800">{t.symbol}</td>
                    <td className="p-2"><span className={t.transactionType === "BUY" ? "text-green-600" : "text-red-600"}>{t.transactionType}</span></td>
                    <td className="p-2 text-right">{t.quantity}</td>
                    <td className="p-2 text-right">₹{t.price.toFixed(2)}</td>
                    <td className="p-2 text-gray-500">{t.tradeTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
      {lastUpdated && <div className="p-1 border-t border-gray-100 text-[8px] text-gray-400 text-right">Updated: {lastUpdated.toLocaleTimeString()}</div>}
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md border border-gray-200 shadow-lg p-3">
            <div className="flex justify-between mb-2"><h3 className="text-sm font-semibold text-gray-800">Order History</h3><button onClick={() => setShowHistoryModal(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
            <div className="max-h-96 overflow-auto space-y-2">
              {orderHistory.map((h, i) => <div key={i} className="bg-gray-50 p-2 rounded text-[10px]">{h.status} - {h.filledDateTime}<div className="text-gray-500">Qty: {h.quantity} @ ₹{h.price}</div></div>)}
            </div>
          </div>
        </div>
      )}
      {/* Modify Modal */}
      {showModifyModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm border border-gray-200 shadow-lg p-3">
            <div className="flex justify-between mb-2"><h3 className="text-sm font-semibold text-gray-800">Modify Order</h3><button onClick={() => setShowModifyModal(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
            <div className="mb-2"><label className="text-[10px] text-gray-500">Quantity</label><input type="number" value={modifyData.quantity} onChange={e => setModifyData({...modifyData, quantity: parseInt(e.target.value)})} className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded" /></div>
            <div className="mb-2"><label className="text-[10px] text-gray-500">Price (₹)</label><input type="number" value={modifyData.price} onChange={e => setModifyData({...modifyData, price: e.target.value})} className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded" /></div>
            <div className="mb-2"><label className="text-[10px] text-gray-500">Validity</label><select value={modifyData.validity} onChange={e => setModifyData({...modifyData, validity: e.target.value})} className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded"><option>DAY</option><option>IOC</option></select></div>
            <button onClick={modifyOrder} className="w-full bg-blue-600 py-1.5 rounded text-xs font-medium text-white">Modify</button>
          </div>
        </div>
      )}
    </div>
  );
}