import { imageUrl } from '../config/app.config.js';
import { STAT_COLORS, STAT_LABELS } from '../constants/statMeta.js';
import { TYPE_BG } from '../constants/typeColors.js';
import { capitalize } from '../utils/capitalize.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { FALLBACK_IMAGE } from '../utils/fallbackImage.js';
import { formatId } from '../utils/formatId.js';

const BOOK_WIDTH = 968;
const BOOK_HEIGHT = 650;
const PAGE_WIDTH = 472;
const PAGE_GAP = 8;
const BOOK_PADDING = 8;
const BOOK_OPEN_DURATION = 800;
const BOOK_CLOSE_DURATION = 1800;
const PAGE_FLIP_DURATION = 600;
const PAGE_FLIP_CLEANUP_DELAY = 610;
let activeFit = null;
let resizeBound = false;

function renderPageRings(side) {
  const sideClass = side === 'left' ? '-left-1 items-start' : '-right-1 items-end';
  const circleClass = side === 'left' ? 'left-3' : 'right-3';
  const barClass = side === 'left'
    ? 'left-0 rounded-r bg-[#B0B0B0]'
    : 'right-0 rounded-l bg-[#B0B0B0]';

  return `
    <div data-ring-group="${side}" class="pointer-events-none absolute ${sideClass} top-0 flex h-full flex-col justify-around py-4">
      ${[0, 1, 2].map(i => `
        <div data-ring="${i}" class="relative flex h-4 w-8 items-center">
          <div class="absolute ${circleClass} h-3.5 w-3.5 rounded-full bg-[#121212]"></div>
          <div class="absolute ${barClass} z-10 h-1.5 w-5"></div>
        </div>
      `).join('')}
    </div>`;
}

