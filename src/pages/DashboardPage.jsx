import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const appId = "default-app-id";

const EXCLUDED_PARTICIPANTS = ["A Confirmar", "Presidente", "Guillermo Figueiras"];
const EXCLUDED_ASSIGNMENT_TYPES = [
  "cancion",
  "visita",
  "oracion-inicial",
  "oracion-final"
];

const DashboardPage = ({ db, showMessage, authUser }) => {
  const [assignments, setAssignments] = useState([]);
  const [replacements, setReplacements] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !authUser) return;

    const fetchData = async () => {
      try {
        const [assignmentsSnap, replacementsSnap, participantsSnap] =
          await Promise.all([
            getDocs(
              collection(db, `artifacts/${appId}/public/data/assignments`)
            ),
            getDocs(
              collection(db, `artifacts/${appId}/public/data/replacements`)
            ),
            getDocs(
              collection(
                db,
                `artifacts/${appId}/users/${authUser.uid}/participants`
              )
            )
          ]);

        const a = assignmentsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        const r = replacementsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        const p = participantsSnap.docs.map((doc) => doc.data());

        setAssignments(a);
        setReplacements(r);
        setParticipants(p);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showMessage(`Error cargando estadísticas: ${error.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [db, showMessage, authUser]);

  // Filtrado de asignaciones y reemplazos
  const filteredAssignments = assignments.filter(
    (a) =>
      !EXCLUDED_ASSIGNMENT_TYPES.includes(a.type) &&
      !EXCLUDED_PARTICIPANTS.includes(a.participantName) &&
      !EXCLUDED_PARTICIPANTS.includes(a.secondParticipantName)
  );

  const filteredReplacements = replacements.filter(
    (r) =>
      !EXCLUDED_PARTICIPANTS.includes(r.oldParticipantName) &&
      !EXCLUDED_PARTICIPANTS.includes(r.newParticipantName)
  );

const assignedParticipantNames = new Set();
filteredAssignments.forEach((a) => {
  if (a.participantName) assignedParticipantNames.add(a.participantName);
  if (a.secondParticipantName) assignedParticipantNames.add(a.secondParticipantName);
});

const activeParticipants = participants.filter((p) =>
  assignedParticipantNames.has(p.name)
);

console.log("Nombres de participantes asignados:", [...assignedParticipantNames]);
console.log("Todos los participantes:", participants.map(p => ({id: p.id, name: p.name})));

  // Asignaciones por mes
  const assignmentsPerMonth = {};
  filteredAssignments.forEach((a) => {
    if (!a.date) return;
    const [year, month] = a.date.split("-");
    const key = `${year}-${month}`;
    assignmentsPerMonth[key] = (assignmentsPerMonth[key] || 0) + 1;
  });
  const barLabels = Object.keys(assignmentsPerMonth).sort();
  const barData = Object.values(assignmentsPerMonth);

  // Reemplazos por tipo
  const replacementsPerType = {};
  filteredReplacements.forEach((r) => {
    const key = r.type || "Desconocido";
    replacementsPerType[key] = (replacementsPerType[key] || 0) + 1;
  });
  const pieLabels = Object.keys(replacementsPerType);
  const pieData = Object.values(replacementsPerType);

  // Top participantes
  const participantCounts = {};
  filteredAssignments.forEach((a) => {
    if (a.participantName) {
      participantCounts[a.participantName] =
        (participantCounts[a.participantName] || 0) + 1;
    }
    if (a.secondParticipantName) {
      participantCounts[a.secondParticipantName] =
        (participantCounts[a.secondParticipantName] || 0) + 1;
    }
  });
  const topParticipants = Object.entries(participantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        Cargando estadísticas...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 text-center">
        Panel de Estadísticas
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Asignaciones creadas</p>
          <p className="text-3xl font-bold text-indigo-600">
            {filteredAssignments.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Reemplazos registrados</p>
          <p className="text-3xl font-bold text-indigo-600">
            {filteredReplacements.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">% asignaciones con reemplazo</p>
          <p className="text-3xl font-bold text-indigo-600">
            {filteredAssignments.length > 0
              ? (
                  (filteredReplacements.length / filteredAssignments.length) *
                  100
                ).toFixed(1) + "%"
              : "0%"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Participantes activos / total</p>
          <p className="text-3xl font-bold text-indigo-600">
            {activeParticipants.length}/{participants.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Asignaciones por Mes</h3>
          {barLabels.length === 0 ? (
            <p className="text-gray-500">No hay datos.</p>
          ) : (
            <Bar
              data={{
                labels: barLabels,
                datasets: [
                  {
                    label: "Asignaciones",
                    data: barData,
                    backgroundColor: "#6366f1"
                  }
                ]
              }}
              options={{
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Reemplazos por Tipo</h3>
          {pieLabels.length === 0 ? (
            <p className="text-gray-500">No hay datos.</p>
          ) : (
            <div className="max-w-xs mx-auto">
              <Pie
                data={{
                  labels: pieLabels,
                  datasets: [
                    {
                      data: pieData,
                      backgroundColor: [
                        "#6366f1",
                        "#f97316",
                        "#22c55e",
                        "#eab308",
                        "#3b82f6",
                        "#ec4899",
                        "#14b8a6"
                      ]
                    }
                  ]
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-xl font-semibold mb-4">
          Top 5 Participantes más Asignados
        </h3>
        {topParticipants.length === 0 ? (
          <p className="text-gray-500">No hay datos.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {topParticipants.map(([name, count]) => (
              <li key={name} className="flex justify-between py-2">
                <span className="text-gray-800 dark:text-gray-100">{name}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
