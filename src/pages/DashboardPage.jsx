// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

const excludedParticipantNames = ["Guillermo Figueiras", "Visita Superintendente"];

export default function Dashboard({ db }) {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [replacements, setReplacements] = useState([]);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assignmentsSnap = await getDocs(
          collection(db, "artifacts/default-app-id/public/data/assignments")
        );
        const replacementsSnap = await getDocs(
          collection(db, "artifacts/default-app-id/public/data/replacements")
        );
        const participantsSnap = await getDocs(
          collection(db, "artifacts/default-app-id/public/data/participants")
        );

        setAssignments(assignmentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setReplacements(replacementsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setParticipants(participantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        setLoading(false);
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [db]);

  if (loading) {
    return <p className="text-center text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>;
  }

  // Filtrar asignaciones
  const filteredAssignments = assignments.filter(
    (a) => !excludedParticipantNames.includes(a.participantName)
  );

  // Filtrar reemplazos
  const filteredReplacements = replacements.filter(
    (r) =>
      !excludedParticipantNames.includes(r.oldParticipantName) &&
      !excludedParticipantNames.includes(r.newParticipantName)
  );

  // Filtrar participantes
  const filteredParticipants = participants.filter(
    (p) => !excludedParticipantNames.includes(p.name)
  );

  // Participantes activos por NOMBRE
  const activeParticipants = filteredParticipants.filter((p) =>
    assignments.some(
      (a) =>
        a.participantName === p.name || a.secondParticipantName === p.name
    )
  );

  // Conteo de asignaciones por participante
  const assignmentCounts = {};
  filteredAssignments.forEach((a) => {
    if (a.participantName && !excludedParticipantNames.includes(a.participantName)) {
      assignmentCounts[a.participantName] = (assignmentCounts[a.participantName] || 0) + 1;
    }
    if (a.secondParticipantName && !excludedParticipantNames.includes(a.secondParticipantName)) {
      assignmentCounts[a.secondParticipantName] = (assignmentCounts[a.secondParticipantName] || 0) + 1;
    }
  });

  // Convertir a array y ordenar descendente
  const topParticipants = Object.entries(assignmentCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 text-center">
        Panel de Estadísticas
      </h2>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Asignaciones totales"
          value={filteredAssignments.length}
        />
        <StatCard
          title="Reemplazos registrados"
          value={filteredReplacements.length}
        />
        <StatCard
          title="Participantes"
          value={`${filteredParticipants.length} / ${activeParticipants.length}`}
        />
        <StatCard
          title="% asignaciones con reemplazo"
          value={
            filteredAssignments.length > 0
              ? `${Math.round(
                  (filteredReplacements.length / filteredAssignments.length) * 100
                )}%`
              : "0%"
          }
        />
      </div>

      {/* Top participantes */}
      <div className="bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-700 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Participantes con más asignaciones
        </h3>
        {topParticipants.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No hay datos de asignaciones.
          </p>
        ) : (
          <ul className="space-y-2">
            {topParticipants.map((p, idx) => (
              <li key={p.name} className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-gray-100">
                  {idx + 1}. {p.name}
                </span>
                <span className="font-mono text-indigo-700 dark:text-indigo-300">
                  {p.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-indigo-100 dark:border-indigo-700 flex flex-col items-center">
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-2">{value}</p>
  </div>
);

