import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getMeetingWeekDates } from "../utils/helpers";
import { ArrowDownFromLine } from "lucide-react";
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

    const notExcludedParticipant = !excludedParticipants.includes(a.participantName);
    const notExcludedType = !excludedTypes.includes(a.type?.toLowerCase());

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

    const zip = new JSZip();
    const cards = Array.from(hiddenCardsRef.current.children);

    const firstAssignmentDate = assignments[0]?.date || "sin_fecha";

    for (let i = 0; i < cards.length; i++) {
      const assignment = assignments[i];

      const card = cards[i];
      const canvas = await html2canvas(card, { scale: 2 });
      const dataUrl = canvas.toDataURL("image/png");

      const imgBlob = await (await fetch(dataUrl)).blob();
      const fileName = `Asignacion_${assignment.participantName}_${assignment.date}.png`;

      zip.file(fileName, imgBlob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Asignaciones_Semana_${firstAssignmentDate}.zip`);
  };

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
        <>
<div className="flex justify-center">
  <button
    onClick={handleDownloadAll}
    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded transition"
  >
    Descargar todas en ZIP
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
