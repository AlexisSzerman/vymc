import React from "react";
import { ClipboardList } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog"; 
import AssignmentForm from "../components/AssignmentForm";
import AssignmentFilters from "../components/AssignmentFilters";
import AssignmentList from "../components/AssignmentList";
import useAssignmentsData from "../hooks/useAssignmentsData";
import useAssignmentForm from "../hooks/useAssignmentForm";
import useAssignmentFilters from "../hooks/useAssignmentFilters";
import useAssignmentSuggestions from "../hooks/useAssignmentSuggestions";
import useConfirmDialog from "../hooks/useConfirmDialog";

// Importar funciones de Firestore necesarias para handleDeleteConfirm
import { deleteDoc, doc } from "firebase/firestore";

const appId = "default-app-id";

const AssignmentsPage = ({ db, userId, showMessage }) => {
  // Hooks para manejar los datos de Firestore
  const { participants, allAssignments, replacements } = useAssignmentsData(db, userId, appId);

  // Hook para manejar el diálogo de confirmación
  const { confirmDialog, showConfirm, handleConfirmClose } = useConfirmDialog();

  // Hook para manejar el formulario de asignaciones
  const {
    meetingDate,
    setMeetingDate,
    selectedType,
    setSelectedType,
    assignmentTitle,
    setAssignmentTitle,
    selectedParticipantId,
    setSelectedParticipantId,
    secondSelectedParticipantId,
    setSecondSelectedParticipantId,
    assignmentOrder,
    setAssignmentOrder,
    editingAssignment,
    // setEditingAssignment, // <-- Eliminado de la desestructuración, ya que no se usa directamente aquí
    handleSave,
    resetForm,
    handleEdit,
  } = useAssignmentForm(db, userId, appId, showMessage, allAssignments, participants, showConfirm);

  // Hook para manejar los filtros de asignaciones
  const {
    filterDate,
    setFilterDate,
    filterName,
    setFilterName,
    currentAssignments,
    clearFilters,
  } = useAssignmentFilters(allAssignments);

  // Hook para manejar las sugerencias y el historial de participantes
  const {
    selectedParticipantHistory,
    secondSelectedParticipantHistory,
    duplaRepetida,
    sugerenciasGenerales,
    sugerenciasTitularesDemostracion,
    sugerenciasAyudantesDemostracion,
  } = useAssignmentSuggestions(
    meetingDate,
    selectedType,
    participants,
    allAssignments,
    selectedParticipantId,
    secondSelectedParticipantId
  );

  // Estado para la asignación a eliminar
  const [assignmentToDelete, setAssignmentToDelete] = React.useState(null);

  // Función para confirmar la eliminación de una asignación
  const handleDeleteConfirm = async () => {
    if (!db || !assignmentToDelete) return;
    try {
      await deleteDoc(
        doc(db, `artifacts/${appId}/public/data/assignments`, assignmentToDelete.id)
      );
      showMessage("Asignación eliminada.");
    } catch (error) {
      showMessage(`Error al eliminar: ${error.message}`);
    } finally {
      setAssignmentToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
        <ClipboardList className="w-6 h-6" /> Gestión de Asignaciones
      </h2>

      {/* Selector de fecha de reunión */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label className="text-indigo-200 font-semibold">
          Seleccionar fecha de nueva reunión:
        </label>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {meetingDate && (
        <AssignmentForm
          meetingDate={meetingDate}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          assignmentTitle={assignmentTitle}
          setAssignmentTitle={setAssignmentTitle}
          selectedParticipantId={selectedParticipantId}
          setSelectedParticipantId={setSelectedParticipantId}
          secondSelectedParticipantId={secondSelectedParticipantId}
          setSecondSelectedParticipantId={setSecondSelectedParticipantId}
          assignmentOrder={assignmentOrder}
          setAssignmentOrder={setAssignmentOrder}
          editingAssignment={editingAssignment}
          handleSave={handleSave}
          resetForm={resetForm}
          participants={participants}
          selectedParticipantHistory={selectedParticipantHistory}
          secondSelectedParticipantHistory={secondSelectedParticipantHistory}
          duplaRepetida={duplaRepetida}
          sugerenciasGenerales={sugerenciasGenerales}
          sugerenciasTitularesDemostracion={sugerenciasTitularesDemostracion}
          sugerenciasAyudantesDemostracion={sugerenciasAyudantesDemostracion}
          replacements={replacements}
        />
      )}

      <hr />

      {/* Sección de Filtros */}
      <AssignmentFilters
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterName={filterName}
        setFilterName={setFilterName}
        clearFilters={clearFilters}
      />

      {/* Listado de Asignaciones */}
      <AssignmentList
        currentAssignments={currentAssignments}
        handleEdit={handleEdit}
        setAssignmentToDelete={setAssignmentToDelete}
        db={db}
        appId={appId}
        showMessage={showMessage}
      />

      {/* ConfirmDialog para eliminación */}
      {assignmentToDelete && (
        <ConfirmDialog
          message="¿Eliminar esta asignación? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onCancel={() => setAssignmentToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* ConfirmDialog general */}
      {confirmDialog.visible && (
        <ConfirmDialog
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onCancel={() => handleConfirmClose(false)}
          onConfirm={() => handleConfirmClose(true)}
        />
      )}
    </div>
  );
};

export default AssignmentsPage;
