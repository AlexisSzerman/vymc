import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { LogIn, LogOut, LayoutDashboard } from "lucide-react";

const Header = ({ setCurrentPage }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

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

  return (
    <header className="w-full bg-gray-100 dark:bg-gray-800 p-3 flex items-center justify-between border-b border-gray-300 dark:border-gray-700 shadow">
      <h1
        onClick={() => setCurrentPage("public")}
        className="text-lg font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer flex items-center gap-2"
      >
        <LayoutDashboard className="w-5 h-5" />
        Gestor Reunion Vida y Ministerio Cristianos
      </h1>

      <div className="flex items-center gap-2">
        {isAuthenticated && (
          <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
            {userEmail}
          </span>
        )}

        {isAuthenticated ? (
          <button
            onClick={() => {
              const auth = getAuth();
              signOut(auth).then(() => setCurrentPage("login"));
            }}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        ) : (
          <button
            onClick={() => setCurrentPage("login")}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition text-sm"
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
