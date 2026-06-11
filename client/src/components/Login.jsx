import { useState } from "react";
import axios from "axios";

export default function Login({ onSuccess }) {
  const [mobile, setMobile] = useState("918086515301");
  const [ucc, setUcc] = useState("X9YOZ");
  const [totp, setTotp] = useState("");
  const [mpin, setMpin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (step === 1) {
        await axios.post("http://140.245.234.6:3001/auth/login", { mobile, ucc, totp });
        setStep(2);
      } else {
        await axios.post("http://140.245.234.6:3001/auth/validate", { mpin: mpin.toString() });
        if (onSuccess) onSuccess();
        else window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-md">
        {/* Header matching the clean light theme */}
        <div className="px-8 py-6 text-center border-b border-gray-100">
           <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
             <span className="text-[#22c55e]">///</span> NeoTrade
           </h1>
        </div>

        <form onSubmit={login} className="p-8">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Mobile Number</label>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:bg-white text-gray-800 transition-colors" placeholder="+91..." required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">UCC Code</label>
                <input type="text" value={ucc} onChange={e => setUcc(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:bg-white text-gray-800 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">TOTP</label>
                <input type="text" value={totp} onChange={e => setTotp(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:bg-white text-gray-800 transition-colors text-center tracking-widest text-lg" maxLength="6" required autoFocus />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Enter MPIN</label>
                <input type="password" value={mpin} onChange={e => setMpin(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:bg-white text-gray-800 transition-colors text-center tracking-widest text-lg" maxLength="6" required autoFocus />
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full mt-6 py-3 px-4 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? "Processing..." : (step === 1 ? "Verify TOTP" : "Complete Login")}
          </button>

          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-800">
              Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
