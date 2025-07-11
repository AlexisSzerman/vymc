import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { formatDateToYYYYMMDD, formatDateAr } from '../utils/helpers';

const appId = 'default-app-id';

const ReminderManager = ({ db, showMessage }) => {
  const [reminderDate, setReminderDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [reminderText, setReminderText] = useState('');
  const [reminderType, setReminderType] = useState('');
  const [allReminders, setAllReminders] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!db) return;

    const colRef = collection(db, `artifacts/${appId}/public/data/public_reminders`);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      fetched.sort((a, b) => new Date(b.id) - new Date(a.id));
      setAllReminders(fetched);
    });

    return () => unsubscribe();
  }, [db]);

  const saveReminder = async () => {
    if (!reminderDate.trim()) return showMessage('Selecciona una fecha.');

    try {
      const docId = editingId || reminderDate;
      const ref = doc(
        db,
        `artifacts/${appId}/public/data/public_reminders`,
        docId
      );
      await setDoc(ref, {
        message: reminderText.trim(),
        type: reminderType.trim()
      });

      showMessage(editingId ? 'Recordatorio actualizado.' : 'Recordatorio creado.');
      setReminderText('');
      setReminderDate(formatDateToYYYYMMDD(new Date()));
      setReminderType('');
      setEditingId(null);
    } catch (err) {
      console.error(err);
      showMessage(`Error al guardar recordatorio: ${err.message}`);
    }
  };

  const handleEdit = (reminder) => {
    setReminderDate(reminder.id);
    setReminderText(reminder.message);
    setReminderType(reminder.type || '');
    setEditingId(reminder.id);
  };

  const handleDelete = async (reminder) => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/public_reminders`, reminder.id));
      showMessage('Recordatorio eliminado.');
    } catch (err) {
      console.error(err);
      showMessage(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700 space-y-6">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        Recordatorio Público
      </h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Fecha</label>
          <input
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Tipo</label>
          <select
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Otros</option>
            <option value="Asamblea de Circuito">Asamblea de Circuito</option>
            <option value="Asamblea Regional">Asamblea Regional</option>
            <option value="Visita del Superintendente">Visita del Superintendente</option>
            <option value="Visita Especial">Visita Especial</option>
            <option value="Conmemoración">Conmemoración</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Mensaje</label>
          <textarea
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            rows="2"
            placeholder="Mensaje del recordatorio"
            className="w-full p-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setReminderText('');
              setReminderDate(formatDateToYYYYMMDD(new Date()));
              setReminderType('');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={saveReminder}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
        >
          {editingId ? 'Actualizar' : 'Crear'}
        </button>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Recordatorios existentes</h4>
        <ul className="space-y-2">
          {allReminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 bg-gray-800 border border-gray-700 p-4 rounded-xl"
            >
              <div>
                <p className="font-semibold text-indigo-300">{formatDateAr(reminder.id)}</p>
                <p className="text-gray-200">
                  {reminder.message}
                </p>
              </div>
              <div className="flex gap-2 justify-end mt-2 sm:mt-0">
                <button
                  onClick={() => handleEdit(reminder)}
                  className="bg-orange-400 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(reminder)}
                  className=" text-white px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 transition"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
          {allReminders.length === 0 && (
            <li className="text-gray-500 text-sm italic">No hay recordatorios cargados.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ReminderManager;
