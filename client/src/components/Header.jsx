import { Menu } from "lucide-react";

export default function Header({ onMenuClick }) {
  return (
    <div className="bg-white text-gray-800 px-3 py-2 flex items-center border-b border-gray-200 shadow-sm">
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-2 text-gray-500 hover:text-gray-700"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <span className="text-sm">📈</span>
        </div>
        <h1 className="text-base font-semibold tracking-tight">Trading Terminal</h1>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-500 font-medium">LIVE</span>
        </div>
        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
          <span className="text-[11px]">👤</span>
        </div>
      </div>
    </div>
  );
}