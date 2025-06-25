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
} from '../utils/helpers';

const appId = 'default-app-id';

const AssignmentsPage = ({ db, userId, showMessage }) => {
  const [participants, setParticipants] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [meetingDate, setMeetingDate] = useState('');
  const [selectedType, setSelectedType] = useState('discurso');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [secondSelectedParticipantId, setSecondSelectedParticipantId] = useState('');
  const [assignmentOrder, setAssignmentOrder] = useState('');
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterName, setFilterName] = useState('');

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
    let filtered = allAssignments.filter(a => {
      const [y, m, d] = a.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date >= today;
    });

    if (filterDate) {
      filtered = filtered.filter(a => a.date === filterDate);
    }

    if (filterName.trim()) {
      const name = filterName.toLowerCase();
      filtered = filtered.filter(a =>
        a.participantName?.toLowerCase().includes(name) ||
        a.secondParticipantName?.toLowerCase().includes(name)
      );
    }

    filtered.sort((a, b) => {
      if (a.date === b.date) return (a.orden ?? 99) - (b.orden ?? 99);
      return new Date(a.date) - new Date(b.date);
    });

    setCurrentAssignments(filtered);
  }, [allAssignments, filterDate, filterName]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!meetingDate) {
      return showMessage('Primero debes seleccionar una fecha de reunión.');
    }

    const isAssembly = ['asamblea-circuito', 'asamblea-regional'].includes(selectedType);
    if (!isAssembly && !selectedParticipantId) {
      return showMessage('Completa los campos requeridos.');
    }

    try {
      const data = {
        date: meetingDate,
        type: selectedType,
        title: assignmentTitle.trim(),
        orden: parseInt(assignmentOrder, 10) || 99,
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
      setAssignmentOrder('');
      setSelectedType('discurso');
    } catch (error) {
      console.error(error);
      showMessage(`Error: ${error.message}`);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setMeetingDate(assignment.date);
    setSelectedType(assignment.type);
    setAssignmentTitle(assignment.title);
    setAssignmentOrder(assignment.orden ?? '');
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

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label className="text-indigo-800 dark:text-indigo-200 font-semibold">Seleccionar fecha de la reunión nueva:</label>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {meetingDate && (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-blue-200 dark:border-blue-600">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className=" dark:text-indigo-300">Tipo</label>
              <select className="w-full p-2" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
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
              <label className=" dark:text-indigo-300">Título</label>
              <input type="text" className="w-full p-2" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} />
            </div>
            <div>
              <label className=" dark:text-indigo-300">Orden</label>
              <input type="number" min="0" className="w-full p-2" value={assignmentOrder} onChange={(e) => setAssignmentOrder(e.target.value)} />
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
      {selectedParticipantHistory.map((a, i) => {
        const esTitular = a.participantId === selectedParticipantId;
        const esAyudante = a.secondParticipantId === selectedParticipantId;
        return (
          <li key={i}>
            {a.date} - {formatAssignmentType(a.type)}:
            {esTitular && (
              <>
                {' '}
                {a.title}
                {a.secondParticipantName && ` - con ${a.secondParticipantName}`}
              </>
            )}
            {esAyudante && (
              <>
                {' '}
                {a.title} (como ayudante de {a.participantName})
              </>
            )}
          </li>
        );
      })}
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
      )}

      <div className="flex gap-4 items-center">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="Buscar por nombre"
          className="p-2 border rounded"
        />
        <button onClick={() => {
          setFilterDate('');
          setFilterName('');
        }} className="text-sm text-blue-600 dark:text-blue-400 underline">Limpiar filtros</button>
      </div>

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
              <p className="font-semibold  text-white">Orden: {a.orden}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(a)} className="bg-yellow-500 text-white px-3 py-1 rounded">Editar</button>
              <button onClick={() => handleDelete(a)} className="bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentsPage;
