import ParticipantHistory from "./ParticipantHistory";
import AssignmentSuggestions from "../components/AssignmentSuggestions";
import { formatDateAr } from "../utils/helpers";

const AssignmentForm = ({
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
  handleSave,
  resetForm,
  participants,
  selectedParticipantHistory,
  secondSelectedParticipantHistory,
  duplaRepetida,
  sugerenciasGenerales,
  sugerenciasTitularesDemostracion,
  sugerenciasAyudantesDemostracion,
  replacements,
}) => {
  const isAssembly = [
    "asamblea-circuito",
    "asamblea-regional",
    "cancion",
  ].includes(selectedType);

  return (
    <form
      onSubmit={handleSave}
      className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tipo de Asignación */}
        <div>
          <label className="block text-gray-300 mb-1">Tipo</label>
          <select
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Selecciona</option>
            <option value="presidencia">Presidencia</option>
            <option value="cancion">Canción</option>
            <option value="oracion-inicial">Oración Inicial</option>
            <option value="oracion-final">Oración Final</option>
            <option value="tesoros">Tesoros de la Biblia</option>
            <option value="perlas-escondidas">
              Busquemos Perlas Escondidas
            </option>
            <option value="demostracion">Demostración</option>
            <option value="discurso">Discurso</option>
            <option value="conduccion-estudio-biblico">
              Conducción Estudio Bíblico
            </option>
            <option value="nuestra-vida-cristiana">
              Nuestra Vida Cristiana
            </option>
            <option value="necesidades">Necesidades de la congregación</option>
            <option value="lectura-biblia">Lectura Bíblica</option>
            <option value="lectura-libro">Lectura del libro</option>
            <option value="asamblea-circuito">Asamblea Circuito</option>
            <option value="asamblea-regional">Asamblea Regional</option>
            <option value="visita">Visita Superintendente y esposa</option>
          </select>
        </div>

        {/* Título de la Asignación */}
        <div>
          <label className="block text-gray-300 mb-1">Título</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
          />
        </div>

        {/* Orden de la Asignación */}
        <div>
          <label className="block text-gray-300 mb-1">Orden</label>
          <input
            type="number"
            min="0"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
            value={assignmentOrder}
            onChange={(e) => setAssignmentOrder(e.target.value)}
          />
        </div>

        {/* Selector de Participante Titular */}
<div>
  <label className="block text-gray-300 mb-1">Titular</label>
  <select
    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
    value={selectedParticipantId}
    onChange={(e) => setSelectedParticipantId(e.target.value)}
    disabled={isAssembly}
  >
    <option value="">Selecciona</option>
    {participants
      .filter((p) => p.enabledAssignments?.includes(selectedType))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
  </select>
</div>


{/* Selector de Ayudante (solo para demostraciones) */}
{selectedType === "demostracion" && (
  <div>
    <label className="block text-gray-300 mb-1">Ayudante</label>
    <select
      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
      value={secondSelectedParticipantId}
      onChange={(e) => setSecondSelectedParticipantId(e.target.value)}
    >
      <option value="">Selecciona</option>
      {participants
        .filter(
          (p) =>
            p.enabledAssignments?.includes("demostracion") ||
            p.enabledAssignments?.includes("ayudante")
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
    </select>
  </div>
)}

      </div>

      {/* Historial del participante principal */}
      {selectedParticipantHistory.length > 0 && (
        <ParticipantHistory
          participantHistory={selectedParticipantHistory}
          selectedParticipantId={selectedParticipantId}
          participants={participants}
          replacements={replacements}
          title="Últimas asignaciones de"
        />
      )}

      {/* Historial del segundo participante (para demostraciones) */}
      {secondSelectedParticipantHistory.length > 0 && (
        <ParticipantHistory
          participantHistory={secondSelectedParticipantHistory}
          selectedParticipantId={secondSelectedParticipantId} // Pasa el ID del segundo participante
          participants={participants}
          replacements={replacements}
          title="Últimas asignaciones de"
        />
      )}

      {/* Advertencia de dupla repetida */}
      {duplaRepetida && (
        <div className="mt-4 bg-red-900 border border-red-700 p-3 rounded text-red-200">
          ¡Advertencia! Esta dupla ya participó junta el{" "}
          {formatDateAr(duplaRepetida.date)}.
        </div>
      )}

      {(sugerenciasGenerales.length > 0 ||
        sugerenciasTitularesDemostracion.length > 0 ||
        sugerenciasAyudantesDemostracion.length > 0) && (
        <AssignmentSuggestions
          generalSuggestions={sugerenciasGenerales}
          titularSuggestions={sugerenciasTitularesDemostracion}
          ayudanteSuggestions={sugerenciasAyudantesDemostracion}
          setSelectedParticipantId={setSelectedParticipantId}
          setSecondSelectedParticipantId={setSecondSelectedParticipantId}
        />
      )}

      {/* Botones de acción del formulario */}
      <div className="flex justify-end gap-2">
        {editingAssignment && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-900 text-white rounded transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-900 text-white rounded transition"
        >
          {editingAssignment ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </form>
  );
};

export default AssignmentForm;
