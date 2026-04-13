// Generic fetch wrapper that returns JSON and throws on non-OK responses
export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}
