// App-wide configuration: API endpoints, image URL builder, and pagination batch size
export const API_BASE  = 'https://pokeapi.co/api/v2';
export const BATCH_SIZE = 10;

export function imageUrl(id) {
  const n = parseInt(id, 10);
  const pad = n < 1000 ? String(n).padStart(3, '0') : String(n);
  return `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${pad}.png`;
}
