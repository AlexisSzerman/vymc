import React, { useState, useEffect } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import {
  getMeetingWeekDates,
  formatDateToYYYYMMDD,
  formatAssignmentType,
} from "../utils/helpers";

const appId = "default-app-id"; // Cambiar si es necesario

const PublicViewPage = ({ db, showMessage, setCurrentPage }) => {
  const [assignments, setAssignments] = useState([]);
  const [publicReminderMessage, setPublicReminderMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user && !user.isAnonymous);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;

    const assignmentsColRef = collection(
      db,
      `artifacts/${appId}/public/data/assignments`
    );
    const unsubscribeAssignments = onSnapshot(
      assignmentsColRef,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const { startOfWeek, endOfWeek } = getMeetingWeekDates(
          new Date(),
          weekOffset
        );

        const filtered = fetched
          .filter((assignment) => {
            const [year, month, day] = assignment.date.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            return date >= startOfWeek && date <= endOfWeek;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setAssignments(filtered);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching public assignments:", error);
        showMessage(`Error al cargar la vista pública: ${error.message}`);
        setLoading(false);
      }
    );

    const { startOfWeek: reminderWeekStart } = getMeetingWeekDates(
      new Date(),
      weekOffset
    );
    const reminderDocId = formatDateToYYYYMMDD(reminderWeekStart);
    const reminderDocRef = doc(
      db,
      `artifacts/${appId}/public/data/public_reminders`,
      reminderDocId
    );

    const unsubscribeReminder = onSnapshot(reminderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setPublicReminderMessage(docSnap.data().message || "");
      } else {
        setPublicReminderMessage("");
      }
    });

    return () => {
      unsubscribeAssignments();
      unsubscribeReminder();
    };
  }, [db, showMessage, weekOffset]);

  const handleNextWeek = () => setWeekOffset((prev) => prev + 1);
  const handlePreviousWeek = () => {
    setWeekOffset((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const { startOfWeek, endOfWeek } = getMeetingWeekDates(
    new Date(),
    weekOffset
  );
  const formattedStartDate = startOfWeek.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  });
  const formattedEndDate = endOfWeek.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        Cargando asignaciones...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-6 text-center">
        Programa Reunión Vida y Ministerio Cristiano
      </h2>

      {publicReminderMessage && (
        <div className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg shadow-md border border-yellow-300 dark:border-yellow-700 text-center">
          <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-100">
            ¡RECORDATORIO!
          </p>
          <p className="text-gray-800 dark:text-gray-200 mt-2">
            {publicReminderMessage}
          </p>
        </div>
      )}

      <div className="flex justify-center items-center space-x-4">
        <button
          onClick={handlePreviousWeek}
          disabled={weekOffset === 0}
          className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ease-in-out transform ${
            weekOffset === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:scale-105"
          }`}
        >
          Semana Anterior
        </button>

        <span className="text-lg font-bold text-gray-800 dark:text-white">
          Semana del {formattedStartDate} - {formattedEndDate}
        </span>

        <button
          onClick={handleNextWeek}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          Semana Siguiente
        </button>
      </div>

      {assignments.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400 py-4">
          No hay asignaciones programadas para la semana seleccionada.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100 dark:border-blue-700">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="py-4">
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {new Date(assignment.date).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                <span>{formatAssignmentType(assignment.type)}</span>: {assignment.title}
              </p>
              <p className="text-md text-indigo-600 dark:text-indigo-400 font-bold">
                {assignment.participantName && (
                  <>Asignado a: {assignment.participantName}</>
                )}
                {assignment.type === "demostracion" &&
                  assignment.secondParticipantName && (
                    <> y {assignment.secondParticipantName}</>
                  )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {typeof setCurrentPage === "function" && (
        <div className="text-center mt-10">
          {isAuthenticated ? (
            <button
              onClick={() => {
                const auth = getAuth();
                signOut(auth).then(() => {
                  setCurrentPage("login");
                });
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-full shadow-md transition"
            >
              🚪 Cerrar Sesión
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage("login")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-full shadow-md transition"
            >
              🔐 Iniciar Sesión
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicViewPage;
