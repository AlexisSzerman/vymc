import { doc, updateDoc } from "firebase/firestore";
import { formatAssignmentType, formatDateAr } from "../utils/helpers";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";

const appId = "default-app-id";

// Función para formatear la hora
const formatTime = (timeString) => {
  if (!timeString) return null;
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    // Formatear en formato de 12 horas (AM/PM)
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch {
    return timeString;
  }
};

const AssignmentList = ({
  currentAssignments,
  handleEdit,
  setAssignmentToDelete,
  db,
  showMessage,
}) => {
  // Función para publicar todas las asignaciones filtradas
  const handlePublishAll = async () => {
    if (!db) return;
    const assignmentsToPublish = currentAssignments.filter(
      (a) => a.published === false
    );
    if (assignmentsToPublish.length === 0) {
      showMessage("No hay asignaciones sin publicar en la vista actual.");
      return;
    }

    try {
      // Usar Promise.all para actualizar todas las asignaciones en paralelo
      const batchUpdates = assignmentsToPublish.map((a) =>
        updateDoc(doc(db, `artifacts/${appId}/public/data/assignments`, a.id), {
          published: true,
        })
      );
      await Promise.all(batchUpdates);
      showMessage("Todas las asignaciones filtradas se publicaron.");
    } catch (error) {
      console.error("Error al publicar todas las asignaciones:", error);
      showMessage(`Error al publicar: ${error.message}`);
    }
  };

  // Función para alternar el estado de publicación de una asignación individual
  const togglePublishStatus = async (assignmentId, currentStatus) => {
    if (!db) return;
    try {
      await updateDoc(
        doc(db, `artifacts/${appId}/public/data/assignments`, assignmentId),
        { published: !currentStatus }
      );
      showMessage(`Asignación ${!currentStatus ? "publicada" : "ocultada"}.`);
    } catch (error) {
      console.error("Error al cambiar estado de publicación:", error);
      showMessage(`Error al cambiar estado: ${error.message}`);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-indigo-300">
        Próximas Asignaciones
      </h3>

      {currentAssignments.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handlePublishAll}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-700 text-white rounded transition"
          >
            Publicar Todo
          </button>
        </div>
      )}

      {currentAssignments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No hay asignaciones que coincidan con los filtros.
        </p>
      ) : (
        currentAssignments.map((a) => (
          <div
            key={a.id}
            className="p-4 border border-gray-700 bg-gray-800 rounded flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 hover:bg-gray-700 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-semibold text-gray-200 truncate">
                  {formatDateAr(a.date)} - {formatAssignmentType(a.type)}
                </p>
                {/* Mostrar horario si existe */}
                {a.time && (
                  <span className="inline-block bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                    {formatTime(a.time)}
                  </span>
                )}
              </div>
              <p className="text-gray-300 break-words max-w-full">{a.title}</p>
              <p className="text-gray-300 truncate">
                {a.participantName}
                {a.secondParticipantName && ` y ${a.secondParticipantName}`}
              </p>
              <p className="text-gray-400 text-sm">Orden: {a.orden}</p>
            </div>

            <div className="flex w-full overflow-x-auto sm:overflow-visible sm:w-auto">
              <div className="flex flex-grow justify-end gap-2 pr-2 sm:pr-0">
                <button
                  onClick={() => handleEdit(a)}
                  className="flex-shrink-0 p-2 bg-orange-400 hover:bg-orange-700 text-white rounded transition"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => setAssignmentToDelete(a)}
                  className="flex-shrink-0 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded transition"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>

                {a.published === false ? (
                  <button
                    onClick={() => togglePublishStatus(a.id, a.published)}
                    className="flex-shrink-0 p-2 bg-emerald-500 hover:bg-emerald-700 text-white rounded transition"
                    title="Publicar en Programa Semanal"
                  >
                     <Eye size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => togglePublishStatus(a.id, a.published)}
                    className="flex-shrink-0 p-2 bg-slate-500 hover:bg-slate-700 text-white rounded transition"
                    title="Ocultar de Programa Semanal"
                  >
                    <EyeOff size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AssignmentList;