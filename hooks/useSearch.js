// Manages search query and sort mode, provides filtered/sorted list computation
let sortMode    = 'id';
let searchQuery = '';

export function getSortMode()     { return sortMode; }
export function getSearchQuery()  { return searchQuery; }
export function setSortMode(m)    { sortMode = m; }
export function setSearchQuery(q) { searchQuery = q; }

export function filteredList(list) {
  let result = [...list];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(p => {
      const padded = String(p.id).padStart(3, '0');
      return (
        p.name.toLowerCase().includes(q) ||
        padded.includes(q) ||
        String(p.id).includes(q)
      );
    });
  }
  result.sort(sortMode === 'name'
    ? (a, b) => a.name.localeCompare(b.name)
    : (a, b) => a.id - b.id
  );
  return result;
}
