// LimitsPanel.jsx - Component to display account limits and margins
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  AlertCircle,
  DollarSign,
  Shield,
  BarChart3,
  Percent
} from "lucide-react";

export default function LimitsPanel() {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLimits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post("http://140.245.234.6:3001/api/limits", {
        seg: "ALL",
        exch: "ALL",
        prod: "ALL"
      });

      if (response.data.success) {
        setLimits(response.data.data);
        setLastUpdated(new Date());
      } else {
        setError(response.data.error || "Failed to fetch limits");
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch limits");
    } finally {
      setLoading(false);
    }
  };

  // Fetch limits on mount and set up auto-refresh
  useEffect(() => {
    fetchLimits();

    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLimits, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

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

  const formatNumber = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Error loading limits</span>
        </div>
        <p className="text-xs text-red-500">{error}</p>
        <button
          onClick={fetchLimits}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Account Limits
          </h3>
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
            onClick={fetchLimits}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !limits ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-xs text-gray-400 mt-2">Loading limits...</p>
        </div>
      ) : limits ? (
        <div className="p-4">
          {/* Main Balance */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Net Available</span>
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-gray-800">
              {formatCurrency(limits.netAvailable)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px]">
              <span className="text-gray-500">Margin Used</span>
              <span className="font-medium text-gray-700">{formatCurrency(limits.marginUsed)}</span>
            </div>
          </div>

          {/* Collateral & Limits */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-[9px] text-gray-500 block">Collateral</span>
              <span className="text-xs font-medium text-gray-800">
                {formatCurrency(limits.collateralValue)}
              </span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-[9px] text-gray-500 block">Board Lot Limit</span>
              <span className="text-xs font-medium text-gray-800">
                {formatCurrency(limits.boardLotLimit)}
              </span>
            </div>
          </div>

          {/* Margin Breakdown */}
          <div className="mb-4">
            <div className="flex items-center space-x-1 mb-2">
              <Shield className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                Margin Details
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">SPAN Margin</span>
                <span className="font-medium text-gray-700">{formatCurrency(limits.spanMargin)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Exposure Margin</span>
                <span className="font-medium text-gray-700">{formatCurrency(limits.exposureMargin)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">VAR Margin</span>
                <span className="font-medium text-gray-700">{formatCurrency(limits.varMargin)}</span>
              </div>
              {parseFloat(limits.specialMargin) > 0 && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Special Margin</span>
                  <span className="font-medium text-amber-600">{formatCurrency(limits.specialMargin)}</span>
                </div>
              )}
              {parseFloat(limits.premiumMargin) > 0 && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Premium Margin</span>
                  <span className="font-medium text-purple-600">{formatCurrency(limits.premiumMargin)}</span>
                </div>
              )}
            </div>
          </div>

          {/* P&L Section */}
          <div className="mb-3">
            <div className="flex items-center space-x-1 mb-2">
              <BarChart3 className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                Profit & Loss
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Unrealized MTOM</span>
                <div className="flex items-center space-x-1">
                  {parseFloat(limits.unrealizedMTOM) >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    parseFloat(limits.unrealizedMTOM) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(limits.unrealizedMTOM)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Realized MTOM</span>
                <div className="flex items-center space-x-1">
                  {parseFloat(limits.realizedMTOM) >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    parseFloat(limits.realizedMTOM) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(limits.realizedMTOM)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-center justify-between text-[8px] text-gray-400">
              <span>Account: {limits.accountId || 'N/A'}</span>
              <span>Category: {limits.category || 'N/A'}</span>
            </div>
            {lastUpdated && (
              <div className="text-[8px] text-gray-300 text-right mt-1">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          <p className="text-xs">No limits data available</p>
        </div>
      )}
    </div>
  );
}