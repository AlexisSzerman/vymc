import React, { useState, useEffect } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import {
  getMeetingWeekDates,
  formatDateToYYYYMMDD,
  formatAssignmentType,
} from "../utils/helpers";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Loader from "../components/Loader";

const appId = "default-app-id";

const PublicViewPage = ({ db, showMessage }) => {
  const [assignments, setAssignments] = useState([]);
  const [publicReminderMessage, setPublicReminderMessage] = useState("");
  const [reminderType, setReminderType] = useState(""); // <--- Add this line
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

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
            if (assignment.published === false) return false;

            const [year, month, day] = assignment.date.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            return date >= startOfWeek && date <= endOfWeek;
          })
          .sort((a, b) => {
            const ordenA = a.orden ?? 999;
            const ordenB = b.orden ?? 999;
            return ordenA - ordenB;
          });

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
        const data = docSnap.data();
        setPublicReminderMessage(data.message || "");
        setReminderType(data.type || "");
      } else {
        setPublicReminderMessage("");
        setReminderType("");
      }
    });

    return () => {
      unsubscribeAssignments();
      unsubscribeReminder();
    };
  }, [db, showMessage, weekOffset]); // Also add reminderType to the dependency array if it were used in the effect to trigger re-runs, but in this case, it's only set, not used to determine the effect's behavior.

   const getIconClass = (type) => {
    switch (type) {
      case "Asamblea de Distrito":
        return "jw-icon jw-icon-001";
      case "Asamblea de Circuito":
        return "jw-icon jw-icon-023";
      case "Visita del Superintendente":
        return "jw-icon jw-icon-047";
      case "Visita Especial":
        return "jw-icon jw-icon-195";
      default:
        return "";
    }
  };


  const { startOfWeek, endOfWeek } = getMeetingWeekDates(
    new Date(),
    weekOffset
  );
  const formattedStartDate = startOfWeek.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
  const formattedEndDate = endOfWeek.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return <Loader />;
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
  {reminderType && (
    <div className="flex justify-center mt-2"> {/* New div for centering the icon */}
      <span className={`${getIconClass(reminderType)} text-4xl`} /> {/* Increased icon size for better visibility */}
    </div>
  )}
  <p className="text-gray-800 dark:text-gray-200 mt-2">
    {publicReminderMessage}
  </p>
</div>
      )}


      <div className="flex justify-center mt-4 px-2">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-blue-300 rounded overflow-hidden text-sm sm:text-base font-medium shadow-inner divide-x divide-gray-300 dark:divide-gray-600 w-full max-w-md">
          {/* Botón anterior */}
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="flex items-center justify-center w-12 sm:w-12 h-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ChevronLeft  className="w-7 h-7" strokeWidth={3} />
          </button>

          {/* Texto de la semana */}
          <div className="flex-1 px-4 py-2 text-center whitespace-nowrap">
            <span className="block">
              {weekOffset === 0 ? "Esta semana:" : "Semana del:"}
            </span>
            <span className="block font-semibold">
              {formattedStartDate} - {formattedEndDate}
            </span>
          </div>

          {/* Botón siguiente */}
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="flex items-center justify-center w-12 sm:w-12 h-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ChevronRight className="w-7 h-7" strokeWidth={3} />
          </button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400 py-4">
          No hay asignaciones programadas para la semana seleccionada.
        </p>
      ) : (
        (() => {
          const SECTION_MAP = {
            tesoros: "tesoros",
            "perlas-escondidas": "tesoros",
            "lectura-biblia": "tesoros",
            demostracion: "maestros",
            discurso: "maestros",
            "nuestra-vida-cristiana": "vida",
            "conduccion-estudio-biblico": "vida",
            "lectura-libro": "vida",
            necesidades: "vida",
          };

          const shownSections = new Set();

          return (
            <ul className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100 dark:border-blue-700">
              {assignments.map((assignment) => {
                const section = SECTION_MAP[assignment.type];
                let banner = null;

                if (section && !shownSections.has(section)) {
                  shownSections.add(section);

                  if (section === "tesoros") {
                    banner = (
                      <div className="flex items-center gap-2 bg-teal-100 dark:bg-teal-700 text-teal-800 dark:text-teal-100 px-4 py-2 rounded-md my-4">
                       {/* <Gem className="w-5 h-5" /> */}
                       <span className="jw-icon jw-icon-092 text-2xl leading-none"></span>
                        <span className="font-semibold">
                          Tesoros de la Biblia
                        </span>
                      </div>
                    );
                  } else if (section === "maestros") {
                    banner = (
                      <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 px-4 py-2 rounded-md my-4">
                       {/* <Wheat className="w-5 h-5" /> */}
                       <span className="jw-icon jw-icon-236 text-2xl leading-none"></span>
                        <span className="font-semibold">
                          Seamos Mejores Maestros
                        </span>
                      </div>
                    );
                  } else if (section === "vida") {
                    banner = (
                      <div className="flex items-center gap-2 bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100 px-4 py-2 rounded-md my-4">
                        {/* <Users className="w-5 h-5" /> */}
                        <span className="jw-icon jw-icon-187 text-2xl leading-none" />
                        <span className="font-semibold">
                          Nuestra Vida Cristiana
                        </span>
                      </div>
                    );
                  }
                }

                return (
                  <React.Fragment key={assignment.id}>
                    {banner}
                    <li className="py-4">
                      <p className="text-lg text-gray-700 dark:text-gray-300">
                        <span className="text-lg text-gray-900 dark:text-white font-bold">
                          {formatAssignmentType(assignment.type)}
                        </span>
                        {assignment.title && <>: {assignment.title}</>}
                      </p>
                      <p className="text-md text-indigo-600 dark:text-indigo-400 font-bold">
                        {assignment.participantName && (
                          <>Asignado a: {assignment.participantName}</>
                        )}
                        {assignment.secondParticipantName && (
                          <> y {assignment.secondParticipantName}</>
                        )}
                      </p>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          );
        })()
      )}
    </div>
  );
};

export default PublicViewPage;