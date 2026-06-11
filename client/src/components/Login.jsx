import { useState } from "react";
import axios from "axios";
import { Shield, Smartphone, Key, Lock } from "lucide-react";

export default function Login({ onSuccess }) {
  const [mobile, setMobile] = useState("");
  const [ucc, setUcc] = useState("");
  const [totp, setTotp] = useState("");
  const [mpin, setMpin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: credentials, 2: mpin

  const login = async () => {
    setIsLoading(true);
    try {
      if (step === 1) {
        await axios.post("http://140.245.234.6:3001/auth/login", {
          mobile,
          ucc,
          totp
        });
        setStep(2);
      } else {
        await axios.post("http://140.245.234.6:3001/auth/validate",{ mpin: mpin.toString() });
        onSuccess();
      }
    } catch (error) {
      alert("Login failed. Please check your credentials.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Trading Terminal</h1>
          <p className="text-gray-400">Kotak Neo Trading Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step Indicator */}
          <div className="flex border-b border-gray-200">
            <div className={`flex-1 py-3 text-center text-sm font-medium ${
              step === 1 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500'
            }`}>
              Step 1: Credentials
            </div>
            <div className={`flex-1 py-3 text-center text-sm font-medium ${
              step === 2 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500'
            }`}>
              Step 2: Verification
            </div>
          </div>

          <div className="p-6">
            {step === 1 ? (
              // Step 1: Credentials
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UCC (Client ID)
                  </label>
                  <input
                    placeholder="Enter your UCC"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={ucc}
                    onChange={(e) => setUcc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TOTP (Time-based OTP)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      placeholder="Enter 6-digit TOTP"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={totp}
                      onChange={(e) => setTotp(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Step 2: MPIN
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-700">
                    Please enter your MPIN to complete the login process.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MPIN
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Enter your MPIN"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={mpin}
                      onChange={(e) => setMpin(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={login}
                disabled={isLoading}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg font-semibold transition-all ${
                  isLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:bg-blue-700 shadow-lg shadow-blue-200'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : step === 1 ? 'Continue to Verification' : 'Login to Terminal'}
              </button>

              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>

            {/* Security Note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                <span className="inline-flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Your credentials are securely encrypted
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-gray-500">
          © 2024 Trading Terminal. All rights reserved.
        </p>
      </div>
    </div>
  );
}