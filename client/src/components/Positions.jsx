import React from "react";

export default function Positions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
        <h3 className="text-sm font-bold text-gray-800 tracking-tight">Open Positions</h3>
        <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md">2 Active</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 font-semibold tracking-wider">
            <tr>
              <th className="px-5 py-3">Instrument</th>
              <th className="px-5 py-3 text-right">Qty</th>
              <th className="px-5 py-3 text-right">LTP</th>
              <th className="px-5 py-3 text-right">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 font-bold text-gray-900">NIFTY 22000 CE</td>
              <td className="px-5 py-4 text-right font-medium text-[#22c55e]">50</td>
              <td className="px-5 py-4 text-right font-medium text-gray-600">130.15</td>
              <td className="px-5 py-4 text-right font-bold text-[#22c55e]">+232.50</td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 font-bold text-gray-900">RELIANCE</td>
              <td className="px-5 py-4 text-right font-medium text-red-500">-100</td>
              <td className="px-5 py-4 text-right font-medium text-gray-600">2855.00</td>
              <td className="px-5 py-4 text-right font-bold text-red-500">-485.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
