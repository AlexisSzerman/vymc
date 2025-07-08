//components/AssignmentFilters.jsx


const AssignmentFilters = ({
  filterDate,
  setFilterDate,
  filterName,
  setFilterName,
  clearFilters,
}) => {
  return (
    <div className="flex flex-col gap-4 items-center sm:flex-row">
      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        className="p-2 rounded bg-gray-600 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 max-w-xs"
      />
      <input
        type="text"
        value={filterName}
        onChange={(e) => setFilterName(e.target.value)}
        placeholder="Buscar por nombre"
        className="p-2 rounded bg-gray-600 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
      />
      <button
        onClick={clearFilters}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-900 text-white rounded transition"
      >
        Limpiar filtros
      </button>
    </div>
  );
};

export default AssignmentFilters;
