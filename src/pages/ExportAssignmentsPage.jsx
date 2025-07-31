import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getMeetingWeekDates, formatDateAr } from "../utils/helpers";
import { ArrowDownFromLine, ChevronLeft, ChevronRight } from "lucide-react";
import AssignmentCard from "../components/AssignmentCard";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";

const appId = "default-app-id";

const excludedParticipants = ["A Confirmar", "Presidente"];
const excludedTypes = ["cancion"];

const ExportAssignmentsPage = ({ db }) => {
  const [assignments, setAssignments] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const { startOfWeek, endOfWeek } = getMeetingWeekDates(
    new Date(),
    weekOffset
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const formattedStartDate = formatDateAr(
    startOfWeek.toISOString().slice(0, 10)
  );
  const formattedEndDate = formatDateAr(endOfWeek.toISOString().slice(0, 10));

  const hiddenCardsRef = useRef();

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

      // Filtrar y excluir participantes y tipos directamente acá
      const filtered = fetched
        .filter((a) => {
          const [year, month, day] = a.date.split("-").map(Number);
          const date = new Date(year, month - 1, day);

          const isInWeek =
            (a.published === undefined || a.published === true) &&
            date >= startOfWeek &&
            date <= endOfWeek;

          const notExcludedParticipant = !excludedParticipants.includes(
            a.participantName
          );
          const notExcludedType = !excludedTypes.includes(
            a.type?.toLowerCase()
          );

          return isInWeek && notExcludedParticipant && notExcludedType;
        })
        .sort((a, b) => {
          // Si alguno no tiene orden, poner al final
          if (a.orden === undefined) return 1;
          if (b.orden === undefined) return -1;
          return a.orden - b.orden;
        });

      setAssignments(filtered);
    });

    return () => unsubscribe();
  }, [db, weekOffset]);

  const handleDownloadAll = async () => {
    if (!hiddenCardsRef.current) return;
    setIsDownloading(true); // comienza carga

    const zip = new JSZip();
    const cards = Array.from(hiddenCardsRef.current.children);

    const firstAssignmentDate = assignments[0]?.date || "sin_fecha";

    for (let i = 0; i < cards.length; i++) {
      const assignment = assignments[i];
      const card = cards[i];
      const canvas = await html2canvas(card, { scale: 2 });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92); // Ver punto 3
      const imgBlob = await (await fetch(dataUrl)).blob();

      const cleanName = assignment.participantName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "_");

      const fileName = `Asignacion_${cleanName}_${assignment.date}.jpg`;
      zip.file(fileName, imgBlob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Asignaciones_Semana_${firstAssignmentDate}.zip`);

    setIsDownloading(false); // termina carga
  };

  return (
    <div className="space-y-6 mb-20">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
        <ArrowDownFromLine className="w-6 h-6" /> Exportar Asignaciones
      </h2>

      <div className="flex justify-center mt-4 px-2">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-blue-300 rounded overflow-hidden text-sm sm:text-base font-medium shadow-inner divide-x divide-gray-300 dark:divide-gray-600 w-full max-w-md">
          {/* Botón anterior */}
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="flex items-center justify-center w-12 sm:w-12 h-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={3} />
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
        <p className="flex justify-center mt-4">
          No hay asignaciones para esta semana.
        </p>
      ) : (
        <>
          <div className="flex justify-center">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded transition flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Generando ZIP...
                </>
              ) : (
                "Descargar todas en ZIP"
              )}
            </button>
          </div>

          {/* Render oculto para generación de imágenes */}
          <div
            ref={hiddenCardsRef}
            style={{
              position: "fixed",
              top: "-9999px",
              left: "-9999px",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                hideDownloadButton={true}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a) => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportAssignmentsPage;
