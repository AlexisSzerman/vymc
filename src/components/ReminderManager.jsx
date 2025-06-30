import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { formatDateToYYYYMMDD } from '../utils/helpers';

const appId = 'default-app-id'; 

const ReminderManager = ({ db, showMessage }) => {
  const [reminderDate, setReminderDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [reminderText, setReminderText] = useState('');
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
      const ref = doc(db, `artifacts/${appId}/public/data/public_reminders`, reminderDate);
      await setDoc(ref, { message: reminderText.trim() });

      showMessage(editingId ? 'Recordatorio actualizado.' : 'Recordatorio creado.');
      setReminderText('');
      setReminderDate(formatDateToYYYYMMDD(new Date()));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      showMessage(`Error al guardar recordatorio: ${err.message}`);
    }
  };

  const handleEdit = (reminder) => {
    setReminderDate(reminder.id);
    setReminderText(reminder.message);
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-300 dark:border-gray-600 space-y-4 mt-10">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">📌 Recordatorio Público</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="date"
          value={reminderDate}
          onChange={(e) => setReminderDate(e.target.value)}
          className="w-full p-2 rounded border dark:border-gray-600"
        />
        <textarea
          value={reminderText}
          onChange={(e) => setReminderText(e.target.value)}
          rows="2"
          placeholder="Mensaje del recordatorio"
          className="w-full p-2 rounded border dark:border-gray-600"
        />
      </div>

      <div className="flex justify-end gap-2">
        {editingId && (
          <button onClick={() => {
            setEditingId(null);
            setReminderText('');
            setReminderDate(formatDateToYYYYMMDD(new Date()));
          }} className="px-4 py-2 bg-gray-400 text-white rounded">
            Cancelar
          </button>
        )}
        <button onClick={saveReminder} className="bg-green-600 text-white px-4 py-2 rounded">
          {editingId ? 'Actualizar' : 'Crear'}
        </button>
      </div>

      <div>
        <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-700 dark:text-gray-300">Recordatorios existentes</h4>
        <ul className="space-y-2">
          {allReminders.map((reminder) => (
            <li key={reminder.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded shadow">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{reminder.id}</p>
                <p className="text-gray-700 dark:text-gray-200">{reminder.message}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(reminder)} className="bg-yellow-500 text-white px-3 py-1 rounded">Editar</button>
                <button onClick={() => handleDelete(reminder)} className="bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
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
