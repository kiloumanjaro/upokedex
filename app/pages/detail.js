// Detail view: renders the book-style Pokemon notebook inside the modal
import {
  renderPokedex,
  hydratePokedex,
} from '../../components/pokedex.js';
import { getPokemon, getSpecies, calcWeaknesses } from '../../lib/services/pokemon-service.js';
import { getTotalCount } from '../../hooks/use-pagination.js';

let activeDetailRequest = 0;

export async function fetchDetailState(id) {
  const [pokemon, species] = await Promise.all([
    getPokemon(id),
    getSpecies(id).catch(() => null),
  ]);

  const types = pokemon.types.map(t => t.type.name);
  const weaknesses = await calcWeaknesses(types);

  return {
    id,
    totalCount: getTotalCount(),
    pokemon,
    species,
    weaknesses,
  };
}

export async function loadDetail(id, contentEl, handlers = {}) {
  const requestId = ++activeDetailRequest;
  const hasNotebook = !!contentEl.querySelector('[data-book-root]');
  const currentDetailId = Number(contentEl?.dataset?.detailId);
  const reuseNotebook = hasNotebook && currentDetailId === id;

  contentEl.dataset.detailLoading = 'true';

  if (!reuseNotebook) {
    contentEl.innerHTML = '<div class="modal-loading"><div class="spinner-lg"></div></div>';
  }

  try {
    const detailState = await fetchDetailState(id);
    if (requestId !== activeDetailRequest) return;
    contentEl.innerHTML = renderPokedex(detailState, { hideUntilReady: !reuseNotebook });

    hydratePokedex(contentEl, handlers);
    contentEl.dataset.detailLoading = 'false';
    contentEl.dataset.detailId = String(id);

  } catch (e) {
    if (requestId !== activeDetailRequest) return;

    console.error(e);
    contentEl.dataset.detailLoading = 'false';
    contentEl.innerHTML = `
      <div class="modal-loading">
        <p class="modal-loading__error">Failed to load #${id}</p>
        <button class="modal-loading__btn--retry" data-action="retry" data-id="${id}">
          Retry
        </button>
        <br/><br/>
        <button class="modal-loading__btn--dismiss" data-action="close">
          Close
        </button>
      </div>`;
  }
}
