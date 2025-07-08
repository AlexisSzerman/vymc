//hooks/useAssignmentFilters.js

import { useState, useEffect } from "react";

const useAssignmentFilters = (allAssignments) => {
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");
  const [currentAssignments, setCurrentAssignments] = useState([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliza la fecha de hoy a medianoche

    let filtered = [...allAssignments]; // Copia para no mutar el array original

    // Aplica filtro por fecha si está especificado
    if (filterDate) {
      filtered = filtered.filter((a) => a.date === filterDate);
    } else {
      // Si no hay filtro de fecha, muestra solo las asignaciones futuras o de hoy
      filtered = filtered.filter((a) => {
        const [y, m, d] = a.date.split("-").map(Number);
        const assignmentDate = new Date(y, m - 1, d); // Meses son 0-indexados
        return assignmentDate >= today;
      });
    }

    // Aplica filtro por nombre si está especificado
    if (filterName.trim()) {
      const name = filterName.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.participantName?.toLowerCase().includes(name) ||
          a.secondParticipantName?.toLowerCase().includes(name)
      );
    }

    // Ordena las asignaciones: primero por fecha, luego por orden
    filtered.sort((a, b) => {
      if (a.date === b.date) {
        return (a.orden ?? 99) - (b.orden ?? 99); // Usa 99 si 'orden' no está definido
      }
      return new Date(a.date) - new Date(b.date);
    });

    setCurrentAssignments(filtered); // Actualiza el estado de las asignaciones filtradas
  }, [allAssignments, filterDate, filterName]); // Dependencias para re-ejecutar el efecto

  // Limpia todos los filtros
  const clearFilters = () => {
    setFilterDate("");
    setFilterName("");
  };

  return {
    filterDate,
    setFilterDate,
    filterName,
    setFilterName,
    currentAssignments,
    clearFilters,
  };
};

export default useAssignmentFilters;
