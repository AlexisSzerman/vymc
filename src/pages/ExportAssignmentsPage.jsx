import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getMeetingWeekDates } from "../utils/helpers";
import { ArrowDownFromLine } from "lucide-react";
import AssignmentCard from "../components/AssignmentCard";

const appId = "default-app-id";

const ExportAssignmentsPage = ({ db }) => {
  const [assignments, setAssignments] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!db) return;

    const assignmentsRef = collection(
      db,
      `artifacts/${appId}/public/data/assignments`
    );
    const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const { startOfWeek, endOfWeek } = getMeetingWeekDates(
        new Date(),
        weekOffset
      );

      const filtered = fetched.filter((a) => {
        const [year, month, day] = a.date.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return (
          (a.published === undefined || a.published === true) && // 👈 Solo los que están publicados o sin published
          date >= startOfWeek &&
          date <= endOfWeek
        );
      });

      setAssignments(filtered);
    });

    return () => unsubscribe();
  }, [db, weekOffset]);

  return (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
      <ArrowDownFromLine className="w-6 h-6" /> Exportar Asignaciones
    </h2>

    <div className="flex justify-evenly gap-2">
      <button
        onClick={() => setWeekOffset(weekOffset - 1)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
      >
        Semana anterior
      </button>
      <button
        onClick={() => setWeekOffset(weekOffset + 1)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
      >
        Semana siguiente
      </button>
    </div>

    {assignments.length === 0 ? (
      <p>No hay asignaciones para esta semana.</p>
    ) : (
      <div className="flex justify-center"> {/* Agregado este div con flex y justify-center */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      </div>
    )}
  </div>
);
};

export default ExportAssignmentsPage;
