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
export const formatAssignmentType = (typeString) => {
    if (!typeString) return '';
    return typeString
        .split('-') // Split by hyphen
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' '); // Join with space
};
