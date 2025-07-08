import { formatAssignmentType, formatDateAr } from "../utils/helpers"; 

const ParticipantHistory = ({
  participantHistory,
  selectedParticipantId,
  participants,
  replacements,
  title,
}) => {
  const participantName =
    participants.find((p) => p.id === selectedParticipantId)?.name || "—";

  return (
    <div className="mt-4 bg-gray-800 border border-gray-700 p-4 rounded text-sm">
      <p className="font-semibold text-gray-200 mb-2">
        {title} {participantName}:
      </p>

      <ul className="list-disc pl-5 text-gray-300 mb-3">
        {participantHistory.map((a, i) => {
          const esTitular = a.participantId === selectedParticipantId;
          const esAyudante = a.secondParticipantId === selectedParticipantId;
          return (
            <li key={i}>
              {formatDateAr(a.date)} - {formatAssignmentType(a.type)}:
              {esTitular && (
                <>
                  {" "}
                  {a.title}
                  {a.secondParticipantName &&
                    ` - con ${a.secondParticipantName}`}
                </>
              )}
              {esAyudante && (
                <>
                  {" "}
                  {a.title} (como ayudante de {a.participantName})
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="text-gray-400">
        Reemplazos recibidos:{" "}
        {replacements.filter((r) => r.oldParticipantId === selectedParticipantId).length}{" "}
        · Reemplazos realizados:{" "}
        {replacements.filter((r) => r.newParticipantId === selectedParticipantId).length}
      </div>
    </div>
  );
};

export default ParticipantHistory;
