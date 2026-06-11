// Orders.jsx - Updated with real API data
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Edit2,
  Trash2
} from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState("orders"); // 'orders' or 'trades'
  const [filter, setFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyData, setModifyData] = useState({
    quantity: 0,
    price: "",
    triggerPrice: "",
    orderType: "MARKET",
    validity: "DAY"
  });

  const fetchOrderBook = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("http://140.245.234.6:3001/api/orders/book");
      
      if (response.data.success) {
        setOrders(response.data.data);
        setLastUpdated(new Date());
      } else {
        setError(response.data.error || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchTradeBook = async () => {
    try {
      const response = await axios.get("http://140.245.234.6:3001/api/orders/trades");
      
      if (response.data.success) {
        setTrades(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    }
  };

  const fetchOrderHistory = async (orderId) => {
    setHistoryLoading(true);
    try {
      const response = await axios.post("http://140.245.234.6:3001/api/orders/history", {
        orderId: orderId
      });
      
      if (response.data.success) {
        setOrderHistory(response.data.data);
        setShowHistoryModal(true);
      } else {
        alert(`Failed to fetch history: ${response.data.error}`);
      }
    } catch (err) {
      console.error("Failed to fetch order history:", err);
      alert(`Failed to fetch history: ${err.response?.data?.error || err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const cancelOrder = async (order) => {
    if (!confirm(`Are you sure you want to cancel order ${order.orderId}?`)) {
      return;
    }

    setCancellingOrder(order.orderId);
    try {
      const response = await axios.post("http://140.245.234.6:3001/api/orders/cancel", {
        orderId: order.orderId,
        tradingSymbol: order.tradingSymbol,
        exchange: order.exchange || "nse_cm"
      });
      
      if (response.data.success) {
        alert("Order cancelled successfully!");
        fetchOrderBook(); // Refresh orders
      } else {
        alert(`Failed to cancel: ${response.data.error}`);
      }
    } catch (err) {
      console.error("Cancel failed:", err);
      alert(`Failed to cancel: ${err.response?.data?.error || err.message}`);
    } finally {
      setCancellingOrder(null);
    }
  };

  const modifyOrder = async () => {
    if (!selectedOrder) return;

    try {
      const response = await axios.post("http://140.245.234.6:3001/api/orders/modify", {
        orderId: selectedOrder.orderId,
        tradingSymbol: selectedOrder.tradingSymbol,
        exchange: selectedOrder.exchange || "nse_cm",
        quantity: modifyData.quantity,
        price: modifyData.price,
        triggerPrice: modifyData.triggerPrice,
        orderType: modifyData.orderType,
        validity: modifyData.validity
      });
      
      if (response.data.success) {
        alert("Order modified successfully!");
        setShowModifyModal(false);
        fetchOrderBook(); // Refresh orders
      } else {
        alert(`Failed to modify: ${response.data.error}`);
      }
    } catch (err) {
      console.error("Modify failed:", err);
      alert(`Failed to modify: ${err.response?.data?.error || err.message}`);
    }
  };

  // Fetch data on mount and set up auto-refresh
  useEffect(() => {
    fetchOrderBook();
    fetchTradeBook();

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchOrderBook();
        fetchTradeBook();
      }, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('complete') || statusLower.includes('executed')) {
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    } else if (statusLower.includes('reject') || statusLower.includes('failed')) {
      return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    } else if (statusLower.includes('pending') || statusLower.includes('open')) {
      return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    } else if (statusLower.includes('after market')) {
      return <Clock className="w-3.5 h-3.5 text-purple-500" />;
    } else if (statusLower.includes('cancelled') || statusLower.includes('cancel')) {
      return <XCircle className="w-3.5 h-3.5 text-gray-500" />;
    } else {
      return <AlertCircle className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('complete') || statusLower.includes('executed')) {
      return "bg-green-50 text-green-600 border-green-200";
    } else if (statusLower.includes('reject') || statusLower.includes('failed')) {
      return "bg-red-50 text-red-600 border-red-200";
    } else if (statusLower.includes('pending') || statusLower.includes('open')) {
      return "bg-yellow-50 text-yellow-600 border-yellow-200";
    } else if (statusLower.includes('after market')) {
      return "bg-purple-50 text-purple-600 border-purple-200";
    } else if (statusLower.includes('cancelled') || statusLower.includes('cancel')) {
      return "bg-gray-50 text-gray-600 border-gray-200";
    } else {
      return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getFilteredOrders = () => {
    if (filter === "ALL") return orders;
    return orders.filter(order => {
      const statusLower = order.status?.toLowerCase() || '';
      if (filter === "OPEN" && (statusLower.includes('pending') || statusLower.includes('open'))) return true;
      if (filter === "COMPLETED" && statusLower.includes('complete')) return true;
      if (filter === "REJECTED" && statusLower.includes('reject')) return true;
      if (filter === "CANCELLED" && statusLower.includes('cancel')) return true;
      return false;
    });
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '--';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
    } catch {
      return dateTimeStr;
    }
  };

  const canCancel = (order) => {
    const statusLower = order.status?.toLowerCase() || '';
    return statusLower.includes('pending') || 
           statusLower.includes('open') || 
           statusLower.includes('after market');
  };

  const canModify = (order) => {
    const statusLower = order.status?.toLowerCase() || '';
    return statusLower.includes('pending') || 
           statusLower.includes('open') || 
           statusLower.includes('after market');
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
        <p className="text-sm text-red-600 mb-2">Failed to load orders</p>
        <p className="text-xs text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchOrderBook}
          className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === "orders"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Order Book ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("trades")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === "trades"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Trade Book ({trades.length})
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-[9px] px-2 py-1 rounded ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {autoRefresh ? 'Auto' : 'Manual'}
            </button>
            <button
              onClick={() => {
                fetchOrderBook();
                fetchTradeBook();
              }}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar - Only for Orders tab */}
        {activeTab === "orders" && (
          <div className="flex items-center space-x-2">
            <Filter className="w-3 h-3 text-gray-400" />
            <select 
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Orders</option>
              <option value="OPEN">Open/Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && activeTab === "orders" && filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : activeTab === "orders" ? (
          filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-xs">No orders found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white text-gray-400 text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Order ID</th>
                  <th className="text-left px-4 py-2 font-medium">Symbol</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-right px-4 py-2 font-medium">Qty</th>
                  <th className="text-right px-4 py-2 font-medium">Price</th>
                  <th className="text-right px-4 py-2 font-medium">Avg Price</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Time</th>
                  <th className="text-center px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="font-mono text-xs text-gray-600">{order.orderId}</div>
                      <div className="text-[9px] text-gray-400">{order.productType}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-800">{order.symbol}</div>
                      <div className="text-[9px] text-gray-400">{order.exchange}</div>
                    </td>
                    <td className={`px-4 py-2 font-medium ${
                      order.transactionType === "BUY" ? "text-green-600" : "text-red-600"
                    }`}>
                      {order.transactionType}
                      <div className="text-[9px] text-gray-400">{order.orderType}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800">
                      {order.quantity}
                      {order.filledQuantity > 0 && order.filledQuantity !== order.quantity && (
                        <div className="text-[9px] text-gray-400">
                          Filled: {order.filledQuantity}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      ₹{order.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {order.averagePrice > 0 ? `₹${order.averagePrice.toFixed(2)}` : '--'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.rejectionReason && (
                        <div className="text-[8px] text-red-400 mt-1 truncate max-w-[150px]" title={order.rejectionReason}>
                          {order.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-[10px]">
                      {formatDateTime(order.orderDateTime)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => fetchOrderHistory(order.orderId)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canModify(order) && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setModifyData({
                                quantity: order.quantity,
                                price: order.price.toString(),
                                triggerPrice: "",
                                orderType: order.orderType,
                                validity: order.validity
                              });
                              setShowModifyModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Modify Order"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canCancel(order) && (
                          <button
                            onClick={() => cancelOrder(order)}
                            disabled={cancellingOrder === order.orderId}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Cancel Order"
                          >
                            {cancellingOrder === order.orderId ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          // Trade Book Tab
          trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-xs">No trades found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white text-gray-400 text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Order ID</th>
                  <th className="text-left px-4 py-2 font-medium">Symbol</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-right px-4 py-2 font-medium">Qty</th>
                  <th className="text-right px-4 py-2 font-medium">Price</th>
                  <th className="text-left px-4 py-2 font-medium">Product</th>
                  <th className="text-left px-4 py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="font-mono text-xs text-gray-600">{trade.orderId}</div>
                      <div className="text-[9px] text-gray-400">Ex: {trade.exchangeOrderId}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-800">{trade.symbol}</div>
                      <div className="text-[9px] text-gray-400">{trade.exchange}</div>
                    </td>
                    <td className={`px-4 py-2 font-medium ${
                      trade.transactionType === "BUY" ? "text-green-600" : "text-red-600"
                    }`}>
                      {trade.transactionType}
                      <div className="text-[9px] text-gray-400">{trade.orderType}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800">
                      {trade.quantity}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      ₹{trade.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                        trade.productType === 'MIS' ? 'bg-purple-100 text-purple-700' :
                        trade.productType === 'CNC' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {trade.productType}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-[10px] text-gray-600">{trade.tradeTime}</div>
                      <div className="text-[8px] text-gray-400">{trade.tradeDate}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="p-2 border-t border-gray-100 bg-gray-50 text-[8px] text-gray-400 text-right">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Order History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Order History</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : orderHistory.length === 0 ? (
                <p className="text-center text-gray-400 py-4">No history found</p>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((entry, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        <span className="text-[9px] text-gray-400">{entry.filledDateTime}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-gray-400">Qty:</span>
                          <span className="ml-1 font-medium">{entry.quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Price:</span>
                          <span className="ml-1 font-medium">₹{entry.price.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Avg:</span>
                          <span className="ml-1 font-medium">₹{entry.averagePrice.toFixed(2)}</span>
                        </div>
                      </div>
                      {entry.rejectionReason && (
                        <div className="mt-2 text-[9px] text-red-500 bg-red-50 p-1.5 rounded">
                          {entry.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modify Order Modal */}
      {showModifyModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px]">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Modify Order</h3>
              <button
                onClick={() => setShowModifyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Order ID</label>
                <div className="text-sm font-mono text-gray-800 bg-gray-50 p-2 rounded">
                  {selectedOrder.orderId}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Symbol</label>
                <div className="text-sm font-medium text-gray-800">{selectedOrder.symbol}</div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  value={modifyData.quantity}
                  onChange={(e) => setModifyData({...modifyData, quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
                  min="1"
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={modifyData.price}
                  onChange={(e) => setModifyData({...modifyData, price: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
                  step="0.05"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Validity</label>
                <select
                  value={modifyData.validity}
                  onChange={(e) => setModifyData({...modifyData, validity: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="DAY">Day</option>
                  <option value="IOC">IOC</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={modifyOrder}
                  className="flex-1 bg-blue-600 text-white py-2 text-sm font-medium rounded hover:bg-blue-700"
                >
                  Modify Order
                </button>
                <button
                  onClick={() => setShowModifyModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}