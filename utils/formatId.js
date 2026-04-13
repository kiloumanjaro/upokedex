// Formats a Pokémon ID as a 3-digit-minimum display string (e.g. #001, #1010)
export function formatId(id) {
  const n = parseInt(id, 10);
  return '#' + (n < 1000 ? String(n).padStart(3, '0') : String(n));
}
