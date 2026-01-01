export function getAQICategory(level) {
  switch (level) {
    case 1:
      return "Good";
    case 2:
      return "Satisfactory";
    case 3:
      return "Moderate";
    case 4:
      return "Poor";
    case 5:
      return "Severe";
    default:
      return "Unknown";
  }
}

export function formatTitle(text) {
  return text.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
