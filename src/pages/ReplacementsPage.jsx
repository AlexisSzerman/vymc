import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { RefreshCcw } from "lucide-react";
import { formatAssignmentType, formatDateAr } from '../utils/helpers';
import { Trash2 } from "lucide-react";

const appId = "default-app-id";

const ReplacementsPage = ({ db, showMessage, showConfirm }) => {
  const [replacements, setReplacements] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");

  useEffect(() => {
    if (!db) return;

    const ref = collection(db, `artifacts/${appId}/public/data/replacements`);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReplacements(fetched);
    });

    return () => unsubscribe();
  }, [db]);

  const handleDelete = async (r) => {
    const confirmed = await showConfirm(
      "¿Eliminar este reemplazo? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    await deleteDoc(
      doc(db, `artifacts/${appId}/public/data/replacements`, r.id)
    );
    showMessage("Reemplazo eliminado.");
  };

  const filtered = replacements.filter((r) => {
    let match = true;
    if (filterDate) {
      match = r.date === filterDate;
    }
    if (filterName.trim()) {
      const name = filterName.toLowerCase();
      match =
        match &&
        (r.oldParticipantName?.toLowerCase().includes(name) ||
          r.newParticipantName?.toLowerCase().includes(name));
    }
    return match;
  });

  return (
    <div className="space-y-6 mb-20">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
        <RefreshCcw className="w-6 h-6" /> Registro de Reemplazos
      </h2>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="p-2 border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring focus:border-indigo-500"
        />
        <input
          type="text"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="Buscar por nombre"
          className="p-2 border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring focus:border-indigo-500"
        />
        <button
          onClick={() => {
            setFilterDate("");
            setFilterName("");
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-900 text-white rounded transition"
        >
          Limpiar filtros
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400">No hay reemplazos registrados.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg transition"
            >
              <div>
                <p className="font-semibold text-indigo-300 mb-1">
                  {formatDateAr(r.date)} — {r.title} ({formatAssignmentType(r.type)})
                </p>
                <p className="text-gray-300">
                  <span className="text-green-400">
                    {r.newParticipantName || "—"}
                  </span>{" "}
                  <span className="text-gray-400">reemplaza a </span>{" "}
                  <span className="text-red-400">
                    {r.oldParticipantName || "—"}
                  </span>{" "}
                  <span className="text-gray-400">como</span>{" "}
                  <strong className="text-gray-200">{r.replacedRole}</strong>{" "}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Registrado el {new Date(r.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 justify-end mt-2 sm:mt-0">
                
              <button
                onClick={() => handleDelete(r)}
                className="p-2 text-white rounded transition bg-rose-600 hover:bg-rose-700"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReplacementsPage;
