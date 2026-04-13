// Business logic for fetching Pokémon data with caching and weakness calculation
import { fetchJson } from '../api/client.js';
import { API_BASE, BATCH_SIZE } from '../../config/app.config.js';
import { FALLBACK_WEAKNESSES } from '../../constants/typeWeaknesses.js';
import cache from './cache.js';

export async function fetchTotalCount() {
  const meta = await fetchJson(`${API_BASE}/pokemon?limit=1`);
  return meta.count;
}

export async function fetchPokemonBatch(offset) {
  const data = await fetchJson(`${API_BASE}/pokemon?limit=${BATCH_SIZE}&offset=${offset}`);
  const items = data.results.map(p => {
    const segs = p.url.split('/').filter(Boolean);
    return { id: parseInt(segs.at(-1), 10), name: p.name };
  });
  return { items, hasMore: !!data.next };
}

export async function getPokemon(id) {
  return (cache.pokemon[id] ??= await fetchJson(`${API_BASE}/pokemon/${id}`));
}

export async function getSpecies(id) {
  return (cache.species[id] ??= await fetchJson(`${API_BASE}/pokemon-species/${id}`));
}

export async function getEvolutionChain(url) {
  return (cache.evolutionChains[url] ??= await fetchJson(url));
}

function buildEvolutionStageMap(link, stage = 1, map = {}) {
  if (!link?.species?.name) return map;

  const name = link.species.name;
  map[name] = map[name] ? Math.min(map[name], stage) : stage;

  (link.evolves_to ?? []).forEach(next => {
    buildEvolutionStageMap(next, stage + 1, map);
  });

  return map;
}

export async function getEvolutionStage(id) {
  if (id in cache.evolutionStages) return cache.evolutionStages[id];

  try {
    const species = await getSpecies(id);
    const chainUrl = species?.evolution_chain?.url;
    if (!chainUrl) {
      cache.evolutionStages[id] = null;
      return null;
    }

    const chain = await getEvolutionChain(chainUrl);
    const stageMap = buildEvolutionStageMap(chain?.chain);
    const stage = stageMap[species.name] ?? 1;
    cache.evolutionStages[id] = stage;
    return stage;
  } catch {
    cache.evolutionStages[id] = null;
    return null;
  }
}

export async function getType(name) {
  return (cache.types[name] ??= await fetchJson(`${API_BASE}/type/${name}`));
}

export async function calcWeaknesses(types) {
  try {
    const results = await Promise.all(types.map(getType));
    const eff = {};
    results.forEach(td => {
      td.damage_relations.double_damage_from.forEach(t => { eff[t.name] = (eff[t.name] ?? 1) * 2; });
      td.damage_relations.half_damage_from.forEach(t =>   { eff[t.name] = (eff[t.name] ?? 1) * 0.5; });
      td.damage_relations.no_damage_from.forEach(t =>     { eff[t.name] = 0; });
    });
    return Object.keys(eff).filter(t => eff[t] > 1);
  } catch {
    const set = new Set();
    types.forEach(t => (FALLBACK_WEAKNESSES[t] ?? []).forEach(w => set.add(w)));
    return [...set];
  }
}
