//hooks/useAssignmentSuggestions.js

import React from "react";
import { calcularDiasDesde } from "../utils/helpers"; // Importa la función de ayuda

const useAssignmentSuggestions = (
  meetingDate,
  selectedType,
  participants,
  allAssignments,
  selectedParticipantId,
  secondSelectedParticipantId
) => {
  // Historial del participante principal seleccionado
  const selectedParticipantHistory = React.useMemo(() => {
    if (!selectedParticipantId) return [];
    return allAssignments
      .filter(
        (a) =>
          a.participantId === selectedParticipantId ||
          a.secondParticipantId === selectedParticipantId
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5); // Muestra las últimas 5 asignaciones
  }, [allAssignments, selectedParticipantId]);

  // Historial del segundo participante seleccionado (para demostraciones)
  const secondSelectedParticipantHistory = React.useMemo(() => {
    if (!secondSelectedParticipantId) return [];
    return allAssignments
      .filter(
        (a) =>
          a.participantId === secondSelectedParticipantId ||
          a.secondParticipantId === secondSelectedParticipantId
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5); // Muestra las últimas 5 asignaciones
  }, [allAssignments, secondSelectedParticipantId]);

  // Verifica si la dupla (para demostraciones) ya ha participado junta
  const duplaRepetida = React.useMemo(() => {
    if (selectedType !== "demostracion" || !selectedParticipantId || !secondSelectedParticipantId) {
      return null;
    }
    return allAssignments.find(
      (a) =>
        a.type === "demostracion" &&
        ((a.participantId === selectedParticipantId &&
          a.secondParticipantId === secondSelectedParticipantId) ||
          (a.participantId === secondSelectedParticipantId &&
            a.secondParticipantId === selectedParticipantId))
    );
  }, [allAssignments, selectedType, selectedParticipantId, secondSelectedParticipantId]);

  // Sugerencias generales para tipos de asignación que no son demostración
  const sugerenciasGenerales = React.useMemo(() => {
    if (!meetingDate || !selectedType || selectedType === "demostracion")
      return [];

    return participants
      .filter((p) => p.enabledAssignments?.includes(selectedType))
      .map((p) => {
        const historial = allAssignments
          .filter(
            (a) =>
              a.type === selectedType &&
              (a.participantId === p.id || a.secondParticipantId === p.id)
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const ultima = historial[0]?.date || null;
        const dias = calcularDiasDesde(meetingDate, ultima); // Calcula días desde la última asignación

        return { ...p, diasSinAsignacion: dias };
      })
      .sort((a, b) => b.diasSinAsignacion - a.diasSinAsignacion) // Ordena por días sin asignación (descendente)
      .slice(0, 5); // Muestra las 5 principales sugerencias
  }, [meetingDate, selectedType, participants, allAssignments]);

  // Sugerencias para titulares de demostración
  const sugerenciasTitularesDemostracion = React.useMemo(() => {
    if (!meetingDate || selectedType !== "demostracion") return [];

    return participants
      .filter((p) => p.enabledAssignments?.includes("demostracion"))
      .map((p) => {
        const historial = allAssignments
          .filter((a) => a.type === "demostracion" && a.participantId === p.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const ultima = historial[0]?.date || null;
        const dias = calcularDiasDesde(meetingDate, ultima);

        return { ...p, diasSinAsignacion: dias };
      })
      .sort((a, b) => b.diasSinAsignacion - a.diasSinAsignacion)
      .slice(0, 5);
  }, [meetingDate, selectedType, participants, allAssignments]);

  // Sugerencias para ayudantes de demostración
  const sugerenciasAyudantesDemostracion = React.useMemo(() => {
    if (!meetingDate || selectedType !== "demostracion") return [];

    return participants
      .filter(
        (p) =>
          p.enabledAssignments?.includes("demostracion") ||
          p.enabledAssignments?.includes("ayudante")
      )
      .map((p) => {
        const historial = allAssignments
          .filter(
            (a) => a.type === "demostracion" && a.secondParticipantId === p.id
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const ultima = historial[0]?.date || null;
        const dias = calcularDiasDesde(meetingDate, ultima);

        return { ...p, diasSinAsignacion: dias };
      })
      .sort((a, b) => b.diasSinAsignacion - a.diasSinAsignacion)
      .slice(0, 5);
  }, [meetingDate, selectedType, participants, allAssignments]);

  return {
    selectedParticipantHistory,
    secondSelectedParticipantHistory,
    duplaRepetida,
    sugerenciasGenerales,
    sugerenciasTitularesDemostracion,
    sugerenciasAyudantesDemostracion,
  };
};

export default useAssignmentSuggestions;
