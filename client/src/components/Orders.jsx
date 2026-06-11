import React from "react";

export default function Orders() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h3 className="text-sm font-bold text-gray-800 tracking-tight">Order Book</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 font-semibold tracking-wider">
            <tr>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Instrument</th>
              <th className="px-5 py-3 text-right">Qty</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 text-gray-500 font-medium">14:32:01</td>
              <td className="px-5 py-4 font-bold text-red-500">SELL</td>
              <td className="px-5 py-4 font-bold text-gray-900">RELIANCE</td>
              <td className="px-5 py-4 text-right text-gray-600 font-medium">100</td>
              <td className="px-5 py-4 text-right text-gray-600 font-medium">2850.15</td>
              <td className="px-5 py-4 text-right font-bold text-[#22c55e]">COMPLETE</td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 text-gray-500 font-medium">14:30:15</td>
              <td className="px-5 py-4 font-bold text-[#22c55e]">BUY</td>
              <td className="px-5 py-4 font-bold text-gray-900">NIFTY 22000 CE</td>
              <td className="px-5 py-4 text-right text-gray-600 font-medium">50</td>
              <td className="px-5 py-4 text-right text-gray-600 font-medium">125.50</td>
              <td className="px-5 py-4 text-right font-bold text-[#22c55e]">COMPLETE</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
