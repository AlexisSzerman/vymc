// Helper to get the Monday and Sunday dates of a given week
export const getMeetingWeekDates = (date, offset = 0) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Normalize to start of day

    // Add the offset in weeks
    d.setDate(d.getDate() + (offset * 7));

    const dayOfWeek = d.getDay(); // 0 for Sunday, 1 for Monday...
    let startOfWeek = new Date(d);

    // Adjust to Monday of the current week (based on the potentially offset date)
    // If it's Sunday (0), subtract 6 days to get to Monday.
    // If it's Monday (1), subtract 0 days.
    // If it's Tuesday (2), subtract 1 day.
    // ...
    // If it's Saturday (6), subtract 5 days.
    startOfWeek.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Sunday)
    endOfWeek.setHours(23, 59, 59, 999); // Set to end of day for inclusive comparison

    return { startOfWeek, endOfWeek };
};

// Helper to format date to YYYY-MM-DD
export const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to format assignment type for display
export const formatAssignmentType = (type) => {
  switch (type) {
    case "presidencia":
      return "Presidencia";
    case "cancion":
      return "Canción";
    case "oracion-inicial":
      return "Oración Inicial";
    case "oracion-final":
      return "Oración Final";
    case "tesoros":
      return "Tesoros de la Biblia";
    case "perlas-escondidas":
      return "Busquemos Perlas Escondidas";
    case "demostracion":
      return "Demostración";
    case "discurso":
      return "Discurso";
    case "conduccion-estudio-biblico":
      return "Conducción Estudio Bíblico";
    case "nuestra-vida-cristiana":
      return "Nuestra Vida Cristiana";
    case "necesidades":
      return "Necesidades de la Congregación";
    case "lectura-biblia":
      return "Lectura Bíblica";
    case "lectura-libro":
      return "Lectura del Libro";
    case "asamblea-circuito":
      return "Asamblea de Circuito";
    case "asamblea-regional":
      return "Asamblea Regional";
    case "visita":
      return "Visita del Superintendente y su Esposa";
    default:
      // Si no está definido, devolver con capitalización genérica
      return type
        .split("-")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");
  }
};

export const calcularDiasDesde = (fechaReferencia, ultimaAsignacionFecha) => {
  if (!ultimaAsignacionFecha) {
    return Infinity; // This is the crucial part: return Infinity if no last assignment date
  }

  const fechaRef = new Date(fechaReferencia);
  const ultimaAsig = new Date(ultimaAsignacionFecha);

  // Set times to midnight to avoid time-of-day issues
  fechaRef.setHours(0, 0, 0, 0);
  ultimaAsig.setHours(0, 0, 0, 0);

  const diferenciaMs = fechaRef.getTime() - ultimaAsig.getTime();
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
  return dias;
};

export function formatDateAr(isoString) {
  if (!isoString) return "";
  const [year, month, day] = isoString.split("-");
  return `${day}/${month}/${year}`;
}
