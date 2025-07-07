import {
  Users,
  ClipboardList,
  ArrowDownFromLine,
  History,
  RefreshCcw,
  Bell,
  ChartSpline
} from "lucide-react";

const Navigation = ({
  currentPage,
  setCurrentPage,
  authUser,
  isAuthorized,
  isOpen,
  setIsOpen
}) => {
  const publicNavItems = [
    {
      key: "public",
      label: "Programa Semanal",
      icon: <span className="jw-icon jw-icon-194 text-2xl leading-none" />
    },
    {
      key: "export",
      label: "Exportar Asignaciones",
      icon: <ArrowDownFromLine className="w-5 h-5" />
    },
  ];

  const privateNavItems = [
    {
      key: "dashboard",
      label: "Estadísticas",
      icon: <ChartSpline className="w-5 h-5" />
    },
    {
      key: "participants",
      label: "Participantes",
      icon: <Users className="w-5 h-5" />
    },
    {
      key: "assignments",
      label: "Asignaciones",
      icon: <ClipboardList className="w-5 h-5" />
    },
    {
      key: "reminders",
      label: "Recordatorios",
      icon: <Bell className="w-5 h-5" />
    },
    {
      key: "replacements",
      label: "Reemplazos",
      icon: <RefreshCcw className="w-5 h-5" />
    },
    {
      key: "history",
      label: "Historial",
      icon: <History className="w-5 h-5" />
    },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 shadow-xl
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0 sm:relative sm:flex sm:flex-col
        `}
      >
        <h2 className="text-lg font-semibold mb-6 text-right sm:text-left">
          Navegación
        </h2>
        <nav className="flex flex-col space-y-1">
          {publicNavItems.map(({ key, label, icon }) => (
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
              {icon}
              {label}
            </button>
          ))}

          {authUser &&
            isAuthorized &&
            privateNavItems.map(({ key, label, icon }) => (
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
                {icon}
                {label}
              </button>
            ))}
        </nav>
      </aside>
    </>
  );
};

export default Navigation;
