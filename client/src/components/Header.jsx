// Header.jsx - Enhanced with modern design and live indicators
export default function Header() {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-3 flex items-center shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-xl font-bold animate-pulse">📈</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Trading Terminal
          </h1>
          <p className="text-[9px] text-gray-400">Powered by Kotak Neo</p>
        </div>
      </div>
      
      <div className="ml-auto flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-300 font-medium">Market Status:</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full relative"></div>
            </div>
            <span className="text-xs text-green-400 font-semibold tracking-wide">OPEN</span>
          </div>
        </div>
        
        <div className="h-6 w-px bg-gray-700"></div>
        
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-md">
            <span className="text-sm font-medium">👤</span>
          </div>
          <div className="text-sm font-medium text-gray-200">Demo Account</div>
        </div>
      </div>
    </div>
  );
}