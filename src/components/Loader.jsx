// src/components/Loader.jsx
const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
    <div className="w-12 h-12 border-4 border-gray-600 border-t-indigo-700 rounded-full animate-spin"></div>
    <p className="mt-4 text-gray-300 text-lg font-semibold">Cargando asignaciones</p>
  </div>
);

export default Loader;
