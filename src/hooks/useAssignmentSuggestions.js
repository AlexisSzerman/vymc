// hooks/useAssignmentSuggestions.js

import React from "react";
import { calcularDiasDesde } from "../utils/helpers"; 

const useAssignmentSuggestions = (
  meetingDate,
  selectedType,
  participants,
  allAssignments, // This should contain ALL historical assignments
  selectedParticipantId,
  secondSelectedParticipantId
) => {
  // Historial del participante principal seleccionado (last 5 assignments overall)
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

  // Helper function to calculate and sort suggestions, incorporating exclusion
  const getSortedSuggestions = (targetAssignmentType, isSecondParticipant = false) => {
    if (!meetingDate) return [];

    const suggestions = participants
      .filter((p) => {
        // Step 1: Check if participant is enabled for this assignment type/role
        const isEnabled = p.enabledAssignments?.includes(targetAssignmentType) ||
                         (targetAssignmentType === "demostracion" && p.enabledAssignments?.includes("ayudante") && isSecondParticipant);

        // Step 2: Check if participant is explicitly excluded from this assignment type
        // 'excludedFromAssignmentTypes' is now directly on the participant object
        const isExcluded = p.excludedFromAssignmentTypes?.includes(targetAssignmentType);

        return isEnabled && !isExcluded;
      })
      .map((p) => {
        // Step 3: Get *all* historical assignments for this participant and specific assignment type/role
        const historicalAssignmentsForType = allAssignments
          .filter((a) => {
            // Check based on the *targetAssignmentType* and the specific role (titular/ayudante)
            if (targetAssignmentType === "demostracion") {
              if (isSecondParticipant) { // Ayudante
                return a.type === "demostracion" && a.secondParticipantId === p.id;
              } else { // Titular
                return a.type === "demostracion" && a.participantId === p.id;
              }
            } else { // For all other 'general' assignment types
              // A participant can be either the main participant or second participant for a given type.
              // We need to consider both roles if the type is not 'demostracion' specific.
              return a.type === targetAssignmentType &&
                     (a.participantId === p.id || a.secondParticipantId === p.id);
            }
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by most recent date

        const ultima = historicalAssignmentsForType[0]?.date || null; // The most recent date for this specific type
        const dias = calcularDiasDesde(meetingDate, ultima); // Returns Infinity if ultima is null

        return { ...p, diasSinAsignacion: dias };
      });

    // Step 4: Sort the suggestions
    return suggestions
      .sort((a, b) => {
        // Prioritize "never assigned" (Infinity) first
        if (a.diasSinAsignacion === Infinity && b.diasSinAsignacion !== Infinity) {
          return -1; // 'a' (never assigned) comes before 'b'
        }
        if (a.diasSinAsignacion !== Infinity && b.diasSinAsignacion === Infinity) {
          return 1; // 'b' (never assigned) comes before 'a'
        }
        // Then sort by days without assignment in descending order (longest gap first)
        return b.diasSinAsignacion - a.diasSinAsignacion;
      })
      .slice(0, 5); // Show top 5 suggestions
  };

  // Sugerencias generales para tipos de asignación que no son demostración
  const sugerenciasGenerales = React.useMemo(() => {
    if (selectedType === "demostracion") return [];
    // Ensure that selectedType is directly passed and handled by getSortedSuggestions
    return getSortedSuggestions(selectedType);
  }, [meetingDate, selectedType, participants, allAssignments]);

  // Sugerencias para titulares de demostración
  const sugerenciasTitularesDemostracion = React.useMemo(() => {
    if (selectedType !== "demostracion") return [];
    return getSortedSuggestions("demostracion", false); // false indicates titular
  }, [meetingDate, selectedType, participants, allAssignments]);

  // Sugerencias para ayudantes de demostración
  const sugerenciasAyudantesDemostracion = React.useMemo(() => {
    if (selectedType !== "demostracion") return [];
    return getSortedSuggestions("demostracion", true); // true indicates ayudante
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