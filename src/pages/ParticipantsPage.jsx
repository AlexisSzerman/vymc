import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

const appId = 'default-app-id';

// Lista de asignaciones disponibles
const ASSIGNMENT_TYPES = [
  "presidencia",
  "oracion-inicial",
  "oracion-final",
  "tesoros",
  "perlas-escondidas",
  "demostracion",
  "discurso",
  "conduccion-estudio-biblico",
  "nuestra-vida-cristiana",
  "necesidades",
  "lectura-biblia",
  "lectura-libro",
  "ayudante"
];

const ParticipantsPage = ({ db, userId, showMessage }) => {
  const [participants, setParticipants] = useState([]);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [enabledAssignments, setEnabledAssignments] = useState([]); // nuevo estado
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!db || !userId) return;

    const colRef = collection(db, `artifacts/${appId}/users/${userId}/participants`);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = fetched.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
      setParticipants(sorted);
    }, (error) => {
      console.error("Error loading participants:", error);
      showMessage(`Error al cargar participantes: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, showMessage]);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return showMessage('El nombre no puede estar vacío.');

    try {
      const data = {
        name: newName.trim(),
        notes: newNotes.trim(),
        enabledAssignments: enabledAssignments
      };

      if (editingParticipant) {
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/participants`, editingParticipant.id), data);
        showMessage('Participante actualizado.');
        setEditingParticipant(null);
      } else {
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/participants`), data);
        showMessage('Participante añadido.');
      }
      setNewName('');
      setNewNotes('');
      setEnabledAssignments([]);
    } catch (error) {
      console.error('Error saving participant:', error);
      showMessage(`Error: ${error.message}`);
    }
  };

  const handleEdit = (p) => {
    setEditingParticipant(p);
    setNewName(p.name);
    setNewNotes(p.notes || '');
    setEnabledAssignments(p.enabledAssignments || []);
  };

  const handleDelete = (p) => {
    setParticipantToDelete(p);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/participants`, participantToDelete.id));
      showMessage('Participante eliminado.');
    } catch (error) {
      console.error('Error deleting participant:', error);
      showMessage(`Error: ${error.message}`);
    } finally {
      setShowConfirmModal(false);
      setParticipantToDelete(null);
    }
  };

  const toggleAssignment = (assignment) => {
    if (enabledAssignments.includes(assignment)) {
      setEnabledAssignments(enabledAssignments.filter(a => a !== assignment));
    } else {
      setEnabledAssignments([...enabledAssignments, assignment]);
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300">Gestión de Participantes</h2>
      <form onSubmit={handleAddOrUpdate} className="bg-blue-50 dark:bg-gray-700 p-6 rounded-xl shadow-inner space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          className="w-full p-3 rounded"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <textarea
          placeholder="Notas"
          className="w-full p-3 rounded"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 col-span-full text-xl">Asignaciones aprobadas:</p>
          {ASSIGNMENT_TYPES.map(type => (
            <label key={type} className="flex items-center gap-2 text-sm  text-white">
              <input
                type="checkbox"
                checked={enabledAssignments.includes(type)}
                onChange={() => toggleAssignment(type)}
              />
              {type}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          {editingParticipant && (
            <button
              type="button"
              onClick={() => {
                setEditingParticipant(null);
                setNewName('');
                setNewNotes('');
                setEnabledAssignments([]);
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Cancelar
            </button>
          )}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            {editingParticipant ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </form>

      <input
        type="text"
        placeholder="Buscar participante..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white mb-4"
      />

      <ul className="divide-y">
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map(p => (
            <li key={p.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-white">{p.name}</p>
                {p.notes && <p className="text-sm text-gray-400">{p.notes}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="px-3 py-1 bg-yellow-500 text-white rounded">Editar</button>
                <button onClick={() => handleDelete(p)} className="px-3 py-1 bg-red-600 text-white rounded">Eliminar</button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-gray-500 italic py-2">No se encontraron participantes.</li>
        )}
      </ul>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Total de participantes: {filteredParticipants.length}
      </p>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl space-y-4">
            <p>¿Eliminar a <strong>{participantToDelete?.name}</strong>?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPage;
