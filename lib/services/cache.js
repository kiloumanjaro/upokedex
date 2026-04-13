// In-memory cache for API responses to avoid repeat network requests
const cache = {
  pokemon: {},
  species: {},
  types:   {},
  list:    []
};

export default cache;
