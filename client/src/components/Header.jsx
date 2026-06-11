import React from "react";
import { Menu, User, Settings, LogOut } from "lucide-react";

export default function Header({ onMenuClick }) {
  return (
    <div className="bg-white text-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#22c55e] text-white rounded flex items-center justify-center font-bold">
            ///
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-800">NeoTrade</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md border border-green-100">
          <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
          <span className="text-[10px] text-green-700 font-bold tracking-wider">LIVE</span>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-3 text-gray-400">
          <button className="hover:text-gray-800 transition-colors hidden sm:block">
            <Settings className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
          <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
            <User className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:block">Profile</span>
          </button>
          <button className="hover:text-red-500 transition-colors ml-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
