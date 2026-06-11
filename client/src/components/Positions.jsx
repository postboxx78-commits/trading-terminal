import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

export default function Positions({ ltpData }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [squareOffLoading, setSquareOffLoading] = useState(null);

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://140.245.234.6:3001/api/positions", { timeout: 10000 });
      if (response.data.success) {
        const updated = response.data.data.map(pos => {
          const ltp = ltpData[pos.tradingSymbol]?.price || pos.lastPrice || 0;
          let pnl = 0, pnlPercent = 0;
          if (pos.positionType === "LONG") {
            pnl = (ltp - pos.averageBuyPrice) * Math.abs(pos.quantity);
            pnlPercent = pos.averageBuyPrice ? ((ltp - pos.averageBuyPrice) / pos.averageBuyPrice) * 100 : 0;
          } else if (pos.positionType === "SHORT") {
            pnl = (pos.averageSellPrice - ltp) * Math.abs(pos.quantity);
            pnlPercent = pos.averageSellPrice ? ((pos.averageSellPrice - ltp) / pos.averageSellPrice) * 100 : 0;
          }
          return { ...pos, lastPrice: ltp, pnl, pnlPercentage: pnlPercent };
        });
        setPositions(updated);
        setLastUpdated(new Date());
      } else {
        setError(response.data.error || "Failed to fetch positions");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    let interval;
    if (autoRefresh) interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (Object.keys(ltpData).length && positions.length) {
      setPositions(prev => prev.map(pos => {
        const ltp = ltpData[pos.tradingSymbol]?.price || pos.lastPrice;
        if (!ltp) return pos;
        let pnl = 0, pnlPercent = 0;
        if (pos.positionType === "LONG") {
          pnl = (ltp - pos.averageBuyPrice) * Math.abs(pos.quantity);
          pnlPercent = pos.averageBuyPrice ? ((ltp - pos.averageBuyPrice) / pos.averageBuyPrice) * 100 : 0;
        } else if (pos.positionType === "SHORT") {
          pnl = (pos.averageSellPrice - ltp) * Math.abs(pos.quantity);
          pnlPercent = pos.averageSellPrice ? ((pos.averageSellPrice - ltp) / pos.averageSellPrice) * 100 : 0;
        }
        return { ...pos, lastPrice: ltp, pnl, pnlPercentage: pnlPercent };
      }));
    }
  }, [ltpData]);

  const squareOff = async (pos) => {
    setSquareOffLoading(pos.tradingSymbol);
    try {
      const res = await axios.post("http://140.245.234.6:3001/api/positions/squareoff", {
        tradingSymbol: pos.tradingSymbol,
        exchange: pos.exchange,
        productType: pos.product,
        quantity: Math.abs(pos.quantity),
        positionType: pos.positionType
      });
      if (res.data.success) {
        setPositions(prev => prev.filter(p => p.tradingSymbol !== pos.tradingSymbol));
        alert("Position squared off");
      } else alert("Failed: " + res.data.error);
    } catch (err) {
      alert("Error squaring off");
    } finally {
      setSquareOffLoading(null);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "₹0.00";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
  };

  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalInvestment = positions.reduce((acc, p) => acc + (p.positionType === "LONG" ? p.averageBuyPrice * Math.abs(p.quantity) : 0), 0);

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 text-[#FF4D4D] mx-auto mb-2" />
        <p className="text-xs text-[#FF4D4D]">{error}</p>
        <button onClick={fetchPositions} className="mt-2 text-xs text-gray-400">Retry</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#13151A]">
      <div className="px-3 py-2 border-b border-[#2C2F36] bg-[#111217] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-400">Positions</h3>
          <span className="text-[9px] text-gray-500 bg-[#1A1C23] px-1.5 py-0.5 rounded">{positions.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`text-[9px] px-1.5 py-0.5 rounded ${autoRefresh ? 'bg-[#00D09C]/20 text-[#00D09C]' : 'bg-[#1A1C23] text-gray-400'}`}>
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>
          <button onClick={fetchPositions} disabled={loading} className="text-gray-400 hover:text-gray-200">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && !positions.length ? (
          <div className="flex justify-center p-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#3B82F6] border-t-transparent" /></div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center p-6 text-gray-500"><Minus className="w-8 h-8 mb-2" /><p className="text-xs">No open positions</p></div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#13151A] text-gray-400">
              <tr>
                <th className="text-left p-2 font-medium">Symbol</th>
                <th className="text-right p-2 font-medium">Qty</th>
                <th className="text-right p-2 font-medium">Avg</th>
                <th className="text-right p-2 font-medium">LTP</th>
                <th className="text-right p-2 font-medium">P&L</th>
                <th className="text-right p-2"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map(pos => (
                <tr key={pos.tradingSymbol} className="border-t border-[#2C2F36] hover:bg-[#1A1C23]">
                  <td className="p-2">
                    <div className="font-medium text-gray-200">{pos.symbol}</div>
                    <div className="text-[9px] text-gray-500">{pos.product} • {pos.exchange}</div>
                  </td>
                  <td className={`p-2 text-right font-medium ${pos.quantity > 0 ? 'text-[#00D09C]' : 'text-[#FF4D4D]'}`}>{pos.quantity}</td>
                  <td className="p-2 text-right text-gray-300">{formatCurrency(pos.positionType === "LONG" ? pos.averageBuyPrice : pos.averageSellPrice)}</td>
                  <td className="p-2 text-right font-medium text-gray-200">{formatCurrency(pos.lastPrice)}</td>
                  <td className={`p-2 text-right font-medium ${pos.pnl >= 0 ? 'text-[#00D09C]' : 'text-[#FF4D4D]'}`}>
                    {pos.pnl >= 0 ? <ArrowUpRight className="w-3 h-3 inline mr-1" /> : <ArrowDownRight className="w-3 h-3 inline mr-1" />}
                    {formatCurrency(Math.abs(pos.pnl))}
                    <div className="text-[9px]">{pos.pnlPercentage > 0 ? '+' : ''}{pos.pnlPercentage.toFixed(1)}%</div>
                  </td>
                  <td className="p-2 text-right">
                    <button onClick={() => squareOff(pos)} disabled={squareOffLoading === pos.tradingSymbol} className="text-[9px] px-2 py-0.5 rounded bg-[#FF4D4D]/20 text-[#FF4D4D] hover:bg-[#FF4D4D]/30">
                      {squareOffLoading === pos.tradingSymbol ? <Clock className="w-2.5 h-2.5 animate-spin" /> : 'Square'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {positions.length > 0 && (
        <div className="p-2 border-t border-[#2C2F36] bg-[#111217] text-[9px]">
          <div className="flex justify-between"><span className="text-gray-400">Investment:</span><span className="font-medium">{formatCurrency(totalInvestment)}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-400">Total P&L:</span><span className={`font-medium ${totalPnl >= 0 ? 'text-[#00D09C]' : 'text-[#FF4D4D]'}`}>{formatCurrency(totalPnl)}</span></div>
          {lastUpdated && <div className="text-right text-gray-500 mt-1">Updated: {lastUpdated.toLocaleTimeString()}</div>}
        </div>
      )}
    </div>
  );
}