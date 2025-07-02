import {
  Users,
  ClipboardList,
  ArrowDownFromLine,
  Globe,
  History,
  RefreshCcw,
  Bell,
  ChartSpline
} from "lucide-react";

const Navigation = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { key: "public", label: "Vista Pública", icon: Globe },
    { key: "participants", label: "Participantes", icon: Users },
    { key: "assignments", label: "Asignaciones", icon: ClipboardList },
    { key: "reminders", label: "Recordatorios", icon: Bell },
    { key: "replacements", label: "Reemplazos", icon: RefreshCcw },
    { key: "history", label: "Historial", icon: History },
    { key: "dashboard", label: "Estadísticas", icon: ChartSpline },
    { key: "export", label: "Exportar Asignaciones", icon: ArrowDownFromLine },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen p-4 shadow-xl">
      <h2 className="text-lg font-semibold mb-6">Menú</h2>
      <nav className="flex flex-col space-y-1">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setCurrentPage(key)}
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
  );
};

export default Navigation;


