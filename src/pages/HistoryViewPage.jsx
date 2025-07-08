import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { formatAssignmentType } from '../utils/helpers';
import { History} from "lucide-react";
import { formatDateAr } from '../utils/helpers'; // Assuming this is the correct path for the date formatting function

const appId = 'default-app-id';

const HistoryViewPage = ({ db, showMessage }) => {
  const [allAssignments, setAllAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterName, setFilterName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!db) return;

    const assignmentsColRef = collection(db, `artifacts/${appId}/public/data/assignments`);
    const unsubscribe = onSnapshot(
      assignmentsColRef,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAllAssignments(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching historical assignments:", error);
        showMessage(`Error al cargar el historial de asignaciones: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, showMessage]);

  useEffect(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let filtered = allAssignments.filter((assignment) => {
      const [year, month, day] = assignment.date.split('-').map(Number);
      const assignmentDate = new Date(year, month - 1, day);
      return assignmentDate < todayStart;
    });

    if (filterDate) {
      filtered = filtered.filter((assignment) => assignment.date === filterDate);
    }

    if (filterType) {
      filtered = filtered.filter((assignment) => assignment.type === filterType);
    }

    if (filterName.trim()) {
      const name = filterName.toLowerCase();
      filtered = filtered.filter((assignment) => {
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

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/assignments`, id));
      showMessage('Asignación eliminada.');
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      showMessage(`Error al eliminar: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        Cargando historial de asignaciones...
      </div>
    );
  }

  return (
    <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
        <History className="w-6 h-6" /> Historial de Discursos y Demostraciones
      </h2>

      <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-inner space-y-4">
        <h3 className="text-xl font-semibold text-gray-200">
          Filtrar Historial
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-300">Fecha</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring focus:border-indigo-500"
            >
              <option value="">Todos</option>
              <option value="presidencia">Presidencia</option>
              <option value="oracion-inicial">Oración Inicial</option>
              <option value="oracion-final">Oración Final</option>
              <option value="tesoros">Tesoros de la Biblia</option>
              <option value="perlas-escondidas">Busquemos Perlas Escondidas</option>
              <option value="demostracion">Demostración</option>
              <option value="discurso">Discurso</option>
              <option value="conduccion-estudio-biblico">Conducción Estudio Bíblico</option>
              <option value="nuestra-vida-cristiana">Nuestra Vida Cristiana</option>
              <option value="necesidades">Necesidades de la congregación</option>
              <option value="lectura-biblia">Lectura Bíblica</option>
              <option value="lectura-libro">Lectura del libro</option>
              <option value="asamblea-circuito">Asamblea Circuito</option>
              <option value="asamblea-regional">Asamblea Regional</option>
              <option value="visita">Visita Superintendente de Circuito y su esposa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300">Nombre</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Buscar por nombre"
              className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="text-right">
          <button
            onClick={handleClearFilters}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <ul className="divide-y divide-gray-700 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        {filteredAssignments.length === 0 ? (
          <li className="text-center text-gray-400 py-4">
            No se encontraron asignaciones pasadas.
          </li>
        ) : (
          filteredAssignments.map((a) => (
            <li key={a.id} className="py-4 px-4 flex justify-between items-start hover:bg-gray-700 transition">
              <div>
                <p className="font-semibold text-indigo-300">
                  {formatDateAr(a.date)} — {formatAssignmentType(a.type)}
                </p>
                <p className="text-gray-300">{a.title}</p>
                <p className="text-indigo-400">
                  {a.participantName}
                  {a.type === 'demostracion' && a.secondParticipantName && ` y ${a.secondParticipantName}`}
                </p>
              </div>
              <button
                onClick={() => setConfirmDeleteId(a.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded transition"
              >
                Eliminar
              </button>
            </li>
          ))
        )}
      </ul>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm">
            <p className="text-white mb-4">
              ¿Estás seguro de que querés eliminar esta asignación?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryViewPage;
