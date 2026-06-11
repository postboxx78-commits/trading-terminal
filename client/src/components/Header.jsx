export default function Header() {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-xl font-bold">📈</span>
        </div>
        <h1 className="text-xl font-semibold tracking-wide">Trading Terminal</h1>
      </div>
      
      <div className="ml-auto flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-300">Market Status:</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400 font-medium">OPEN</span>
          </div>
        </div>
        
        <div className="h-6 w-px bg-gray-700"></div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm">👤</span>
          </div>
          <span className="text-sm text-gray-300">Demo Account</span>
        </div>
      </div>
    </div>
  );
}