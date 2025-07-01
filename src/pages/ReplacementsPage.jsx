import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";

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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-indigo-400 text-center">
        Registro de Reemplazos
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
          className="text-sm text-indigo-400 underline hover:text-indigo-300"
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
              className="flex justify-between items-center bg-gray-800 border border-gray-700 rounded-lg p-4 hover:shadow-md transition"
            >
              <div>
                <p className="font-semibold text-indigo-300 mb-1">
                  {r.date} — {r.title} ({r.type})
                </p>
                <p className="text-gray-300">
                  <strong className="text-gray-200">Reemplazo de {r.replacedRole}:</strong>{" "}
                  <span className="text-red-400">{r.oldParticipantName || "—"}</span>{" "}
                  <span className="text-gray-400">por</span>{" "}
                  <span className="text-green-400">{r.newParticipantName || "—"}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Registrado el {new Date(r.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(r)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReplacementsPage;
