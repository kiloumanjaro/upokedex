// Capitalizes the first letter and replaces hyphens with spaces
export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}
