import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { ChartSpline } from "lucide-react";
import { formatAssignmentType } from "../utils/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const appId = "default-app-id";

const EXCLUDED_PARTICIPANTS = ["A Confirmar", "Presidente", "José Gularte"];
const EXCLUDED_ASSIGNMENT_TYPES = ["cancion", "visita"];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DashboardPage = ({ db, showMessage, authUser }) => {
  const [assignments, setAssignments] = useState([]);
  const [replacements, setReplacements] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [showAllReplacementsMade, setShowAllReplacementsMade] = useState(false);
  const [showAllReplacementsReceived, setShowAllReplacementsReceived] = useState(false);

  // Nuevo sistema de filtro
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonths, setSelectedMonths] = useState(new Set());

  useEffect(() => {
    if (!db || !authUser) return;

    const fetchData = async () => {
      try {
        const [assignmentsSnap, replacementsSnap, participantsSnap] =
          await Promise.all([
            getDocs(collection(db, `artifacts/${appId}/public/data/assignments`)),
            getDocs(collection(db, `artifacts/${appId}/public/data/replacements`)),
            getDocs(collection(db, `artifacts/${appId}/public/data/participants`))
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

  // Años disponibles
  const availableYears = [...new Set(
    assignments.filter((a) => a.date).map((a) => a.date.slice(0, 4))
  )].sort();

  // Meses disponibles para el año seleccionado
  const availableMonthsForYear = selectedYear === "all"
    ? []
    : [...new Set(
        assignments
          .filter((a) => a.date && a.date.startsWith(selectedYear))
          .map((a) => parseInt(a.date.slice(5, 7)))
      )].sort((a, b) => a - b);

  // Lógica de filtro de fecha
  const matchesDateFilter = (date) => {
    if (!date) return false;
    if (selectedYear === "all") return true;
    const [y, m] = date.split("-");
    if (y !== selectedYear) return false;
    if (selectedMonths.size === 0) return true;
    return selectedMonths.has(parseInt(m));
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonths(new Set());
  };

  const handleMonthToggle = (month) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  // Filtro de asignaciones y reemplazos para el resto de métricas
  const filteredAssignments = assignments.filter(
    (a) =>
      !EXCLUDED_ASSIGNMENT_TYPES.includes(a.type) &&
      !EXCLUDED_PARTICIPANTS.includes(a.participantName) &&
      !EXCLUDED_PARTICIPANTS.includes(a.secondParticipantName) &&
      matchesDateFilter(a.date)
  );

  const filteredReplacements = replacements.filter(
    (r) =>
      !EXCLUDED_PARTICIPANTS.includes(r.oldParticipantName) &&
      !EXCLUDED_PARTICIPANTS.includes(r.newParticipantName) &&
      matchesDateFilter(r.date)
  );

  // Participantes totales (sin excluidos)
  const filteredParticipants = participants.filter(
    (p) => !EXCLUDED_PARTICIPANTS.includes(p.name)
  );

  // Top Asignados (con filtro de fecha)
  const participantCounts = {};
  assignments.forEach((a) => {
    if (
      a.date &&
      matchesDateFilter(a.date) &&
      !EXCLUDED_ASSIGNMENT_TYPES.includes(a.type) &&
      a.participantName &&
      a.participantName.trim() !== "" &&
      !EXCLUDED_PARTICIPANTS.includes(a.participantName)
    ) {
      participantCounts[a.participantName] =
        (participantCounts[a.participantName] || 0) + 1;
    }
    if (
      a.date &&
      matchesDateFilter(a.date) &&
      !EXCLUDED_ASSIGNMENT_TYPES.includes(a.type) &&
      a.secondParticipantName &&
      a.secondParticipantName.trim() !== "" &&
      !EXCLUDED_PARTICIPANTS.includes(a.secondParticipantName)
    ) {
      participantCounts[a.secondParticipantName] =
        (participantCounts[a.secondParticipantName] || 0) + 1;
    }
  });

  // Participantes activos all-time: todos los que tienen >= 1 asignación efectiva
  const allTimeParticipantCounts = {};
  assignments.forEach((a) => {
    if (
      !EXCLUDED_ASSIGNMENT_TYPES.includes(a.type) &&
      a.participantName &&
      a.participantName.trim() !== "" &&
      !EXCLUDED_PARTICIPANTS.includes(a.participantName)
    ) {
      allTimeParticipantCounts[a.participantName] =
        (allTimeParticipantCounts[a.participantName] || 0) + 1;
    }
    if (
      !EXCLUDED_ASSIGNMENT_TYPES.includes(a.type) &&
      a.secondParticipantName &&
      a.secondParticipantName.trim() !== "" &&
      !EXCLUDED_PARTICIPANTS.includes(a.secondParticipantName)
    ) {
      allTimeParticipantCounts[a.secondParticipantName] =
        (allTimeParticipantCounts[a.secondParticipantName] || 0) + 1;
    }
  });

  const activeParticipantsCount = Object.values(allTimeParticipantCounts).filter((c) => c >= 1).length;

  const topParticipantsFull = Object.entries(participantCounts)
    .sort((a, b) => b[1] - a[1]);

  const participantsToShow = showAllParticipants
    ? topParticipantsFull
    : topParticipantsFull.slice(0, 5);

  // Reemplazos hechos y recibidos
  const replacementsMade = {};
  const replacementsReceived = {};
  filteredReplacements.forEach((r) => {
    replacementsMade[r.newParticipantName] = (replacementsMade[r.newParticipantName] || 0) + 1;
    replacementsReceived[r.oldParticipantName] = (replacementsReceived[r.oldParticipantName] || 0) + 1;
  });

  const replacementsMadeSorted = Object.entries(replacementsMade).sort((a, b) => b[1] - a[1]);
  const replacementsReceivedSorted = Object.entries(replacementsReceived).sort((a, b) => b[1] - a[1]);

  const displayedReplacementsMade = showAllReplacementsMade
    ? replacementsMadeSorted
    : replacementsMadeSorted.slice(0, 5);

  const displayedReplacementsReceived = showAllReplacementsReceived
    ? replacementsReceivedSorted
    : replacementsReceivedSorted.slice(0, 5);

  // % de participantes activos
  const activeParticipantsPercentage = filteredParticipants.length > 0
    ? ((activeParticipantsCount / filteredParticipants.length) * 100).toFixed(1) + "%"
    : "0%";

  // Datos para el gráfico de reemplazos por tipo
  const replacementsPerType = {};
  filteredReplacements.forEach((r) => {
    const key = r.type || "Desconocido";
    replacementsPerType[key] = (replacementsPerType[key] || 0) + 1;
  });
  const pieLabels = Object.keys(replacementsPerType).map(key => formatAssignmentType(key));
  const pieData = Object.values(replacementsPerType);

  const pieOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            if (label) {
              const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
              const currentValue = context.raw;
              const percentage = ((currentValue / total) * 100).toFixed(1);
              return `${label}: ${currentValue} (${percentage}%)`;
            }
            return label;
          }
        }
      }
    }
  };

  const assignmentsPerReplacement = filteredReplacements.length > 0
    ? (filteredAssignments.length / filteredReplacements.length).toFixed(1)
    : "N/A";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-600 border-t-indigo-700 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-300 text-lg font-semibold">
          Cargando estadísticas...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
          <ChartSpline className="w-6 h-6" /> Panel de Estadísticas
        </h2>

        {/* Selector de año + checkboxes de meses */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 dark:text-gray-300 font-medium">Año:</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="all">Todos</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {selectedYear !== "all" && availableMonthsForYear.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {availableMonthsForYear.map((month) => (
                <button
                  key={month}
                  onClick={() => handleMonthToggle(month)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    selectedMonths.has(month)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400"
                  }`}
                >
                  {MONTH_NAMES[month - 1]}
                </button>
              ))}
              {selectedMonths.size > 0 && (
                <button
                  onClick={() => setSelectedMonths(new Set())}
                  className="px-3 py-1 rounded-full text-sm font-medium border border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas métricas */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Participantes activos / total</p>
          <p className="text-3xl font-bold text-indigo-600">
            {activeParticipantsCount}/{filteredParticipants.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">% de participantes activos</p>
          <p className="text-3xl font-bold text-indigo-600">
            {activeParticipantsPercentage}
          </p>
        </div>
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
              ? ((filteredReplacements.length / filteredAssignments.length) * 100).toFixed(1) + "%"
              : "0%"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Asignaciones por reemplazo</p>
          <p className="text-3xl font-bold text-indigo-600">
            {assignmentsPerReplacement}
          </p>
        </div>
      </div>

      {/* Top asignados y gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            Top Asignados
          </h3>
          {participantsToShow.length === 0 ? (
            <p className="text-gray-500">No hay datos.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {participantsToShow.map(([name, count]) => (
                <li key={name} className="flex justify-between py-2">
                  <span className="text-gray-800 dark:text-gray-100">{name}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {topParticipantsFull.length > 5 && (
            <button
              onClick={() => setShowAllParticipants(!showAllParticipants)}
              className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold underline"
            >
              {showAllParticipants ? "Mostrar menos" : "Mostrar más"}
            </button>
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
                options={pieOptions}
              />
            </div>
          )}
        </div>
      </div>

      {/* Top reemplazos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
          <h3 className="text-xl font-semibold mb-4">Top Reemplazos</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedReplacementsMade.map(([name, count]) => (
              <li key={name} className="flex justify-between py-2">
                <span className="text-gray-800 dark:text-gray-100">{name}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{count}</span>
              </li>
            ))}
          </ul>
          {replacementsMadeSorted.length > 5 && (
            <button
              onClick={() => setShowAllReplacementsMade(!showAllReplacementsMade)}
              className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold underline"
            >
              {showAllReplacementsMade ? "Mostrar menos" : "Mostrar más"}
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
          <h3 className="text-xl font-semibold mb-4">Top Reemplazados</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedReplacementsReceived.map(([name, count]) => (
              <li key={name} className="flex justify-between py-2">
                <span className="text-gray-800 dark:text-gray-100">{name}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{count}</span>
              </li>
            ))}
          </ul>
          {replacementsReceivedSorted.length > 5 && (
            <button
              onClick={() => setShowAllReplacementsReceived(!showAllReplacementsReceived)}
              className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold underline"
            >
              {showAllReplacementsReceived ? "Mostrar menos" : "Mostrar más"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;