function renderCoverRings(side) {
  const sideClass = side === 'left' ? 'right-0 items-end' : 'left-0 items-start';
  const capClass = side === 'left'
    ? 'right-0 rounded-r-full bg-[#1040C0]'
    : 'left-0 rounded-l-full bg-[#1040C0]';
  const barClass = side === 'left'
    ? 'right-0.5 rounded-l bg-[#F0C020]'
    : 'left-0.5 rounded-r bg-[#F0C020]';

  return `
    <div class="pointer-events-none absolute ${sideClass} top-0 flex h-full flex-col justify-around py-4">
      ${[0, 1, 2].map(i => `
        <div class="relative flex h-4 w-7 items-center">
          <div class="absolute ${capClass} h-3.5 w-[7px]"></div>
          <div class="absolute ${barClass} h-1.5 w-5"></div>
        </div>
      `).join('')}
    </div>`;
}

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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-6 w-6">
      <path d="${path}"></path>
    </svg>`;
}

export function renderPokedex({
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
  const canNavigate = totalCount > 1;
  const notebookNotes = [
    { label: 'Height', value: formatHeight(pokemon.height) },
    { label: 'Weight', value: formatWeight(pokemon.weight) },
    { label: 'Base EXP', value: String(pokemon.base_experience ?? 'Unknown') },
    { label: 'Generation', value: generation },
    { label: 'Shape', value: shape },
    { label: 'Habitat', value: habitat },
  ];

  return `
    <div data-book-stage class="mx-auto flex h-[min(82vh,700px)] w-full items-center justify-center overflow-hidden px-1 py-1 text-slate-900">
      <button
        type="button"
        data-book-action="previous"
        data-book-nav="true"
        ${canNavigate ? '' : 'disabled'}
        class="mr-3 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-white text-slate-900 shadow-[3px_3px_0px_0px_#2d2d2d] transition duration-150 hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Previous Pokemon"
      >
        ${chevronIcon('left')}
      </button>

      <div data-book-shell class="relative origin-center" style="width:${BOOK_WIDTH}px;height:${BOOK_HEIGHT}px">
        <div
          data-book-root
          class="relative h-full overflow-hidden rounded-[30px] border border-amber-950/20 bg-[linear-gradient(135deg,#cb9550_0%,#b77a37_45%,#9a622c_100%)] shadow-[0_32px_90px_rgba(15,23,42,0.34)]"
          style="padding:${BOOK_PADDING}px"
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

          <div data-book-spread class="grid h-full grid-cols-2 [perspective:1800px]" style="gap:${PAGE_GAP}px">
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
              ${renderPageRings('right')}
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
                  <div class="text-center">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Endless Notebook</p>
                      <p class="mt-1 text-xs text-slate-600">
                        ${canNavigate
                          ? `Use the side buttons to turn from ${escapeHtml(formatId(prevId))} to ${escapeHtml(formatId(nextId))}.`
                          : 'Only one entry is loaded right now, so page turning is disabled.'}
                      </p>
                  </div>
                </div>
              </div>
              ${renderPageRings('left')}
            </section>
          </div>

          <div data-book-covers class="pointer-events-none absolute inset-0 z-20">
            <div
              data-book-cover="left"
              class="absolute left-0 top-0 h-full w-1/2 overflow-hidden rounded-l-[30px] border-r-2 border-[#121212] bg-[#F0C020] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.3)]"
              style="transform-origin:right center;transform-style:preserve-3d;transform:rotateY(0deg);z-index:30;"
            >
              <div
                class="relative flex h-full items-center justify-center rounded-l-[30px] bg-[#F0C020]"
                style="backface-visibility:hidden;"
              >
                <div class="flex flex-col items-center gap-2">
                  <div class="h-24 w-1 bg-[#121212]"></div>
                  <p class="text-xs font-black uppercase tracking-[0.28em] text-[#121212]">Pokedex</p>
                </div>
                ${renderCoverRings('left')}
              </div>
              <div
                class="absolute inset-0 rounded-r-[30px] bg-white"
                style="transform:rotateY(180deg);backface-visibility:hidden;"
              ></div>
            </div>

            <div
              data-book-cover="right"
              class="absolute right-0 top-0 h-full w-1/2 overflow-hidden rounded-r-[30px] border-l-2 border-[#121212] bg-[#F0C020] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.3)]"
              style="transform-origin:left center;transform-style:preserve-3d;transform:rotateY(0deg);z-index:30;"
            >
              <div
                class="relative flex h-full items-center justify-center rounded-r-[30px] bg-[#F0C020]"
                style="backface-visibility:hidden;"
              >
                <div class="flex flex-col items-center gap-2">
                  <div class="h-24 w-1 bg-[#121212]"></div>
                  <p class="text-xs font-black uppercase tracking-[0.28em] text-[#121212]">Archive</p>
                </div>
                ${renderCoverRings('right')}
              </div>
              <div
                class="absolute inset-0 rounded-l-[30px] bg-white"
                style="transform:rotateY(180deg);backface-visibility:hidden;"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        data-book-action="next"
        data-book-nav="true"
        ${canNavigate ? '' : 'disabled'}
        class="ml-3 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-white text-slate-900 shadow-[3px_3px_0px_0px_#2d2d2d] transition duration-150 hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Next Pokemon"
      >
        ${chevronIcon('right')}
      </button>
    </div>`;
}

function setCoverState(root, state) {
  const leftCover = root.querySelector('[data-book-cover="left"]');
  const rightCover = root.querySelector('[data-book-cover="right"]');
  if (!leftCover || !rightCover) return;

  if (state === 'open') {
    leftCover.style.transform = 'rotateY(-180deg)';
    rightCover.style.transform = 'rotateY(180deg)';
    leftCover.style.zIndex = '10';
    rightCover.style.zIndex = '10';
    return;
  }

  leftCover.style.transform = 'rotateY(0deg)';
  rightCover.style.transform = 'rotateY(0deg)';
  leftCover.style.zIndex = '30';
  rightCover.style.zIndex = '30';
}

function setCoverVisibility(root, visible) {
  const covers = root.querySelector('[data-book-covers]');
  if (!covers) return;

  covers.style.opacity = visible ? '1' : '0';
  covers.style.visibility = visible ? 'visible' : 'hidden';
}

function animateBookOpen(root) {
  const leftCover = root.querySelector('[data-book-cover="left"]');
  const rightCover = root.querySelector('[data-book-cover="right"]');
  if (!leftCover || !rightCover) return;

  root.dataset.bookOpening = 'true';
  setCoverVisibility(root, true);
  leftCover.animate(
    [
      { transform: 'rotateY(0deg)', zIndex: 30 },
      { transform: 'rotateY(-180deg)', zIndex: 10 },
    ],
    {
      duration: BOOK_OPEN_DURATION,
      easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      fill: 'forwards',
    }
  );
  rightCover.animate(
    [
      { transform: 'rotateY(0deg)', zIndex: 30 },
      { transform: 'rotateY(180deg)', zIndex: 10 },
    ],
    {
      duration: BOOK_OPEN_DURATION,
      easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      fill: 'forwards',
    }
  );

  window.setTimeout(() => {
    root.dataset.bookOpening = 'false';
    root.dataset.bookSessionOpen = 'true';
    setCoverState(root, 'open');
    setCoverVisibility(root, false);
  }, BOOK_OPEN_DURATION);
}

function animateBookClose(root, onComplete) {
  if (root.dataset.bookClosing === 'true') return;

  const leftCover = root.querySelector('[data-book-cover="left"]');
  const rightCover = root.querySelector('[data-book-cover="right"]');
  if (!leftCover || !rightCover) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  root.dataset.bookClosing = 'true';
  setCoverVisibility(root, true);
  setCoverState(root, 'open');
  leftCover.animate(
    [
      { transform: 'rotateY(-180deg)', zIndex: 10 },
      { transform: 'rotateY(0deg)', zIndex: 30 },
    ],
    {
      duration: BOOK_CLOSE_DURATION,
      easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      fill: 'forwards',
    }
  );
  rightCover.animate(
    [
      { transform: 'rotateY(180deg)', zIndex: 10 },
      { transform: 'rotateY(0deg)', zIndex: 30 },
    ],
    {
      duration: BOOK_CLOSE_DURATION,
      easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      fill: 'forwards',
    }
  );

  window.setTimeout(() => {
    root.dataset.bookClosing = 'false';
    root.dataset.bookSessionOpen = 'false';
    setCoverState(root, 'closed');
    if (typeof onComplete === 'function') onComplete();
  }, BOOK_CLOSE_DURATION);
}

function pulseSpineRings(root, action) {
  const group = root.querySelector(
    `[data-ring-group="${action === 'next' ? 'right' : 'left'}"]`
  );
  if (!group) return;

  group.querySelectorAll('[data-ring]').forEach((ring, index) => {
    if (index === 0) return;
    ring.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.08)' },
        { transform: 'scale(1)' },
      ],
      {
        duration: 500,
        easing: 'ease-out',
      }
    );
  });
}

function buildFlipOverlay(root, action) {
  const spread = root.querySelector('[data-book-spread]');
  const sourcePage = root.querySelector(
    `[data-book-page="${action === 'next' ? 'right' : 'left'}"]`
  );
  const backPage = root.querySelector(
    `[data-book-page="${action === 'next' ? 'left' : 'right'}"]`
  );

  if (!spread || !sourcePage || !backPage) return null;
  return buildFlipOverlayFromPages(
    root,
    action,
    sourcePage.cloneNode(true),
    backPage.cloneNode(true)
  );
}

function buildFlipOverlayFromPages(root, action, frontPage, backPage) {
  const spread = root.querySelector('[data-book-spread]');
  if (!spread || !frontPage || !backPage) return null;

  const overlay = document.createElement('div');
  overlay.setAttribute('data-book-flip-overlay', action);
  overlay.className = 'absolute top-0';
  overlay.style.width = `${PAGE_WIDTH}px`;
  overlay.style.height = '100%';
  overlay.style.transformStyle = 'preserve-3d';
  overlay.style.willChange = 'transform';
  overlay.style.zIndex = '20';

  if (action === 'next') {
    overlay.style.right = '0px';
    overlay.style.transformOrigin = '0px 50%';
  } else {
    overlay.style.left = '0px';
    overlay.style.transformOrigin = `${PAGE_WIDTH}px 50%`;
  }

  const frontFace = frontPage;
  const backFace = backPage;

  frontFace.style.position = 'absolute';
  frontFace.style.inset = '0';
  frontFace.style.width = '100%';
  frontFace.style.height = '100%';
  frontFace.style.backfaceVisibility = 'hidden';

  backFace.style.position = 'absolute';
  backFace.style.inset = '0';
  backFace.style.width = '100%';
  backFace.style.height = '100%';
  backFace.style.backfaceVisibility = 'hidden';
  backFace.style.transform = 'rotateY(180deg)';

  overlay.append(frontFace, backFace);
  spread.appendChild(overlay);
  return overlay;
}

function replaceNotebookPage(bookRoot, side, replacementPage) {
  const currentPage = bookRoot?.querySelector(`[data-book-page="${side}"]`);
  if (!currentPage || !replacementPage) return null;

  currentPage.replaceWith(replacementPage);
  return bookRoot.querySelector(`[data-book-page="${side}"]`);
}

function fitNotebook(root) {
  const stage = root.querySelector('[data-book-stage]');
  const shell = root.querySelector('[data-book-shell]');
  if (!stage || !shell) return;

  const navWidth = Array.from(root.querySelectorAll('[data-book-nav="true"]'))
    .reduce((total, button) => total + button.offsetWidth, 0);
  const sideGap = root.querySelectorAll('[data-book-nav="true"]').length ? 32 : 0;
  const availableWidth = Math.max(120, stage.clientWidth - navWidth - sideGap - 4);
  const widthScale = Math.max(0.1, availableWidth / BOOK_WIDTH);
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
  const overlay = buildFlipOverlay(root, action);
  root.dataset.turning = 'true';
  pulseSpineRings(root, action);

  target.style.visibility = 'hidden';

  if (overlay) {
    overlay.animate(
      turningNext
        ? [
            { transform: 'rotateY(0deg)' },
            { transform: 'rotateY(-180deg)' },
          ]
        : [
            { transform: 'rotateY(0deg)' },
            { transform: 'rotateY(180deg)' },
          ],
      {
        duration: PAGE_FLIP_DURATION,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards',
      }
    );
  } else {
    target.animate(
      turningNext
        ? [
            { transform: 'rotateY(0deg)' },
            { transform: 'rotateY(-180deg)' },
          ]
        : [
            { transform: 'rotateY(0deg)' },
            { transform: 'rotateY(180deg)' },
          ],
      {
        duration: PAGE_FLIP_DURATION,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards',
      }
    );
  }

  spread.animate(
    [
      { transform: 'translateX(0px)' },
      { transform: `translateX(${turningNext ? '-8px' : '8px'})` },
      { transform: 'translateX(0px)' },
    ],
    {
      duration: PAGE_FLIP_DURATION,
      easing: 'ease-in-out',
    }
  );

  window.setTimeout(() => {
    if (overlay?.isConnected) overlay.remove();
    root.dataset.turning = 'false';
    target.style.visibility = '';
    onComplete();
  }, PAGE_FLIP_CLEANUP_DELAY);
}

function isNotebookTurnPayload(value) {
  return !!(
    value &&
    typeof value === 'object' &&
    value.detail &&
    value.detail.pokemon &&
    value.handlers
  );
}

function transitionNotebookTurn(root, action, payload) {
  const sourceSide = action === 'next' ? 'right' : 'left';
  const heldSide = action === 'next' ? 'left' : 'right';
  const currentBookRoot = root.querySelector('[data-book-root]');
  const sourcePage = currentBookRoot?.querySelector(
    `[data-book-page="${sourceSide}"]`
  )?.cloneNode(true);
  const heldPage = currentBookRoot?.querySelector(
    `[data-book-page="${heldSide}"]`
  )?.cloneNode(true);

  if (!sourcePage || !heldPage) {
    root.dataset.detailLoading = 'false';
    root.innerHTML = renderPokedex(payload.detail);
    root.dataset.bookSessionOpen = 'true';
    hydratePokedex(root, payload.handlers);
    return;
  }

  const temp = document.createElement('div');
  temp.innerHTML = renderPokedex(payload.detail);
  const nextStage = temp.querySelector('[data-book-stage]');
  const nextBookRoot = nextStage?.querySelector('[data-book-root]');
  const backPage = nextBookRoot?.querySelector(
    `[data-book-page="${heldSide}"]`
  )?.cloneNode(true);
  const finalHeldPage = nextBookRoot?.querySelector(
    `[data-book-page="${heldSide}"]`
  )?.cloneNode(true);

  if (!nextStage || !backPage || !finalHeldPage) {
    root.dataset.detailLoading = 'false';
    root.innerHTML = renderPokedex(payload.detail);
    root.dataset.bookSessionOpen = 'true';
    hydratePokedex(root, payload.handlers);
    return;
  }

  root.dataset.bookSessionOpen = 'true';
  root.innerHTML = nextStage.outerHTML;
  hydratePokedex(root, payload.handlers);

  const activeBookRoot = root.querySelector('[data-book-root]');
  const spread = activeBookRoot?.querySelector('[data-book-spread]');
  const activeHeldPage = replaceNotebookPage(activeBookRoot, heldSide, heldPage);
  const overlay = buildFlipOverlayFromPages(activeBookRoot, action, sourcePage, backPage);
  const turningNext = action === 'next';

  if (!activeBookRoot || !activeHeldPage || !spread || !overlay) {
    root.dataset.detailLoading = 'false';
    root.dataset.turning = 'false';
    return;
  }

  root.dataset.detailLoading = 'false';
  root.dataset.turning = 'true';
  pulseSpineRings(activeBookRoot, action);

  overlay.animate(
    turningNext
      ? [
          { transform: 'rotateY(0deg)' },
          { transform: 'rotateY(-180deg)' },
        ]
      : [
          { transform: 'rotateY(0deg)' },
          { transform: 'rotateY(180deg)' },
        ],
    {
      duration: PAGE_FLIP_DURATION,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
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
      duration: PAGE_FLIP_DURATION,
      easing: 'ease-in-out',
    }
  );

  window.setTimeout(() => {
    if (overlay.isConnected) overlay.remove();
    replaceNotebookPage(activeBookRoot, heldSide, finalHeldPage);
    root.dataset.turning = 'false';
  }, PAGE_FLIP_CLEANUP_DELAY);
}

function animateNavButton(button) {
  button.animate(
    [
      { transform: 'translate(0px, 0px) scale(1)', boxShadow: '3px 3px 0px 0px #2d2d2d' },
      { transform: 'translate(1px, 1px) scale(0.96)', boxShadow: '2px 2px 0px 0px #2d2d2d' },
      { transform: 'translate(0px, 0px) scale(1)', boxShadow: '3px 3px 0px 0px #2d2d2d' },
    ],
    {
      duration: 180,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    }
  );
}

export function hydratePokedex(root, handlers = {}) {
  root.dataset.turning = 'false';
  root.dataset.detailLoading = 'false';
  root.dataset.bookClosing = 'false';

  if (!resizeBound) {
    window.addEventListener('resize', () => {
      if (typeof activeFit === 'function') activeFit();
    });
    resizeBound = true;
  }

  activeFit = () => fitNotebook(root);
  activeFit();

  if (root.dataset.bookSessionOpen === 'true') {
    setCoverState(root, 'open');
    setCoverVisibility(root, false);
  } else {
    setCoverState(root, 'closed');
    setCoverVisibility(root, true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animateBookOpen(root);
      });
    });
  }

  root.__pokemonNotebookClose = onComplete => {
    animateBookClose(root, onComplete);
  };

  root.__pokedexClose = onComplete => {
    animateBookClose(root, onComplete);
  };

  root.querySelectorAll('[data-book-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.bookAction;
      const handler = handlers[action];
      if (typeof handler !== 'function') return;
      if (button.disabled) return;

      if (action === 'previous' || action === 'next') {
        if (root.dataset.turning === 'true' || root.dataset.detailLoading === 'true') return;
        animateNavButton(button);
        const direction = action === 'previous' ? 'previous' : 'next';
        const result = handler();

        if (result && typeof result.then === 'function') {
          root.dataset.detailLoading = 'true';
          result
            .then(payload => {
              if (!isNotebookTurnPayload(payload)) {
                root.dataset.detailLoading = 'false';
                return;
              }

              transitionNotebookTurn(root, direction, payload);
            })
            .catch(error => {
              console.error(error);
              root.dataset.detailLoading = 'false';
              root.dataset.turning = 'false';
            });
          return;
        }

        if (isNotebookTurnPayload(result)) {
          root.dataset.detailLoading = 'true';
          transitionNotebookTurn(root, direction, result);
          return;
        }

        animatePageTurn(root, direction, handler);
        return;
      }

      if (action === 'close') {
        if (root.dataset.bookClosing === 'true') return;
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

export {
  renderPokedex as renderPokemonNotebook,
  hydratePokedex as hydratePokemonNotebook,
};
