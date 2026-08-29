import { useState, useEffect } from "react";
import axios from "axios";
import { Terminal, Play, Activity, CheckCircle, Clock } from "lucide-react";

export default function AlgoPanel() {
  const [prompt, setPrompt] = useState("");
  const [qty, setQty] = useState(1);
  const [rules, setRules] = useState([]);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await axios.get("http://140.245.234.6:3001/api/algo/rules");
      if (res.data.success) setRules(res.data.data);
    } catch (err) {
      console.error("Failed to fetch rules");
    }
  };

  useEffect(() => {
    fetchRules();
    const interval = setInterval(fetchRules, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsSubmitting(true);
    setStatus(null);
    
    try {
      const res = await axios.post("http://140.245.234.6:3001/api/algo/prompt", {
        prompt,
        qty: parseInt(qty)
      });
      if (res.data.success) {
        setStatus({ type: "success", msg: "Algo rule activated!" });
        setPrompt("");
        fetchRules();
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.error || "Failed to parse prompt" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Prompt Input Section */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Terminal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., enter on reliance a close above 2950"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-20 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none"
            min="1"
            title="Quantity"
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" /> Execute
          </button>
        </form>
        {status && (
          <div className={`mt-2 text-[10px] px-2 py-1 rounded ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.msg}
          </div>
        )}
      </div>

      {/* Active Rules Table */}
      <div className="flex-1 overflow-auto">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No active algo rules</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white text-gray-400 border-b border-gray-100">
              <tr>
                <th className="text-left p-2 font-medium">Symbol</th>
                <th className="text-left p-2 font-medium">Condition</th>
                <th className="text-right p-2 font-medium">Qty</th>
                <th className="text-left p-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-2 font-bold text-gray-800">{rule.symbol}</td>
                  <td className="p-2 font-mono text-[10px] text-gray-600">
                    <span className={rule.action === 'B' ? 'text-green-600' : 'text-red-600'}>
                      {rule.action === 'B' ? 'BUY' : 'SELL'}
                    </span>
                    {` IF LTP ${rule.operator === 'above' ? '>' : '<'} ₹${rule.targetPrice}`}
                  </td>
                  <td className="p-2 text-right">{rule.qty}</td>
                  <td className="p-2">
                    {rule.active ? (
                      <span className="flex items-center gap-1 text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-max">
                        <Clock className="w-3 h-3 animate-pulse" /> WAITING
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded w-max">
                        <CheckCircle className="w-3 h-3" /> FIRED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}