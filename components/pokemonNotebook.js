import { imageUrl } from '../config/app.config.js';
import { STAT_COLORS, STAT_LABELS } from '../constants/statMeta.js';
import { TYPE_BG } from '../constants/typeColors.js';
import { capitalize } from '../utils/capitalize.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { FALLBACK_IMAGE } from '../utils/fallbackImage.js';
import { formatId } from '../utils/formatId.js';

const BOOK_WIDTH = 1120;
const BOOK_HEIGHT = 720;
let activeFit = null;
let resizeBound = false;

function cleanText(value = '') {
  return value.replace(/[\f\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function shortenText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getEnglishGenus(species) {
  const genus = species?.genera?.find(entry => entry.language.name === 'en');
  return genus ? genus.genus : 'Pokemon';
}

function getEnglishFlavor(species) {
  const entry = species?.flavor_text_entries?.find(
    item => item.language.name === 'en'
  );

  return entry
    ? cleanText(entry.flavor_text)
    : 'A page is waiting to be filled with more field notes.';
}

function getGenerationLabel(species) {
  const raw = species?.generation?.name;
  if (!raw) return 'Unknown';
  return `Gen ${raw.replace('generation-', '').toUpperCase()}`;
}

function getHabitatLabel(species) {
  return species?.habitat ? capitalize(species.habitat.name) : 'Unknown';
}

function getShapeLabel(species) {
  return species?.shape ? capitalize(species.shape.name) : 'Unknown';
}

function formatHeight(height) {
  if (typeof height !== 'number') return 'Unknown';
  return `${(height / 10).toFixed(1)} m`;
}

function formatWeight(weight) {
  if (typeof weight !== 'number') return 'Unknown';
  return `${(weight / 10).toFixed(1)} kg`;
}

function getStatTotal(stats = []) {
  return stats.reduce((total, stat) => total + (stat.base_stat ?? 0), 0);
}

function renderTypePills(types) {
  return types
    .map(type => {
      const color = TYPE_BG[type] ?? '#64748b';
      return `
        <span
          class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-sm"
          style="background:${color}"
        >
          ${escapeHtml(capitalize(type))}
        </span>`;
    })
    .join('');
}

function renderFactCard(label, value, accent) {
  return `
    <div class="rounded-[18px] border border-white/70 bg-white/75 p-4 shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
      <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        ${escapeHtml(label)}
      </p>
      <p class="mt-2 text-lg font-semibold text-slate-900">
        ${escapeHtml(value)}
      </p>
      <div class="mt-3 h-1.5 w-14 rounded-full" style="background:${accent}"></div>
    </div>`;
}

function renderStatRows(stats = []) {
  return stats
    .map(stat => {
      const pct = Math.min(100, Math.round(((stat.base_stat ?? 0) / 255) * 100));
      const label = STAT_LABELS[stat.stat.name] ?? capitalize(stat.stat.name);
      const color = STAT_COLORS[stat.stat.name] ?? '#64748b';

      return `
        <div class="grid grid-cols-[84px_34px_minmax(0,1fr)] items-center gap-2">
          <div class="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">${escapeHtml(label)}</div>
          <div class="text-sm font-black text-slate-900">${stat.base_stat ?? 0}</div>
          <div class="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full transition-[width] duration-700 ease-out"
              data-stat-pct="${pct}"
              style="width:0;background:${color}"
            ></div>
          </div>
        </div>`;
    })
    .join('');
}

function renderAbilities(abilities = []) {
  const picks = abilities.slice(0, 4);
  const extraCount = Math.max(0, abilities.length - picks.length);

  return `
    <div class="flex flex-wrap gap-2">
      ${picks
        .map(entry => {
          const base = capitalize(entry.ability.name);
          const label = entry.is_hidden ? `${base} (Hidden)` : base;

          return `
            <span class="inline-flex items-center rounded-full border border-amber-900/10 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              ${escapeHtml(label)}
            </span>`;
        })
        .join('')}
      ${
        extraCount
          ? `<span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              +${extraCount} more
            </span>`
          : ''
      }
    </div>`;
}

function renderWeaknesses(weaknesses = []) {
  if (!weaknesses.length) {
    return `
      <span class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
        No major weakness data
      </span>`;
  }

  return weaknesses
    .map(type => {
      const color = TYPE_BG[type] ?? '#64748b';
      return `
        <span
          class="inline-flex items-center rounded-full px-3 py-2 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-sm"
          style="background:${color}"
        >
          ${escapeHtml(capitalize(type))}
        </span>`;
    })
    .join('');
}

function renderMoves(moves = []) {
  const picks = moves.slice(0, 4);
  const extraCount = Math.max(0, moves.length - picks.length);

  if (!picks.length) {
    return '<p class="text-sm text-slate-500">No move data available yet.</p>';
  }

  return `
    <div class="grid grid-cols-2 gap-2">
      ${picks
        .map(move => {
          return `
            <div class="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm">
              ${escapeHtml(capitalize(move.move.name))}
            </div>`;
        })
        .join('')}
      ${
        extraCount
          ? `<div class="col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              +${extraCount} more moves in the archive
            </div>`
          : ''
      }
    </div>`;
}

function renderNotesList(notes) {
  return `
    <div class="grid grid-cols-2 gap-2">
      ${notes
        .map(
          note => `
            <div class="rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                ${escapeHtml(note.label)}
              </span>
              <div class="mt-1 text-sm font-semibold text-slate-900">
                ${escapeHtml(note.value)}
              </div>
            </div>`
        )
        .join('')}
    </div>`;
}

function closeIcon() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4">
      <path d="M18 6 6 18M6 6l12 12"></path>
    </svg>`;
}

function chevronIcon(direction) {
  const path = direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6';
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4">
      <path d="${path}"></path>
    </svg>`;
}

export function renderPokemonNotebook({
  id,
  totalCount = 0,
  pokemon,
  species,
  weaknesses = [],
}) {
  const types = pokemon.types.map(entry => entry.type.name);
  const mainColor = TYPE_BG[types[0]] ?? '#8b5e34';
  const genus = getEnglishGenus(species);
  const flavor = shortenText(getEnglishFlavor(species), 210);
  const generation = getGenerationLabel(species);
  const habitat = getHabitatLabel(species);
  const shape = getShapeLabel(species);
  const statTotal = getStatTotal(pokemon.stats);
  const prevId = totalCount ? (id > 1 ? id - 1 : totalCount) : Math.max(1, id - 1);
  const nextId = totalCount ? (id < totalCount ? id + 1 : 1) : id + 1;
  const progress = totalCount ? Math.max(1, Math.round((id / totalCount) * 100)) : 0;
  const notebookNotes = [
    { label: 'Height', value: formatHeight(pokemon.height) },
    { label: 'Weight', value: formatWeight(pokemon.weight) },
    { label: 'Base EXP', value: String(pokemon.base_experience ?? 'Unknown') },
    { label: 'Generation', value: generation },
    { label: 'Shape', value: shape },
    { label: 'Habitat', value: habitat },
  ];

  return `
    <div data-book-stage class="mx-auto flex h-[min(82vh,760px)] w-full items-center justify-center overflow-hidden px-1 py-1 text-slate-900">
      <div data-book-shell class="relative origin-center" style="width:${BOOK_WIDTH}px;height:${BOOK_HEIGHT}px">
        <div
          data-book-root
          class="relative h-full overflow-hidden rounded-[30px] border border-amber-950/20 bg-[linear-gradient(135deg,#cb9550_0%,#b77a37_45%,#9a622c_100%)] p-3 shadow-[0_32px_90px_rgba(15,23,42,0.34)]"
        >
          <div class="pointer-events-none absolute inset-y-3 left-1/2 hidden w-4 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(97,57,23,0.98),rgba(61,35,16,0.98),rgba(97,57,23,0.98))] lg:block"></div>
          <div class="pointer-events-none absolute inset-x-16 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_70%)]"></div>
          <div class="absolute left-8 top-0 h-16 w-12 rounded-b-[18px] shadow-sm" style="background:${mainColor}"></div>

          <button
            type="button"
            data-book-action="close"
            class="absolute right-5 top-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/85 text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-white"
            aria-label="Close notebook"
          >
            ${closeIcon()}
          </button>

          <div data-book-spread class="grid h-full grid-cols-2 gap-3 [perspective:1800px]">
            <section data-book-page="left" class="relative h-full overflow-hidden rounded-[24px] border border-amber-950/10 bg-[#f8f0db] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] [backface-visibility:hidden] [transform-origin:right_center]">
              <div class="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_bottom,transparent_33px,rgba(148,163,184,0.14)_34px)] [background-size:100%_34px]"></div>
              <div class="relative flex h-full flex-col gap-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-book text-[34px] font-semibold tracking-[0.08em] text-amber-900/90">Field Journal</p>
                    <p class="mt-0.5 text-[11px] uppercase tracking-[0.32em] text-slate-500">Pokemon Archive</p>
                  </div>
                  <div class="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm">
                    ${escapeHtml(formatId(id))}
                  </div>
                </div>

                <div class="rounded-[22px] border border-amber-900/10 bg-white/70 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                  <div class="flex h-[260px] gap-4">
                    <div
                      class="relative flex w-[280px] shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/70 shadow-inner"
                      style="background:
                        radial-gradient(circle at top, ${mainColor}33, transparent 55%),
                        linear-gradient(135deg, rgba(255,255,255,0.94), rgba(241,245,249,0.88));"
                    >
                      <div class="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_0.8px,transparent_0.8px)] [background-size:18px_18px]"></div>
                      <img
                        data-book-image
                        src="${imageUrl(id)}"
                        alt="${escapeHtml(pokemon.name)}"
                        class="relative z-10 h-44 w-44 object-contain drop-shadow-[0_18px_20px_rgba(15,23,42,0.24)]"
                      />
                    </div>

                    <div class="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div class="flex flex-wrap items-end gap-3">
                          <h2 class="font-book text-[52px] leading-none text-slate-900">
                            ${escapeHtml(capitalize(pokemon.name))}
                          </h2>
                          <span
                            class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-sm"
                            style="background:${mainColor}"
                          >
                            ${escapeHtml(capitalize(types[0] ?? 'Unknown'))}
                          </span>
                        </div>

                        <p class="mt-2 text-sm text-slate-600">${escapeHtml(genus)}</p>
                        <div class="mt-3 flex flex-wrap gap-2">${renderTypePills(types)}</div>
                      </div>

                      <div class="rounded-[22px] border border-amber-900/10 bg-[#fff8eb] px-4 py-3 text-sm leading-6 text-slate-600">
                        ${escapeHtml(flavor)}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  ${renderFactCard('Height', formatHeight(pokemon.height), mainColor)}
                  ${renderFactCard('Weight', formatWeight(pokemon.weight), mainColor)}
                  ${renderFactCard('Stat Total', String(statTotal), mainColor)}
                </div>

                <div class="mt-auto rounded-[22px] border border-amber-900/10 bg-[#fff7e3] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Notebook Progress</p>
                      <p class="mt-1 font-book text-[28px] text-slate-900">
                        ${totalCount ? `Page ${id} of ${totalCount}` : `Entry ${formatId(id)}`}
                      </p>
                    </div>
                    ${
                      totalCount
                        ? `<div class="text-right">
                            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Coverage</p>
                            <p class="text-[28px] font-black text-slate-900">${progress}%</p>
                          </div>`
                        : ''
                    }
                  </div>
                  ${
                    totalCount
                      ? `<div class="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div class="h-full rounded-full transition-[width] duration-700 ease-out" style="width:${progress}%;background:${mainColor}"></div>
                        </div>`
                      : ''
                  }
                </div>
              </div>
            </section>

            <section data-book-page="right" class="relative h-full overflow-hidden rounded-[24px] border border-amber-950/10 bg-[#fbf5e6] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] [backface-visibility:hidden] [transform-origin:left_center]">
              <div class="pointer-events-none absolute bottom-0 left-8 top-0 w-px bg-rose-200/50"></div>
              <div class="relative flex h-full flex-col gap-3">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.32em] text-slate-500">Battle Ledger</p>
                    <h3 class="mt-1 font-book text-[40px] text-slate-900">Combat Notes</h3>
                  </div>
                  <div class="rounded-[20px] border border-white/70 bg-white/80 px-4 py-3 text-right shadow-sm">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Stat Total</p>
                    <p class="text-[34px] font-black leading-none text-slate-900">${statTotal}</p>
                  </div>
                </div>

                <div class="rounded-[22px] border border-amber-900/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Base Stats</p>
                    <p class="text-xs font-medium text-slate-500">Scaled against the 255 max benchmark</p>
                  </div>
                  <div class="mt-3 space-y-2.5">
                    ${renderStatRows(pokemon.stats)}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-[22px] border border-amber-900/10 bg-[#fff7e7] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Abilities</p>
                    <div class="mt-3">
                      ${renderAbilities(pokemon.abilities)}
                    </div>
                  </div>

                  <div class="rounded-[22px] border border-amber-900/10 bg-[#fff7e7] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Weaknesses</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      ${renderWeaknesses(weaknesses)}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-[22px] border border-amber-900/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Field Notes</p>
                    <div class="mt-3">
                      ${renderNotesList(notebookNotes)}
                    </div>
                  </div>

                  <div class="rounded-[22px] border border-amber-900/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Moves To Remember</p>
                    <div class="mt-3">
                      ${renderMoves(pokemon.moves)}
                    </div>
                  </div>
                </div>

                <div class="mt-auto rounded-[24px] border border-amber-900/10 bg-[#f5e8c8]/95 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <button
                      type="button"
                      data-book-action="previous"
                      class="inline-flex items-center justify-self-start gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/95"
                    >
                      ${chevronIcon('left')}
                      <span>Turn back to ${escapeHtml(formatId(prevId))}</span>
                    </button>

                    <div class="text-center">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Endless Notebook</p>
                      <p class="mt-1 text-xs text-slate-600">
                        The last page loops back to ${escapeHtml(formatId(1))} so you can keep flipping forever.
                      </p>
                    </div>

                    <button
                      type="button"
                      data-book-action="next"
                      class="inline-flex items-center justify-self-end gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/95"
                    >
                      <span>Turn page to ${escapeHtml(formatId(nextId))}</span>
                      ${chevronIcon('right')}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>`;
}

function fitNotebook(root) {
  const stage = root.querySelector('[data-book-stage]');
  const shell = root.querySelector('[data-book-shell]');
  if (!stage || !shell) return;

  const widthScale = Math.max(0.1, (stage.clientWidth - 4) / BOOK_WIDTH);
  const heightScale = Math.max(0.1, (stage.clientHeight - 4) / BOOK_HEIGHT);
  shell.style.transform = `scale(${Math.min(widthScale, heightScale, 1)})`;
}

function animatePageTurn(root, action, onComplete) {
  const target =
    action === 'next'
      ? root.querySelector('[data-book-page="right"]')
      : root.querySelector('[data-book-page="left"]');
  const spread = root.querySelector('[data-book-spread]');

  if (!target || !spread || typeof onComplete !== 'function') {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  const turningNext = action === 'next';
  root.dataset.turning = 'true';

  target.animate(
    turningNext
      ? [
          { transform: 'rotateY(0deg)', filter: 'brightness(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
          { transform: 'rotateY(-82deg)', filter: 'brightness(0.92)', boxShadow: '-28px 10px 28px rgba(15,23,42,0.18)' },
        ]
      : [
          { transform: 'rotateY(0deg)', filter: 'brightness(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
          { transform: 'rotateY(82deg)', filter: 'brightness(0.92)', boxShadow: '28px 10px 28px rgba(15,23,42,0.18)' },
        ],
    {
      duration: 420,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    }
  );

  spread.animate(
    [
      { transform: 'translateX(0px)' },
      { transform: `translateX(${turningNext ? '-8px' : '8px'})` },
      { transform: 'translateX(0px)' },
    ],
    {
      duration: 420,
      easing: 'ease-in-out',
    }
  );

  window.setTimeout(() => {
    onComplete();
  }, 240);
}

export function hydratePokemonNotebook(root, handlers = {}) {
  if (!resizeBound) {
    window.addEventListener('resize', () => {
      if (typeof activeFit === 'function') activeFit();
    });
    resizeBound = true;
  }

  activeFit = () => fitNotebook(root);
  activeFit();

  root.querySelectorAll('[data-book-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.bookAction;
      const handler = handlers[action];
      if (typeof handler !== 'function') return;

      if (action === 'previous' || action === 'next') {
        if (root.dataset.turning === 'true') return;
        animatePageTurn(root, action === 'previous' ? 'previous' : 'next', handler);
        return;
      }

      handler();
    });
  });

  const image = root.querySelector('[data-book-image]');
  if (image) {
    image.addEventListener(
      'error',
      () => {
        image.src = FALLBACK_IMAGE;
      },
      { once: true }
    );
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.querySelectorAll('[data-stat-pct]').forEach(fill => {
        fill.style.width = `${fill.dataset.statPct}%`;
      });
    });
  });
}
