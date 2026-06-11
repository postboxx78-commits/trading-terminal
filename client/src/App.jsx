import { useState } from "react";
import "./index.css";
import Login from "./components/Login";
import Terminal from "./components/Terminal";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="h-screen bg-gray-50">
      {!isLoggedIn ? (
        <Login onSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <Terminal />
      )}
    </div>
  );
}