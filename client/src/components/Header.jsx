import { Menu } from "lucide-react";

export default function Header({ onMenuClick }) {
  return (
    <div className="bg-[#12121f] text-white px-3 py-2 flex items-center border-b border-[#2a2a3e]">
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-2 text-gray-300 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-[#0f3460] rounded flex items-center justify-center">
          <span className="text-sm">📈</span>
        </div>
        <h1 className="text-base font-semibold tracking-tight">Trading Terminal</h1>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-300 font-medium">LIVE</span>
        </div>
        <div className="w-6 h-6 bg-[#252540] rounded-full flex items-center justify-center">
          <span className="text-[11px]">👤</span>
        </div>
      </div>
    </div>
  );
}