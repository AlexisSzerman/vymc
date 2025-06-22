import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { formatAssignmentType } from '../utils/helpers';

const appId = 'default-app-id'; // Cambiar por el ID real si aplica

const HistoryViewPage = ({ db, showMessage }) => {
  const [allAssignments, setAllAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    if (!db) return;

    const assignmentsColRef = collection(db, `artifacts/${appId}/public/data/assignments`);
    const unsubscribe = onSnapshot(assignmentsColRef, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllAssignments(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching historical assignments:", error);
      showMessage(`Error al cargar el historial de asignaciones: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, showMessage]);

  useEffect(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let filtered = allAssignments.filter(assignment => {
      const [year, month, day] = assignment.date.split('-').map(Number);
      const assignmentDate = new Date(year, month - 1, day);
      return assignmentDate < todayStart;
    });

    if (filterDate) {
      filtered = filtered.filter(assignment => assignment.date === filterDate);
    }

    if (filterType) {
      filtered = filtered.filter(assignment => assignment.type === filterType);
    }

    if (filterName.trim()) {
      const name = filterName.toLowerCase();
      filtered = filtered.filter(assignment => {
        const primary = assignment.participantName?.toLowerCase().includes(name);
        const secondary = assignment.secondParticipantName?.toLowerCase().includes(name);
        return primary || secondary;
      });
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredAssignments(filtered);
  }, [allAssignments, filterDate, filterType, filterName]);

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterType('');
    setFilterName('');
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Cargando historial de asignaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 text-center">Historial de Discursos y Demostraciones</h2>

      <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-xl shadow-inner border border-blue-200 dark:border-blue-600 space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Filtrar Historial</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">Fecha</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">Tipo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2 rounded">
              <option value="">Todos</option>
              <option value="discurso">Discurso</option>
              <option value="demostracion">Demostración</option>
              <option value="lectura-biblia">Lectura Bíblica</option>
              <option value="lectura-libro">Lectura del libro</option>
              <option value="asamblea-circuito">Asamblea Circuito</option>
              <option value="asamblea-regional">Asamblea Regional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">Nombre</label>
            <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="w-full p-2 rounded" placeholder="Buscar por nombre" />
          </div>
        </div>
        <div className="text-right">
          <button onClick={handleClearFilters} className="text-sm text-blue-600 dark:text-blue-400 underline">Limpiar filtros</button>
        </div>
      </div>

      <ul className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-blue-100 dark:border-blue-700">
        {filteredAssignments.length === 0 ? (
          <li className="text-center text-gray-600 dark:text-gray-400 py-4">No se encontraron asignaciones pasadas.</li>
        ) : (
          filteredAssignments.map(a => (
            <li key={a.id} className="py-4">
              <p className="font-semibold text-gray-900 dark:text-white">{a.date} - {formatAssignmentType(a.type)}</p>
              <p className="text-gray-700 dark:text-gray-300">{a.title}</p>
              <p className="text-indigo-600 dark:text-indigo-400">
                {a.participantName}
                {a.type === 'demostracion' && a.secondParticipantName && ` y ${a.secondParticipantName}`}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default HistoryViewPage;
