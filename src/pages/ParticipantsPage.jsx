// ParticipantsPage.jsx

import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  UserPlus,
  Users,
  CheckSquare,
  Square,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatAssignmentType } from "../utils/helpers"; // Make sure this path is correct

const appId = "default-app-id";

// Your comprehensive list of assignment types
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
  "ayudante",
];

const ParticipantsPage = ({ db, userId, showMessage }) => {
  const [participants, setParticipants] = useState([]);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [enabledAssignments, setEnabledAssignments] = useState([]);
  const [excludedFromTypes, setExcludedFromTypes] = useState([]); // Stores which types the participant is excluded from
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reminder, setReminder] = React.useState({
    enabled: false,
    message: "",
  });

  useEffect(() => {
    if (!db || !userId) return;

    const colRef = collection(
      db,
      `artifacts/${appId}/public/data/participants`
    );
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const sorted = fetched.sort((a, b) =>
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        );
        setParticipants(sorted);
      },
      (error) => {
        console.error("Error loading participants:", error);
        showMessage(`Error al cargar participantes: ${error.message}`);
      }
    );

    return () => unsubscribe();
  }, [db, userId, showMessage]);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return showMessage("El nombre no puede estar vacío.");

    try {
      const data = {
        name: newName.trim(),
        notes: newNotes.trim(),
        enabledAssignments: enabledAssignments,
        excludedFromAssignmentTypes: excludedFromTypes || [],
        reminder: reminder,
      };

      if (editingParticipant) {
        await updateDoc(
          doc(
            db,
            `artifacts/${appId}/public/data/participants`,
            editingParticipant.id
          ),
          data
        );
        showMessage("Participante actualizado.");
        setEditingParticipant(null);
      } else {
        await addDoc(
          collection(db, `artifacts/${appId}/public/data/participants`),
          data
        );
        showMessage("Participante añadido.");
      }
      setNewName("");
      setNewNotes("");
      setEnabledAssignments([]);
      setExcludedFromTypes([]); // Reset exclusion status after save
    } catch (error) {
      console.error("Error saving participant:", error);
      showMessage(`Error: ${error.message}`);
    }
  };

  const handleEdit = (p) => {
    setEditingParticipant(p);
    setNewName(p.name);
    setNewNotes(p.notes || "");
    setEnabledAssignments(p.enabledAssignments || []);
    // Load exclusion status, defaulting to empty array if not present in Firestore
    setExcludedFromTypes(p.excludedFromAssignmentTypes || []);
    setReminder(p.reminder || { enabled: false, message: "", date: "" });
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const handleDelete = (p) => {
    setParticipantToDelete(p);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(
        doc(
          db,
          `artifacts/${appId}/public/data/participants`,
          participantToDelete.id
        )
      );
      showMessage("Participante eliminado.");
    } catch (error) {
      console.error("Error deleting participant:", error);
      showMessage(`Error: ${error.message}`);
    } finally {
      setShowConfirmModal(false);
      setParticipantToDelete(null);
    }
  };

  const toggleAssignment = (assignment) => {
    if (enabledAssignments.includes(assignment)) {
      setEnabledAssignments(enabledAssignments.filter((a) => a !== assignment));
    } else {
      setEnabledAssignments([...enabledAssignments, assignment]);
    }
  };

  // Function to toggle exclusion for a specific type
  const toggleExclusionForType = (typeToExclude) => {
    if (excludedFromTypes.includes(typeToExclude)) {
      setExcludedFromTypes(
        excludedFromTypes.filter((type) => type !== typeToExclude)
      );
    } else {
      setExcludedFromTypes([...excludedFromTypes, typeToExclude]);
    }
  };

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
        <Users className="w-6 h-6" /> Gestión de Participantes
      </h2>

      <form
        onSubmit={handleAddOrUpdate}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white p-6 rounded-xl shadow-inner space-y-4"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nombre"
            className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </div>
        <textarea
          placeholder="Notas"
          className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
        />
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={!!reminder.enabled}
              onChange={(e) =>
                setReminder({ ...reminder, enabled: e.target.checked })
              }
              className="form-checkbox"
            />
            Activar recordatorio
          </label>

          {reminder.enabled && (
            <textarea
              placeholder="Mensaje de recordatorio"
              value={reminder.message || ""}
              onChange={(e) =>
                setReminder({ ...reminder, message: e.target.value })
              }
              rows={3}
              className="w-full mt-2 p-2 rounded bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          )}
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-2">Asignaciones aprobadas:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ASSIGNMENT_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                {enabledAssignments.includes(type) ? (
                  <CheckSquare
                    className="w-5 h-5 min-w-[20px] min-h-[20px] shrink-0 cursor-pointer"
                    onClick={() => toggleAssignment(type)}
                  />
                ) : (
                  <Square
                    className="w-5 h-5 min-w-[20px] min-h-[20px] shrink-0 cursor-pointer"
                    onClick={() => toggleAssignment(type)}
                  />
                )}
                {formatAssignmentType(type)}
              </label>
            ))}
          </div>
        </div>
        {/* UPDATED SECTION: Exclusion from *all* assignment types */}
        <div>
          <p className="text-gray-400 text-sm mb-2 mt-4">
            Excluir de sugerencias para:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {/* Map over all ASSIGNMENT_TYPES for exclusion checkboxes */}
            {ASSIGNMENT_TYPES.map((type) => (
              <label
                key={`exclude-${type}`}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                {excludedFromTypes.includes(type) ? (
                  <CheckSquare
                    className="w-5 h-5 min-w-[20px] min-h-[20px] shrink-0 cursor-pointer text-red-400"
                    onClick={() => toggleExclusionForType(type)}
                  />
                ) : (
                  <Square
                    className="w-5 h-5 min-w-[20px] min-h-[20px] shrink-0 cursor-pointer"
                    onClick={() => toggleExclusionForType(type)}
                  />
                )}
                {formatAssignmentType(type)}
              </label>
            ))}
          </div>
        </div>
        {/* END UPDATED SECTION */}
        <div className="flex justify-end gap-2">
          {editingParticipant && (
            <button
              type="button"
              onClick={() => {
                setEditingParticipant(null);
                setNewName("");
                setNewNotes("");
                setEnabledAssignments([]);
                setExcludedFromTypes([]);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-2"
          >
            <UserPlus className="text-indigo-300" />
            {editingParticipant ? "Actualizar" : "Agregar"}
          </button>
        </div>
      </form>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar participante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 rounded border border-gray-700 bg-gray-900 text-white mb-4 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <ul className="divide-y divide-gray-700">
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map((p) => (
            <li
              key={p.id}
              className="py-3 flex justify-between items-center text-white"
            >
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  {p.name}
                </p>
                {p.notes && <p className="text-sm text-gray-400">{p.notes}</p>}
                {/* Display excluded types for the participant */}
                {p.excludedFromAssignmentTypes?.length > 0 && (
                  <p className="text-xs text-red-300 mt-1">
                    Excluido de:{" "}
                    {p.excludedFromAssignmentTypes
                      .map(formatAssignmentType)
                      .join(", ")}
                  </p>
                )}
                {p.reminder?.enabled && (
                  <p className="text-xs text-yellow-300 mt-1">
                    🔔 {p.reminder.message || "Recordatorio activo"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="p-2 bg-orange-400 hover:bg-orange-700 text-white rounded flex items-center gap-1"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center gap-1"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-gray-400 italic py-2">
            No se encontraron participantes.
          </li>
        )}
      </ul>

      <p className="text-sm text-gray-400 mt-2">
        Total de participantes: {filteredParticipants.length}
      </p>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl space-y-4 text-white">
            <p>
              ¿Eliminar a <strong>{participantToDelete?.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-500 hover:bg-slate-700 text-white rounded"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded"
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

export default ParticipantsPage;
