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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 text-center">
        Registro de Reemplazos
      </h2>

      <div className="flex gap-4 flex-wrap items-center">
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
        <button
          onClick={() => {
            setFilterDate("");
            setFilterName("");
          }}
          className="text-sm text-blue-600 dark:text-blue-400 underline"
        >
          Limpiar filtros
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No hay reemplazos registrados.
        </p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((r) => (
<li
  key={r.id}
  className="p-4 border rounded bg-white dark:bg-gray-800 shadow-sm flex justify-between items-center"
>
  <div>
    <p className="font-semibold text-indigo-800 dark:text-indigo-200">
      {r.date} — {r.title} ({r.type})
    </p>
    <p>
      <strong className="text-gray-800 dark:text-gray-100">Reemplazo de {r.replacedRole}:</strong>{" "}
      <span className="text-red-700 dark:text-red-400">
        {r.oldParticipantName || "—"}
      </span>{" "}
     <span className="text-gray-800 dark:text-gray-100">por</span>{" "}
      <span className="text-green-700 dark:text-green-400">
        {r.newParticipantName || "—"}
      </span>
    </p>
    <p className="text-sm text-gray-500">
      Registrado el {new Date(r.timestamp).toLocaleString()}
    </p>
  </div>
  <button
    onClick={() => handleDelete(r)}
    className="px-4 py-2 bg-red-600 text-white rounded ml-4"
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
