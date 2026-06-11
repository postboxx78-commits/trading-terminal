// Positions.jsx - Updated with better error handling
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Clock,
  Bug
} from "lucide-react";

export default function Positions({ ltpData }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [squareOffLoading, setSquareOffLoading] = useState(null);
  const [debugMode, setDebugMode] = useState(false);

const fetchPositions = async () => {
  setLoading(true);
  setError(null);
  setErrorDetails(null);
  
  try {
    console.log("📡 Fetching positions...");
    
    const response = await axios.get("http://140.245.234.6:3001/api/positions", {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log("📥 Positions response:", response.data);

    if (response.data.success) {
      // Update positions with latest LTP data
      const updatedPositions = response.data.data.map(pos => {
        const ltp = ltpData[pos.tradingSymbol]?.price || pos.lastPrice || 0;
        
        // Calculate P&L based on position type
        let pnl = 0;
        let pnlPercentage = 0;
        
        if (pos.positionType === "LONG") {
          pnl = (ltp - pos.averageBuyPrice) * Math.abs(pos.quantity);
          pnlPercentage = pos.averageBuyPrice > 0 
            ? ((ltp - pos.averageBuyPrice) / pos.averageBuyPrice) * 100 
            : 0;
        } else if (pos.positionType === "SHORT") {
          pnl = (pos.averageSellPrice - ltp) * Math.abs(pos.quantity);
          pnlPercentage = pos.averageSellPrice > 0 
            ? ((pos.averageSellPrice - ltp) / pos.averageSellPrice) * 100 
            : 0;
        }
        
        console.log(`Position ${pos.symbol}:`, {
          type: pos.positionType,
          qty: pos.quantity,
          avgBuy: pos.averageBuyPrice,
          avgSell: pos.averageSellPrice,
          ltp,
          pnl
        });
        
        return {
          ...pos,
          lastPrice: ltp,
          pnl: pnl,
          pnlPercentage: pnlPercentage
        };
      });
      
      console.log(`✅ Loaded ${updatedPositions.length} positions`);
      setPositions(updatedPositions);
      setLastUpdated(new Date());
    } else {
      console.error("❌ Failed to fetch positions:", response.data);
      setError(response.data.error || "Failed to fetch positions");
      setErrorDetails(response.data.details);
    }
  } catch (err) {
    console.error("❌ Failed to fetch positions:", err);
    
    // Log the complete error response
    if (err.response) {
      console.error("Error response data:", err.response.data);
      console.error("Error response status:", err.response.status);
      setError(err.response.data?.error || err.response.data?.message || "Failed to fetch positions");
      setErrorDetails(err.response.data);
    } else if (err.request) {
      console.error("No response received:", err.request);
      setError("No response from server");
    } else {
      console.error("Error setting up request:", err.message);
      setError(err.message);
    }
  } finally {
    setLoading(false);
  }
};

  // Fetch positions on mount and set up auto-refresh
  useEffect(() => {
    fetchPositions();

    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchPositions, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Update positions when LTP data changes
  useEffect(() => {
    if (Object.keys(ltpData).length > 0 && positions.length > 0) {
      setPositions(prevPositions => 
        prevPositions.map(pos => {
          const ltp = ltpData[pos.tradingSymbol]?.price || pos.lastPrice;
          if (!ltp) return pos;
          
          let pnl = 0;
          let pnlPercentage = 0;
          
          if (pos.positionType === "LONG") {
            pnl = (ltp - pos.averageBuyPrice) * Math.abs(pos.quantity);
            pnlPercentage = pos.averageBuyPrice > 0 
              ? ((ltp - pos.averageBuyPrice) / pos.averageBuyPrice) * 100 
              : 0;
          } else if (pos.positionType === "SHORT") {
            pnl = (pos.averageSellPrice - ltp) * Math.abs(pos.quantity);
            pnlPercentage = pos.averageSellPrice > 0 
              ? ((pos.averageSellPrice - ltp) / pos.averageSellPrice) * 100 
              : 0;
          }
          
          return {
            ...pos,
            lastPrice: ltp,
            pnl: pnl,
            pnlPercentage: pnlPercentage
          };
        })
      );
    }
  }, [ltpData]);

  const squareOffPosition = async (position) => {
    setSquareOffLoading(position.tradingSymbol);
    
    try {
      const response = await axios.post("http://140.245.234.6:3001/api/positions/squareoff", {
        tradingSymbol: position.tradingSymbol,
        exchange: position.exchange,
        productType: position.product,
        quantity: Math.abs(position.quantity),
        positionType: position.positionType
      });

      if (response.data.success) {
        setPositions(prev => prev.filter(p => p.tradingSymbol !== position.tradingSymbol));
        alert(`Position squared off successfully! Order ID: ${response.data.orderId}`);
      } else {
        alert(`Failed to square off: ${response.data.error}`);
      }
    } catch (err) {
      console.error("Square off failed:", err);
      alert(`Failed to square off: ${err.response?.data?.error || err.message}`);
    } finally {
      setSquareOffLoading(null);
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatNumber = (value, digits = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  // Calculate totals
  const totalPnl = positions.reduce((acc, pos) => acc + pos.pnl, 0);
  const totalInvestment = positions.reduce((acc, pos) => {
    if (pos.positionType === "LONG") {
      return acc + (pos.averageBuyPrice * Math.abs(pos.quantity));
    }
    return acc;
  }, 0);

  if (error) {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 text-red-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Error loading positions</span>
          </div>
          <p className="text-xs text-red-500 mb-3">{error}</p>
          
          {errorDetails && (
            <div className="mt-2">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Bug className="w-3 h-3" />
                <span>{debugMode ? 'Hide' : 'Show'} debug info</span>
              </button>
              
              {debugMode && (
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 text-[8px] rounded overflow-auto max-h-40">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={fetchPositions}
            className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
          <button
            onClick={() => {
              setError(null);
              setErrorDetails(null);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Open Positions
          </h3>
          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {positions.length} positions
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {totalPnl !== 0 && (
            <div className={`text-xs font-medium ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </div>
          )}
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
            onClick={fetchPositions}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Positions List */}
      <div className="flex-1 overflow-auto">
        {loading && positions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Minus className="w-8 h-8 mb-2" />
            <p className="text-xs">No open positions</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white text-gray-400 text-[10px] uppercase sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Symbol</th>
                <th className="text-right px-4 py-2 font-medium">Qty</th>
                <th className="text-right px-4 py-2 font-medium">Avg</th>
                <th className="text-right px-4 py-2 font-medium">LTP</th>
                <th className="text-right px-4 py-2 font-medium">P&L</th>
                <th className="text-right px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => {
                const isLong = pos.positionType === "LONG";
                const avgPrice = isLong ? pos.averageBuyPrice : pos.averageSellPrice;
                const pnlClass = pos.pnl >= 0 ? 'text-green-600' : 'text-red-600';
                
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{pos.symbol}</div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          pos.product === 'MIS' ? 'bg-purple-100 text-purple-700' :
                          pos.product === 'CNC' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {pos.product}
                        </span>
                        <span className="text-[8px] text-gray-400">{pos.exchange}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      pos.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {pos.quantity > 0 ? '+' : ''}{pos.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(avgPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {pos.lastPrice ? formatCurrency(pos.lastPrice) : '--'}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${pnlClass}`}>
                      <div className="flex items-center justify-end space-x-1">
                        {pos.pnl >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {formatCurrency(Math.abs(pos.pnl))}
                        </span>
                      </div>
                      {pos.pnlPercentage !== 0 && (
                        <div className={`text-[9px] ${pnlClass}`}>
                          ({pos.pnlPercentage > 0 ? '+' : ''}{formatNumber(pos.pnlPercentage, 1)}%)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pos.canSquareOff && (
                        <button 
                          onClick={() => squareOffPosition(pos)}
                          disabled={squareOffLoading === pos.tradingSymbol}
                          className={`text-[9px] px-2 py-1 rounded transition-colors ${
                            squareOffLoading === pos.tradingSymbol
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {squareOffLoading === pos.tradingSymbol ? (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5 animate-spin" />
                              <span>...</span>
                            </span>
                          ) : (
                            'Square Off'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer with Summary */}
      {positions.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Total Investment</span>
            <span className="font-medium text-gray-800">{formatCurrency(totalInvestment)}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-500">Total P&L</span>
            <span className={`font-medium ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </span>
          </div>
          {lastUpdated && (
            <div className="text-[8px] text-gray-400 text-right mt-2">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}