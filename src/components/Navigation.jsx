import React, { useState } from "react";
import {
  Users,
  ClipboardList,
  ArrowDownFromLine,
  Globe,
  History,
  RefreshCcw,
  Bell,
  ChartSpline,
  Menu,
  X
} from "lucide-react";

const Navigation = ({ currentPage, setCurrentPage, authUser, isAuthorized }) => {
  const [isOpen, setIsOpen] = useState(false);

  const publicNavItems = [
    { key: "public", label: "Vista Pública", icon: Globe },
    { key: "export", label: "Exportar Asignaciones", icon: ArrowDownFromLine },
  ];

  const privateNavItems = [
    { key: "dashboard", label: "Estadísticas", icon: ChartSpline },
    { key: "participants", label: "Participantes", icon: Users },
    { key: "assignments", label: "Asignaciones", icon: ClipboardList },
    { key: "reminders", label: "Recordatorios", icon: Bell },
    { key: "replacements", label: "Reemplazos", icon: RefreshCcw },
    { key: "history", label: "Historial", icon: History },
  ];

  return (
    <>
      {/* Botón Hamburguesa (solo en móviles) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-indigo-600 text-white"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 shadow-xl
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0 sm:relative sm:flex sm:flex-col
        `}
      >
        <h2 className="text-lg font-semibold mb-6 text-right sm:text-left">Navegación</h2>
        <nav className="flex flex-col space-y-1">
          {publicNavItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setCurrentPage(key);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                currentPage === key
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-indigo-100 dark:hover:bg-gray-800"
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              {label}
            </button>
          ))}

          {authUser && isAuthorized &&
            privateNavItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setCurrentPage(key);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  currentPage === key
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-indigo-100 dark:hover:bg-gray-800"
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                {label}
              </button>
            ))}
        </nav>
      </aside>
    </>
  );
};

export default Navigation;
