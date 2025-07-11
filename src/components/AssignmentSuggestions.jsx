import React, { useState } from "react";

const AssignmentSuggestions = ({
  generalSuggestions = [],
  titularSuggestions = [],
  ayudanteSuggestions = [],
  setSelectedParticipantId,
  setSecondSelectedParticipantId,
}) => {
  const [selectedTitular, setSelectedTitular] = useState(null);
  const [selectedAyudante, setSelectedAyudante] = useState(null);
  const [confirmado, setConfirmado] = useState(false);

  const handleConfirm = () => {
    if (selectedTitular) setSelectedParticipantId(selectedTitular);
    if (selectedAyudante) setSecondSelectedParticipantId(selectedAyudante);
    setConfirmado(true);
    setTimeout(() => setConfirmado(false), 3000); // Feedback temporal
  };

  const renderSuggestions = (suggestions, selected, setSelected, label) => (
    <div className="mb-4">
      <p className="font-semibold mb-1">{label}</p>
      <div className="max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-600">
        <ul className="space-y-1">
          {suggestions.map((p) => (
            <li key={p.id} className="flex items-center space-x-2">
              <input
                type="radio"
                name={label}
                value={p.id}
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
                className="accent-blue-600"
              />
              <label className="flex-1 text-sm text-gray-200">
                {p.name} (
                {p.diasSinAsignacion === Infinity
                  ? "nunca tuvo"
                  : `${p.diasSinAsignacion} días`}
                )
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (
    generalSuggestions.length === 0 &&
    titularSuggestions.length === 0 &&
    ayudanteSuggestions.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-4 border border-blue-800 bg-blue-950 p-4 rounded text-blue-100 shadow-md">
      <p className="text-lg font-bold mb-2">Sugerencias</p>
      {generalSuggestions.length > 0 &&
        renderSuggestions(generalSuggestions, selectedTitular, setSelectedTitular, "Titular")}
      {titularSuggestions.length > 0 &&
        renderSuggestions(titularSuggestions, selectedTitular, setSelectedTitular, "Titular")}
      {ayudanteSuggestions.length > 0 &&
        renderSuggestions(ayudanteSuggestions, selectedAyudante, setSelectedAyudante, "Ayudante")}
      <div className="mt-4 flex justify-between items-center">
        {confirmado && (
          <p className="text-green-400 text-sm">Selección confirmada</p>
        )}
        <button
          onClick={handleConfirm}
          className="ml-auto px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm"
        >
          Confirmar selección
        </button>
      </div>
    </div>
  );
};

export default AssignmentSuggestions;


