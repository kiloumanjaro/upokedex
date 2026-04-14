// Renders Pokémon card HTML, injects type badges into cards, and shows skeleton placeholders
import { imageUrl, BATCH_SIZE } from '../config/app.config.js';
import { TYPE_BG } from '../constants/type-colors.js';
import { getEvolutionStage } from '../lib/services/pokemon-service.js';
import { formatId } from '../utils/format-id.js';
import { capitalize } from '../utils/capitalize.js';
import { escapeHtml } from '../utils/escape-html.js';
import { FALLBACK_IMAGE } from '../utils/fallback-image.js';
import cache from '../lib/services/cache.js';

export function cardHTML({ id, name }, idx) {
  const delay = Math.min(idx * 30, 300);
  return `
    <div class="poke-card" data-id="${id}"
         style="animation-delay:${delay}ms" tabindex="0">
      <div class="evolution-badge" id="evo-${id}"></div>
      <div class="card-img-wrap">
        <div class="card-img-bg" id="cbg-${id}"></div>
        <img src="${imageUrl(id)}" alt="${escapeHtml(name)}" width="110" height="110"
             loading="lazy"
             onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />
      </div>
      <div class="card-body">
        <div class="card-num">${formatId(id)}</div>
        <div class="card-name">${capitalize(name)}</div>
        <div class="type-pills" id="tp-${id}">
          <span class="type-pill" style="background:#ddd;color:#999">···</span>
        </div>
      </div>
    </div>`;
}

export function injectTypes(id) {
  const poke = cache.pokemon[id];
  if (!poke) return;
  const el = document.getElementById(`tp-${id}`);
  if (!el) return;
  const types = poke.types.map(t => t.type.name);
  el.innerHTML = types.map(t =>
    `<span class="type-pill t-${t}">${capitalize(t)}</span>`
  ).join('');
  const bg = document.getElementById(`cbg-${id}`);
  if (bg) bg.style.background = TYPE_BG[types[0]] ?? '#aaa';
  injectEvolutionStage(id);
}

async function injectEvolutionStage(id) {
  const badge = document.getElementById(`evo-${id}`);
  if (!badge) return;

  const stage = await getEvolutionStage(id);
  if (!badge.isConnected || stage == null) return;

  const colorStage = Math.min(stage, 4);
  badge.textContent = String(stage);
  badge.className = `evolution-badge evolution-badge--visible evolution-badge--stage-${colorStage}`;
  badge.setAttribute('aria-label', `Evolution stage ${stage}`);
  badge.setAttribute('title', `Evolution stage ${stage}`);
}

export function showSkeletons(container) {
  container.innerHTML = Array.from({ length: BATCH_SIZE }, () => `
    <div class="skeleton-card">
      <div class="skel-body" style="padding:18px 14px 8px">
        <div class="skel skel-img"></div>
      </div>
      <div class="skel-body">
        <div class="skel skel-line--sm"></div>
        <div class="skel skel-line--md"></div>
        <div class="skel skel-line--sm" style="width:40%"></div>
      </div>
    </div>`).join('');
}
