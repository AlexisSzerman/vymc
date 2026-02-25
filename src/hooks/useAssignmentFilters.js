//hooks/useAssignmentFilters.js

import { useState, useEffect } from "react";

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + daysToMonday);
  return d;
};

const useAssignmentFilters = (allAssignments) => {
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");
  const [currentAssignments, setCurrentAssignments] = useState([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcula el lunes de la semana actual
    const monday = getMonday(today);

    let filtered = [...allAssignments];

    // Aplica filtro por fecha si está especificado
    if (filterDate) {
      // Calcula el lunes de la semana de la fecha seleccionada
      const [fy, fm, fd] = filterDate.split("-").map(Number);
      const selectedDate = new Date(fy, fm - 1, fd);
      const filterMonday = getMonday(selectedDate);
      const filterMondayStr = filterMonday.toISOString().slice(0, 10);

      filtered = filtered.filter((a) => a.date === filterMondayStr);
    } else {
      // Si no hay filtro de fecha, muestra desde el lunes de la semana actual en adelante
      filtered = filtered.filter((a) => {
        const [y, m, d] = a.date.split("-").map(Number);
        const assignmentDate = new Date(y, m - 1, d);
        return assignmentDate >= monday;
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
        return (a.orden ?? 99) - (b.orden ?? 99);
      }
      return new Date(a.date) - new Date(b.date);
    });

    setCurrentAssignments(filtered);
  }, [allAssignments, filterDate, filterName]);

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