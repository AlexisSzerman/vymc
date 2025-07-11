


const AssignmentSuggestions = ({
  suggestions,
  setSelectedParticipantId,
  setSecondSelectedParticipantId,
  title,
  type, 
}) => {
  // Determina las clases de color de fondo y borde según el tipo de sugerencia
  const bgColorClass =
    type === "general"
      ? "bg-blue-900 border-blue-600 text-blue-100"
      : type === "titular"
      ? "bg-indigo-700 border-indigo-400 text-indigo-100"
      : "bg-gray-700 border-gray-500 text-pink-100";

  // Determina las clases de color del botón según el tipo de sugerencia
  const buttonColorClass =
    type === "general"
      ? "bg-blue-600 hover:bg-blue-700"
      : type === "titular"
      ? "bg-indigo-600 hover:bg-indigo-900"
      : "bg-gray-500 hover:bg-gray-900";

  // Función para manejar la selección de un participante desde las sugerencias
  const handleSelect = (participantId) => {
    // Si el tipo es 'ayudante', actualiza el segundo participante, de lo contrario, el principal
    if (type === "ayudante") {
      setSecondSelectedParticipantId(participantId);
    } else {
      setSelectedParticipantId(participantId);
    }
  };

  return (
    <div className={`mt-4 border p-4 rounded mb-4 ${bgColorClass}`}>
      <p className="font-semibold mb-2">{title}</p>
      <ul className="space-y-1">
        {suggestions.map((p) => (
          <li key={p.id} className="flex justify-between items-center">
            <span>
              {p.name} (
              {p.diasSinAsignacion === Infinity
                ? "nunca tuvo" 
                : `${p.diasSinAsignacion} días`}
              )
            </span>
            <button
              onClick={() => handleSelect(p.id)}
              className={`ml-2 px-3 py-1 text-white rounded text-sm ${buttonColorClass}`}
            >
              Seleccionar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssignmentSuggestions;
