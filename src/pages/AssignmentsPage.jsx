import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { formatAssignmentType, calcularDiasDesde } from "../utils/helpers";
import ConfirmDialog from "../components/ConfirmDialog";


const appId = "default-app-id";

const AssignmentsPage = ({ db, userId, showMessage }) => {
  const [participants, setParticipants] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [meetingDate, setMeetingDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [secondSelectedParticipantId, setSecondSelectedParticipantId] =
    useState("");
  const [assignmentOrder, setAssignmentOrder] = useState("");
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [replacements, setReplacements] = useState([]);

  const resetForm = () => {
    setEditingAssignment(null);
    setSelectedType("");
    setAssignmentTitle("");
    setAssignmentOrder("");
    setSelectedParticipantId("");
    setSecondSelectedParticipantId("");
  };

  const [confirmDialog, setConfirmDialog] = useState({
  visible: false,
  message: "",
  resolve: null,
  confirmLabel: "Confirmar",
});


const showConfirm = (message, confirmLabel = "Confirmar") => {
  return new Promise((resolve) => {
    setConfirmDialog({ visible: true, message, resolve, confirmLabel });
  });
};




  useEffect(() => {
    if (!db || !userId) return;

    const participantsRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/participants`
    );
    const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParticipants(fetched);
    });

    const assignmentsRef = collection(
      db,
      `artifacts/${appId}/public/data/assignments`
    );
    const unsubscribeAssignments = onSnapshot(assignmentsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllAssignments(fetched);
    });

    const replacementsRef = collection(
      db,
      `artifacts/${appId}/public/data/replacements`
    );
    const unsubscribeReplacements = onSnapshot(replacementsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReplacements(fetched);
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeAssignments();
      unsubscribeReplacements(); // 👉 Y este cleanup nuevo
    };
  }, [db, userId]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered;

    if (filterDate) {
      filtered = allAssignments.filter((a) => a.date === filterDate);
    } else {
      filtered = allAssignments.filter((a) => {
        const [y, m, d] = a.date.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        return date >= today;
      });
    }

    if (filterName.trim()) {
      const name = filterName.toLowerCase();
      filtered = filtered.filter(
        (a) =>
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
  if (!meetingDate) return showMessage("Primero debes seleccionar una fecha de reunión.");

  const isAssembly = ["asamblea-circuito", "asamblea-regional", "cancion"].includes(selectedType);
  if (!isAssembly && !selectedParticipantId) {
    return showMessage("Completa los campos requeridos.");
  }

  // 🚨 Validar asignaciones en el mismo día
  const sameDayAssignments = allAssignments.filter(
    (a) => a.date === meetingDate && a.id !== (editingAssignment?.id ?? "")
  );

  let participantAlreadyAssigned = false;
  let secondParticipantAlreadyAssigned = false;

  sameDayAssignments.forEach((a) => {
    if (
      a.participantId === selectedParticipantId ||
      a.secondParticipantId === selectedParticipantId
    ) {
      participantAlreadyAssigned = true;
    }
    if (
      selectedType === "demostracion" &&
      (
        a.participantId === secondSelectedParticipantId ||
        a.secondParticipantId === secondSelectedParticipantId
      )
    ) {
      secondParticipantAlreadyAssigned = true;
    }
  });

  if (participantAlreadyAssigned || secondParticipantAlreadyAssigned) {
    const confirm = await showConfirm(
      "El participante ya tiene una asignación esta fecha. ¿Deseas continuar?",
      "Continuar"
    );
    if (!confirm) {
      return; // El usuario canceló
    }
  }

  const data = {
    date: meetingDate,
    type: selectedType,
    title: assignmentTitle.trim(),
    orden: parseInt(assignmentOrder, 10) || 99,
    participantId: selectedParticipantId || null,
    participantName: participants.find((p) => p.id === selectedParticipantId)?.name || null,
  };

  if (selectedType === "demostracion") {
    if (
      !secondSelectedParticipantId ||
      secondSelectedParticipantId === selectedParticipantId
    ) {
      return showMessage("Selecciona un segundo participante válido.");
    }
    data.secondParticipantId = secondSelectedParticipantId;
    data.secondParticipantName =
      participants.find((p) => p.id === secondSelectedParticipantId)?.name || null;
  }

  try {
    if (editingAssignment) {
      const changes = [];

      if (
        editingAssignment.participantId &&
        editingAssignment.participantId !== selectedParticipantId
      ) {
        changes.push({
          role: "titular",
          oldId: editingAssignment.participantId,
          oldName: editingAssignment.participantName,
          newId: selectedParticipantId,
          newName: data.participantName,
        });
      }

      if (
        selectedType === "demostracion" &&
        editingAssignment.secondParticipantId !== secondSelectedParticipantId
      ) {
        changes.push({
          role: "ayudante",
          oldId: editingAssignment.secondParticipantId || null,
          oldName: editingAssignment.secondParticipantName || null,
          newId: secondSelectedParticipantId,
          newName: data.secondParticipantName,
        });
      }

      for (const change of changes) {
        await addDoc(
          collection(db, `artifacts/${appId}/public/data/replacements`),
          {
            assignmentId: editingAssignment.id,
            date: meetingDate,
            type: selectedType,
            title: assignmentTitle.trim(),
            replacedRole: change.role,
            oldParticipantId: change.oldId,
            oldParticipantName: change.oldName,
            newParticipantId: change.newId,
            newParticipantName: change.newName,
            timestamp: new Date().toISOString(),
          }
        );
      }

      await updateDoc(
        doc(db, `artifacts/${appId}/public/data/assignments`, editingAssignment.id),
        data
      );
      showMessage("Asignación actualizada.");
    } else {
      await addDoc(
        collection(db, `artifacts/${appId}/public/data/assignments`),
        data
      );
      showMessage("Asignación creada.");
    }
    resetForm();
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
    setAssignmentOrder(assignment.orden ?? "");
    setSelectedParticipantId(assignment.participantId || "");
    setSecondSelectedParticipantId(assignment.secondParticipantId || "");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const selectedParticipantHistory = allAssignments
    .filter(
      (a) =>
        a.participantId === selectedParticipantId ||
        a.secondParticipantId === selectedParticipantId
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const secondSelectedParticipantHistory = allAssignments
    .filter(
      (a) =>
        a.participantId === secondSelectedParticipantId ||
        a.secondParticipantId === secondSelectedParticipantId
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const duplaRepetida =
    selectedType === "demostracion" &&
    allAssignments.find(
      (a) =>
        a.type === "demostracion" &&
        ((a.participantId === selectedParticipantId &&
          a.secondParticipantId === secondSelectedParticipantId) ||
          (a.participantId === secondSelectedParticipantId &&
            a.secondParticipantId === selectedParticipantId))
    );

  const sugerenciasGenerales = React.useMemo(() => {
    if (!meetingDate || !selectedType || selectedType === "demostracion")
      return [];

    return participants
      .filter((p) => p.enabledAssignments?.includes(selectedType))
      .map((p) => {
        const historial = allAssignments
          .filter(
            (a) =>
              a.type === selectedType &&
              (a.participantId === p.id || a.secondParticipantId === p.id)
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const ultima = historial[0]?.date || null;
        const dias = calcularDiasDesde(meetingDate, ultima);

        return { ...p, diasSinAsignacion: dias };
      })
      .sort((a, b) => b.diasSinAsignacion - a.diasSinAsignacion)
      .slice(0, 5);
  }, [meetingDate, selectedType, participants, allAssignments]);

  const sugerenciasTitularesDemostracion = React.useMemo(() => {
    if (!meetingDate || selectedType !== "demostracion") return [];

    return participants
      .filter((p) => p.enabledAssignments?.includes("demostracion"))
      .map((p) => {
        const historial = allAssignments
          .filter((a) => a.type === "demostracion" && a.participantId === p.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const ultima = historial[0]?.date || null;
        const dias = calcularDiasDesde(meetingDate, ultima);

        return { ...p, diasSinAsignacion: dias };
      })
      .sort((a, b) => b.diasSinAsignacion - a.diasSinAsignacion)
      .slice(0, 5);
  }, [meetingDate, selectedType, participants, allAssignments]);

  const sugerenciasAyudantesDemostracion = React.useMemo(() => {
    if (!meetingDate || selectedType !== "demostracion") return [];

    return participants
      .filter(
        (p) =>
          p.enabledAssignments?.includes("demostracion") ||
          p.enabledAssignments?.includes("ayudante")
      )
      .map((p) => {
        const historial = allAssignments
          .filter(
            (a) => a.type === "demostracion" && a.secondParticipantId === p.id
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const ultima = historial[0]?.date || null;
        const dias = calcularDiasDesde(meetingDate, ultima);

        return { ...p, diasSinAsignacion: dias };
      })
      .sort((a, b) => b.diasSinAsignacion - a.diasSinAsignacion)
      .slice(0, 5);
  }, [meetingDate, selectedType, participants, allAssignments]);

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <h2 className="text-3xl font-bold text-indigo-500 dark:text-indigo-300 text-center">
        Gestión de Asignaciones
      </h2>

      {/* Formulario */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label className="text-indigo-200 font-semibold">
          Seleccionar fecha:
        </label>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {meetingDate && (
        <form
          onSubmit={handleSave}
          className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-gray-300 mb-1">Tipo</label>
              <select
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Selecciona</option>
                <option value="presidencia">Presidencia</option>
                <option value="cancion">Canción</option>
                <option value="oracion-inicial">Oración Inicial</option>
                <option value="oracion-final">Oración Final</option>
                <option value="tesoros">Tesoros de la Biblia</option>
                <option value="perlas-escondidas">
                  Busquemos Perlas Escondidas
                </option>
                <option value="demostracion">Demostración</option>
                <option value="discurso">Discurso</option>
                <option value="conduccion-estudio-biblico">
                  Conducción Estudio Bíblico
                </option>
                <option value="nuestra-vida-cristiana">
                  Nuestra Vida Cristiana
                </option>
                <option value="necesidades">
                  Necesidades de la congregación
                </option>
                <option value="lectura-biblia">Lectura Bíblica</option>
                <option value="lectura-libro">Lectura del libro</option>
                <option value="asamblea-circuito">Asamblea Circuito</option>
                <option value="asamblea-regional">Asamblea Regional</option>
                <option value="visita">Visita Superintendente y esposa</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Título</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Orden</label>
              <input
                type="number"
                min="0"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
                value={assignmentOrder}
                onChange={(e) => setAssignmentOrder(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Titular</label>
              <select
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
                value={selectedParticipantId}
                onChange={(e) => setSelectedParticipantId(e.target.value)}
              >
                <option value="">Selecciona</option>
                {participants
                  .filter((p) => p.enabledAssignments?.includes(selectedType))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            {selectedType === "demostracion" && (
              <div>
                <label className="block text-gray-300 mb-1">Ayudante</label>
                <select
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
                  value={secondSelectedParticipantId}
                  onChange={(e) =>
                    setSecondSelectedParticipantId(e.target.value)
                  }
                >
                  <option value="">Selecciona</option>
                  {participants
                    .filter(
                      (p) =>
                        p.enabledAssignments?.includes("demostracion") ||
                        p.enabledAssignments?.includes("ayudante")
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {selectedParticipantHistory.length > 0 && (
            <div className="mt-4 bg-gray-800 border border-gray-700 p-4 rounded text-sm">
              <p className="font-semibold text-gray-200 mb-2">
                Últimas asignaciones de{" "}
                {participants.find((p) => p.id === selectedParticipantId)
                  ?.name || "—"}
                :
              </p>

              <ul className="list-disc pl-5 text-gray-300 mb-3">
                {selectedParticipantHistory.map((a, i) => {
                  const esTitular = a.participantId === selectedParticipantId;
                  const esAyudante =
                    a.secondParticipantId === selectedParticipantId;
                  return (
                    <li key={i}>
                      {a.date} - {formatAssignmentType(a.type)}:
                      {esTitular && (
                        <>
                          {" "}
                          {a.title}
                          {a.secondParticipantName &&
                            ` - con ${a.secondParticipantName}`}
                        </>
                      )}
                      {esAyudante && (
                        <>
                          {" "}
                          {a.title} (como ayudante de {a.participantName})
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="text-gray-400">
                Reemplazos recibidos:{" "}
                {
                  replacements.filter(
                    (r) => r.oldParticipantId === selectedParticipantId
                  ).length
                }
                {"  "}· Reemplazos realizados:{" "}
                {
                  replacements.filter(
                    (r) => r.newParticipantId === selectedParticipantId
                  ).length
                }
              </div>
            </div>
          )}

          {secondSelectedParticipantHistory.length > 0 && (
            <div className="mt-4 bg-gray-800 border border-gray-700 p-4 rounded text-sm">
              <p className="font-semibold text-gray-200 mb-2">
                Últimas asignaciones de{" "}
                {participants.find((p) => p.id === secondSelectedParticipantId)
                  ?.name || "—"}
                :
              </p>

              <ul className="list-disc pl-5 text-gray-300 mb-3">
                {secondSelectedParticipantHistory.map((a, i) => {
                  const esTitular =
                    a.participantId === secondSelectedParticipantId;
                  const esAyudante =
                    a.secondParticipantId === secondSelectedParticipantId;
                  return (
                    <li key={i}>
                      {a.date} - {formatAssignmentType(a.type)}:
                      {esTitular && (
                        <>
                          {" "}
                          {a.title}
                          {a.secondParticipantName &&
                            ` - con ${a.secondParticipantName}`}
                        </>
                      )}
                      {esAyudante && (
                        <>
                          {" "}
                          {a.title} (como ayudante de {a.participantName})
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="text-gray-400">
                Reemplazos recibidos:{" "}
                {
                  replacements.filter(
                    (r) => r.oldParticipantId === secondSelectedParticipantId
                  ).length
                }
                {"  "}· Reemplazos realizados:{" "}
                {
                  replacements.filter(
                    (r) => r.newParticipantId === secondSelectedParticipantId
                  ).length
                }
              </div>
            </div>
          )}

          {duplaRepetida && (
            <div className="mt-4 bg-red-900 border border-red-700 p-3 rounded text-red-200">
              ¡Advertencia! Esta dupla ya participó junta el{" "}
              {duplaRepetida.date}.
            </div>
          )}

          {/*       Sugerencias */}
      {selectedType !== "demostracion" && sugerenciasGenerales.length > 0 && (
        <div className="bg-blue-900 border border-blue-600 p-4 rounded text-blue-100 mb-4">
          <p className="font-semibold mb-2">
            Participantes que más tiempo hace que no tienen esta asignación:
          </p>
          <ul className="space-y-1">
            {sugerenciasGenerales.map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                <span>
                  {p.name} (
                  {p.diasSinAsignacion === Infinity
                    ? "nunca tuvo"
                    : `${p.diasSinAsignacion} días`}
                  )
                </span>
                <button
                  onClick={() => setSelectedParticipantId(p.id)}
                  className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Seleccionar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedType === "demostracion" && (
        <>
          {sugerenciasTitularesDemostracion.length > 0 && (
            <div className="bg-indigo-700 border border-indigo-400 p-4 rounded text-indigo-100 mb-4">
              <p className="font-semibold mb-2">
                Titulares con más tiempo sin asignación:
              </p>
              <ul className="space-y-1">
                {sugerenciasTitularesDemostracion.map((p) => (
                  <li key={p.id} className="flex justify-between items-center">
                    <span>
                      {p.name} (
                      {p.diasSinAsignacion === Infinity
                        ? "nunca tuvo"
                        : `${p.diasSinAsignacion} días`}
                      )
                    </span>
                    <button
                      onClick={() => setSelectedParticipantId(p.id)}
                      className="ml-2 mb-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-900 text-indigo-100 rounded text-sm"
                    >
                      Seleccionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sugerenciasAyudantesDemostracion.length > 0 && (
            <div className="bg-gray-700 border border-gray-500 p-4 rounded text-pink-100 mb-4">
              <p className="font-semibold mb-2">
                Ayudantes con más tiempo sin asignación:
              </p>
              <ul className="space-y-1">
                {sugerenciasAyudantesDemostracion.map((p) => (
                  <li key={p.id} className="flex justify-between items-center">
                    <span>
                      {p.name} (
                      {p.diasSinAsignacion === Infinity
                        ? "nunca tuvo"
                        : `${p.diasSinAsignacion} días`}
                      )
                    </span>
                    <button
                      onClick={() => setSecondSelectedParticipantId(p.id)}
                      className="ml-2 mb-2 px-3 py-1 bg-gray-500 hover:bg-gray-900 text-white rounded text-sm"
                    >
                      Seleccionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}


          <div className="flex justify-end gap-2">
            {editingAssignment && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-900 text-white rounded transition"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-900 text-white rounded transition"
            >
              {editingAssignment ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="p-2 rounded bg-gray-600 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="Buscar por nombre"
          className="p-2 rounded bg-gray-600 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
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

      {/* Listado */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-indigo-300">
          Asignaciones Próximas
        </h3>
        {currentAssignments.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={async () => {
                const batch = currentAssignments
                  .filter((a) => a.published === false)
                  .map((a) =>
                    updateDoc(
                      doc(
                        db,
                        `artifacts/${appId}/public/data/assignments`,
                        a.id
                      ),
                      { published: true }
                    )
                  );

                await Promise.all(batch);
                showMessage("Todas las asignaciones filtradas se publicaron.");
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-900 text-white rounded transition"
            >
              Publicar Todo
            </button>
          </div>
        )}

        {currentAssignments.map((a) => (
          <div
            key={a.id}
            className="p-4 border border-gray-700 bg-gray-800 rounded flex justify-between items-start"
          >
            <div>
              <p className="font-semibold text-gray-200">
                {a.date} - {formatAssignmentType(a.type)}
              </p>
              <p className="text-gray-300">{a.title}</p>
              <p className="text-gray-300">
                {a.participantName}
                {a.secondParticipantName && ` y ${a.secondParticipantName}`}
              </p>
              <p className="text-gray-400 text-sm">Orden: {a.orden}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(a)}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-900 text-white rounded transition"
              >
                Editar
              </button>
              <button
                onClick={() => setAssignmentToDelete(a)}
                className="px-3 py-1 bg-red-600 hover:bg-red-900 text-white rounded transition"
              >
                Eliminar
              </button>
              {a.published === false ? (
                <button
                  onClick={async () => {
                    await updateDoc(
                      doc(
                        db,
                        `artifacts/${appId}/public/data/assignments`,
                        a.id
                      ),
                      { published: true }
                    );
                    showMessage("Asignación publicada.");
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-900 text-white rounded transition"
                >
                  Publicar
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await updateDoc(
                      doc(
                        db,
                        `artifacts/${appId}/public/data/assignments`,
                        a.id
                      ),
                      { published: false }
                    );
                    showMessage("Asignación ocultada.");
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-900 text-white rounded transition"
                >
                  Ocultar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ConfirmDialog */}
      {assignmentToDelete && (
        <ConfirmDialog
          message="¿Eliminar esta asignación? Esta acción no se puede deshacer."
          onCancel={() => setAssignmentToDelete(null)}
          onConfirm={async () => {
            try {
              await deleteDoc(
                doc(
                  db,
                  `artifacts/${appId}/public/data/assignments`,
                  assignmentToDelete.id
                )
              );
              showMessage("Asignación eliminada.");
            } catch (error) {
              showMessage(`Error al eliminar: ${error.message}`);
            } finally {
              setAssignmentToDelete(null);
            }
          }}
        />
      )}
      {confirmDialog.visible && (
  <ConfirmDialog
    message={confirmDialog.message}
    onConfirm={() => {
      if (confirmDialog.resolve) confirmDialog.resolve(true);
      setConfirmDialog({ ...confirmDialog, visible: false });
    }}
    onCancel={() => {
      if (confirmDialog.resolve) confirmDialog.resolve(false);
      setConfirmDialog({ ...confirmDialog, visible: false });
    }}
  />
)}

    </div>
  );
};

export default AssignmentsPage;
