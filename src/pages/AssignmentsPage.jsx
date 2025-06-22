import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc
} from 'firebase/firestore';
import {
  formatAssignmentType,
  formatDateToYYYYMMDD
} from '../utils/helpers';
import ReminderManager from '../components/ReminderManager';

const appId = 'default-app-id';

const AssignmentsPage = ({ db, userId, showMessage }) => {
  const [participants, setParticipants] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('discurso');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [secondSelectedParticipantId, setSecondSelectedParticipantId] = useState('');
  const [editingAssignment, setEditingAssignment] = useState(null);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(formatDateToYYYYMMDD(today));
  }, []);

  useEffect(() => {
    if (!db || !userId) return;

    const participantsRef = collection(db, `artifacts/${appId}/users/${userId}/participants`);
    const unsubscribeParticipants = onSnapshot(participantsRef, snapshot => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipants(fetched);
    });

    const assignmentsRef = collection(db, `artifacts/${appId}/public/data/assignments`);
    const unsubscribeAssignments = onSnapshot(assignmentsRef, snapshot => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllAssignments(fetched);
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeAssignments();
    };
  }, [db, userId]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filtered = allAssignments.filter(a => {
      const [y, m, d] = a.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date >= today;
    });
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    setCurrentAssignments(filtered);
  }, [allAssignments]);

  const handleSave = async (e) => {
    e.preventDefault();

    const isAssembly = ['asamblea-circuito', 'asamblea-regional'].includes(selectedType);
    if (!selectedDate || (!isAssembly && !selectedParticipantId)) {
      return showMessage('Completa los campos requeridos.');
    }

    try {
      const data = {
        date: selectedDate,
        type: selectedType,
        title: assignmentTitle.trim(),
        participantId: selectedParticipantId || null,
        participantName: participants.find(p => p.id === selectedParticipantId)?.name || null
      };

      if (selectedType === 'demostracion') {
        if (!secondSelectedParticipantId || secondSelectedParticipantId === selectedParticipantId) {
          return showMessage('Selecciona un segundo participante válido.');
        }
        data.secondParticipantId = secondSelectedParticipantId;
        data.secondParticipantName = participants.find(p => p.id === secondSelectedParticipantId)?.name || null;
      }

      if (editingAssignment) {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/assignments`, editingAssignment.id), data);
        showMessage('Asignación actualizada.');
      } else {
        await addDoc(collection(db, `artifacts/${appId}/public/data/assignments`), data);
        showMessage('Asignación creada.');
      }

      setEditingAssignment(null);
      setAssignmentTitle('');
      setSelectedParticipantId('');
      setSecondSelectedParticipantId('');
      setSelectedType('discurso');
      setSelectedDate(formatDateToYYYYMMDD(new Date()));
    } catch (error) {
      console.error(error);
      showMessage(`Error: ${error.message}`);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setSelectedDate(assignment.date);
    setSelectedType(assignment.type);
    setAssignmentTitle(assignment.title);
    setSelectedParticipantId(assignment.participantId || '');
    setSecondSelectedParticipantId(assignment.secondParticipantId || '');
  };

  const handleDelete = async (assignment) => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/assignments`, assignment.id));
      showMessage('Asignación eliminada.');
    } catch (error) {
      console.error(error);
      showMessage(`Error al eliminar: ${error.message}`);
    }
  };

  const selectedParticipantHistory = allAssignments
    .filter(a => a.participantId === selectedParticipantId || a.secondParticipantId === selectedParticipantId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const duplaRepetida = selectedType === 'demostracion' && allAssignments.find(a =>
    a.type === 'demostracion' &&
    ((a.participantId === selectedParticipantId && a.secondParticipantId === secondSelectedParticipantId) ||
     (a.participantId === secondSelectedParticipantId && a.secondParticipantId === selectedParticipantId))
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 text-center">Gestión de Asignaciones</h2>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-blue-200 dark:border-blue-600">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className=" dark:text-indigo-300">Fecha</label>
            <input type="date" className="w-full p-2" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
          </div>
          <div>
            <label className=" dark:text-indigo-300">Tipo</label>
            <select className="w-full p-2" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="discurso">Discurso</option>
              <option value="demostracion">Demostración</option>
              <option value="lectura-biblia">Lectura Bíblica</option>
              <option value="lectura-libro">Lectura del libro</option>
              <option value="asamblea-circuito">Asamblea Circuito</option>
              <option value="asamblea-regional">Asamblea Regional</option>
            </select>
          </div>
          <div>
            <label className=" dark:text-indigo-300">Título</label>
            <input type="text" className="w-full p-2" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} />
          </div>
          <div>
            <label className=" dark:text-indigo-300">Titular</label>
            <select className="w-full p-2" value={selectedParticipantId} onChange={(e) => setSelectedParticipantId(e.target.value)}>
              <option value="">Selecciona</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {selectedType === 'demostracion' && (
            <div>
              <label className=" dark:text-indigo-300">Ayudante</label>
              <select className="w-full p-2" value={secondSelectedParticipantId} onChange={(e) => setSecondSelectedParticipantId(e.target.value)}>
                <option value="">Selecciona</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedParticipantHistory.length > 0 && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border text-sm">
            <p className="font-semibold text-gray-800 dark:text-white mb-2">Últimas asignaciones del participante:</p>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-200">
              {selectedParticipantHistory.map((a, i) => (
                <li key={i}>{a.date} - {formatAssignmentType(a.type)}</li>
              ))}
            </ul>
          </div>
        )}

        {duplaRepetida && (
          <div className="mt-4 bg-red-100 dark:bg-red-800 p-3 rounded border text-red-800 dark:text-red-100">
            ¡Advertencia! Esta dupla ya participó junta el {duplaRepetida.date}.
          </div>
        )}

        <div className="text-right">
          {editingAssignment && (
            <button type="button" onClick={() => setEditingAssignment(null)} className="mr-2 text-gray-600 underline">Cancelar</button>
          )}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingAssignment ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold  text-white">Asignaciones Próximas</h3>
        {currentAssignments.map(a => (
          <div key={a.id} className="p-4 border rounded shadow-sm flex justify-between items-start  text-white">
            <div>
              <p className="font-semibold  text-white">{a.date} - {formatAssignmentType(a.type)}</p>
              <p className="font-semibold  text-white">{a.title}</p>
              <p className="font-semibold  text-white">
                {a.participantName}
                {a.secondParticipantName && ` y ${a.secondParticipantName}`}
              </p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(a)} className="bg-yellow-500 text-white px-3 py-1 rounded">Editar</button>
              <button onClick={() => handleDelete(a)} className="bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <ReminderManager db={db} showMessage={showMessage} />
    </div>
  );
};

export default AssignmentsPage;