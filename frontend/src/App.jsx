import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Login from "./pages/login/index.jsx";

function isLoginPage() {
  return window.location.hash === "#login";
}

export default function App() {
  const [showLogin, setShowLogin] = useState(isLoginPage);

  useEffect(() => {
    function updatePage() {
      setShowLogin(isLoginPage());
    }

    window.addEventListener("hashchange", updatePage);
    return () => window.removeEventListener("hashchange", updatePage);
  }, []);

  return showLogin ? <Login /> : <Home />;
}
