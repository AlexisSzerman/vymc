// src/components/Navigation.jsx
const Navigation = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { key: 'participants', label: 'Participantes' },
    { key: 'assignments', label: 'Asignaciones' },
    { key: 'public', label: 'Vista Pública' },
    { key: 'history', label: 'Historial' },
    { key: 'replacements', label: 'Reemplazos' },
  ];

  return (
    <nav className="flex justify-center bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-full shadow-lg mb-8 mx-auto max-w-xl">
      {navItems.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setCurrentPage(key)}
          className={`px-5 py-2 sm:px-6 sm:py-3 mx-2 rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 ${
            currentPage === key
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
