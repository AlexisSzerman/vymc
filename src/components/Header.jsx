import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { LogIn, LogOut, LayoutDashboard } from "lucide-react";

const Header = ({ setCurrentPage }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setIsAuthenticated(true);
        setUserEmail(user.email);
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`w-full bg-gray-100 dark:bg-gray-800 p-3 flex items-center justify-between border-b border-gray-300 dark:border-gray-700 transition-shadow duration-300 ${
        scrolled ? "shadow-lg" : "shadow-none"
      }`}
    >
      <h1
        onClick={() => setCurrentPage("public")}
        className="text-lg font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer flex items-center gap-2"
      >
        <LayoutDashboard className="w-5 h-5" />
        Gestor Reunion Vida y Ministerio Cristianos
      </h1>

      <div className="flex items-center gap-2">
        {isAuthenticated && (
          <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline truncate max-w-xs">
            {userEmail}
          </span>
        )}

        {isAuthenticated ? (
          <button
            onClick={() => {
              const auth = getAuth();
              signOut(auth).then(() => setCurrentPage("login"));
            }}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded transition text-sm flex-nowrap"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">Cerrar Sesión</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentPage("login")}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition text-sm flex-nowrap"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden xs:inline">Iniciar Sesión</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

