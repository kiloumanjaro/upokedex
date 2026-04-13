// Data URI SVG placeholder for broken Pokémon images (pre-encoded, no raw quotes)
export const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
  '<circle cx="50" cy="50" r="48" fill="#f0f0f0" stroke="#ddd" stroke-width="2"/>' +
  '<text x="50" y="60" text-anchor="middle" font-size="36" fill="#ccc">?</text></svg>'
);
