import { useState, useEffect } from "react";
import axios from "axios";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, AlertCircle, DollarSign, Shield } from "lucide-react";

export default function LimitsPanel() {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLimits = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://140.245.234.6:3001/api/limits", { seg: "ALL", exch: "ALL", prod: "ALL" });
      if (res.data.success) { setLimits(res.data.data); setLastUpdated(new Date()); }
      else setError(res.data.error);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLimits(); let interval; if (autoRefresh) interval = setInterval(fetchLimits, 30000); return () => clearInterval(interval); }, [autoRefresh]);

  const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(v) || 0);

  if (error) return <div className="bg-[#252540] p-2 rounded text-center text-rose-400 text-xs">Error loading limits</div>;

  return (
    <div className="bg-[#1a1a2e] rounded-lg border border-[#2a2a3e] overflow-hidden">
      <div className="px-3 py-2 border-b border-[#2a2a3e] bg-[#16162a] flex justify-between items-center">
        <div className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 text-gray-400" /><span className="text-[9px] font-semibold text-gray-400">LIMITS</span></div>
        <div className="flex gap-1"><button onClick={() => setAutoRefresh(!autoRefresh)} className={`text-[8px] px-1 rounded ${autoRefresh ? 'bg-emerald-900/50 text-emerald-400' : 'bg-[#252540] text-gray-400'}`}>Auto</button><button onClick={fetchLimits}><RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''} text-gray-400`} /></button></div>
      </div>
      {loading && !limits ? <div className="p-4 text-center"><div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0f3460] border-t-transparent mx-auto"></div></div> : limits ? (
        <div className="p-3 space-y-2">
          <div className="bg-[#252540] p-2 rounded">
            <div className="text-[8px] text-gray-400">Net Available</div>
            <div className="text-lg font-bold text-white">{formatCurrency(limits.netAvailable)}</div>
            <div className="flex justify-between text-[9px] mt-1"><span className="text-gray-400">Margin Used</span><span className="text-gray-200">{formatCurrency(limits.marginUsed)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            <div className="bg-[#252540] p-1 rounded"><span className="text-gray-400">Collateral</span><div className="text-white">{formatCurrency(limits.collateralValue)}</div></div>
            <div className="bg-[#252540] p-1 rounded"><span className="text-gray-400">Board Lot</span><div className="text-white">{formatCurrency(limits.boardLotLimit)}</div></div>
          </div>
          <div>
            <div className="text-[8px] text-gray-400 mb-1">Margins</div>
            <div className="space-y-1 text-[9px]"><div className="flex justify-between"><span>SPAN</span><span>{formatCurrency(limits.spanMargin)}</span></div><div className="flex justify-between"><span>Exposure</span><span>{formatCurrency(limits.exposureMargin)}</span></div><div className="flex justify-between"><span>VAR</span><span>{formatCurrency(limits.varMargin)}</span></div></div>
          </div>
          <div className="border-t border-[#2a2a3e] pt-1 text-[8px] text-gray-500 flex justify-between"><span>P&L Unrealized</span><span className={parseFloat(limits.unrealizedMTOM) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(limits.unrealizedMTOM)}</span></div>
          {lastUpdated && <div className="text-[7px] text-gray-500 text-right">{lastUpdated.toLocaleTimeString()}</div>}
        </div>
      ) : <div className="p-2 text-center text-gray-500 text-xs">No data</div>}
    </div>
  );
}