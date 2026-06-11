import React from "react";

export default function LimitsPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h3 className="text-sm font-bold text-gray-800 tracking-tight">Trading Limits</h3>
      </div>

      <div className="p-5">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-400 uppercase font-semibold tracking-wider border-b border-gray-100">
            <tr>
              <th className="text-left pb-3">Particulars</th>
              <th className="text-right pb-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 text-gray-600 font-medium">Cash Balance</td>
              <td className="py-3 text-right font-bold text-gray-900">1,45,230.50</td>
            </tr>
            <tr>
              <td className="py-3 text-gray-600 font-medium">Collateral Value</td>
              <td className="py-3 text-right font-medium text-gray-600">0.00</td>
            </tr>
            <tr>
              <td className="py-3 text-gray-600 font-medium">Utilized Margin</td>
              <td className="py-3 text-right font-bold text-red-500">22,100.00</td>
            </tr>
            <tr>
              <td className="py-3 text-gray-600 font-medium">Available Limit</td>
              <td className="py-3 text-right font-bold text-[#22c55e] text-lg">1,23,130.50</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
