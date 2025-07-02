import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { CheckSquare, Square } from "lucide-react";

const AssignmentCard = ({ assignment }) => {
  const cardRef = useRef();
  const downloadBtnRef = useRef();

  // Opcional: Formatea el tipo de asignación en mayúscula inicial
  const formatAssignmentType = (type) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    // Ocultar el botón
    if (downloadBtnRef.current) {
      downloadBtnRef.current.classList.add("hidden");
    }

    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `Asignacion_${assignment.participantName}_${assignment.date}.png`;
    link.click();

    // Volver a mostrar el botón
    if (downloadBtnRef.current) {
      downloadBtnRef.current.classList.remove("hidden");
    }
  };

  return (
    <div
      ref={cardRef}
      className="border border-gray-900 w-[330px] p-4 bg-white text-black text-[13px] leading-tight space-y-2 font-sans"
    >
      <h2 className="font-bold text-center text-[13px] uppercase">
        ASIGNACIÓN PARA LA REUNIÓN VIDA Y MINISTERIO CRISTIANOS
      </h2>

      <p>
        <strong>Nombre:</strong> {assignment.participantName}
      </p>
      <p>
        <strong>Ayudante:</strong>{" "}
        {assignment.secondParticipantName || "-"}
      </p>
      <p>
        <strong>Fecha:</strong> {assignment.date}
      </p>
      <p>
        <strong>Intervención:</strong><br />
        {formatAssignmentType(assignment.type)} – {assignment.title}
      </p>

      <p className="mt-2">
        <strong>Se presentará en:</strong>
      </p>

      <div className="space-y-1 pl-1">
        <label className="flex items-center gap-1">
          <CheckSquare size={14} className="text-black" />
          <span>Sala principal</span>
        </label>
        <label className="flex items-center gap-1">
          <Square size={14} className="text-black" />
          <span>Sala auxiliar núm. 1</span>
        </label>
        <label className="flex items-center gap-1">
          <Square size={14} className="text-black" />
          <span>Sala auxiliar núm. 2</span>
        </label>
      </div>

      <p className="text-[11px] italic mt-2">
        Nota al estudiante: En la Guía de actividades encontrará la información que necesita para su intervención. Repase también las indicaciones que se describen en las Instrucciones para la reunión Vida y Ministerio Cristianos (S-38).
      </p>

      <p className="text-[10px] text-right mt-1">
        S-89-S 11/23
      </p>

      <button
        ref={downloadBtnRef}
        onClick={handleDownload}
        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1 rounded w-full"
      >
        Descargar imagen
      </button>
    </div>
  );
};

export default AssignmentCard;
