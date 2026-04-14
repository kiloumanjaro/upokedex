import { imageUrl } from "../config/app.config.js";
import { STAT_COLORS, STAT_LABELS } from "../constants/statMeta.js";
import { TYPE_BG } from "../constants/typeColors.js";
import { capitalize } from "../utils/capitalize.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import { FALLBACK_IMAGE } from "../utils/fallbackImage.js";
import { formatId } from "../utils/formatId.js";

const BOOK_WIDTH = 1260;
const BOOK_HEIGHT = 820;
const PAGE_GAP = 8;
const BOOK_PADDING = 8;
const BOOK_BORDER_WIDTH = 2;
const PAGE_WIDTH =
  (BOOK_WIDTH - BOOK_PADDING * 2 - BOOK_BORDER_WIDTH * 2 - PAGE_GAP) / 2;
const PAGE_FLIP_BLEED = 48;
const PAGE_FLIP_DURATION = 600;
const PAGE_FLIP_CLEANUP_DELAY = 610;
const BOOK_COVER_COLOR = "#f0c020";
const BOOK_SPRING_COLOR = "#B0B0B0";
const COVER_SPRING_CONNECTOR_WIDTH = PAGE_GAP + 10;
const LIGHT_TYPE_TEXT = new Set([
  "electric",
  "ice",
  "rock",
  "flying",
  "steel",
  "fairy",
]);
const PAGE_TURN_SHIFT = 4;
let activeFit = null;
let resizeBound = false;

function renderPageRings(side) {
  return `
    <div data-ring-group="${side}" class="book-rings book-rings--${side}">
      ${[0, 1, 2]
        .map(
          (i) => `
        <div data-ring="${i}" class="book-ring">
          <span class="book-ring__outer"></span>
          <span class="book-ring__inner"></span>
          <span class="book-ring__bar"></span>
        </div>
      `,
        )
        .join("")}
    </div>`;
}

function renderCoverSpringConnectors() {
  return `
    <div
      data-cover-spring-connectors
      class="book-spine"
      style="width:${COVER_SPRING_CONNECTOR_WIDTH}px"
      aria-hidden="true"
    >
      ${[0, 1, 2]
        .map(
          (i) => `
        <div class="book-spine__row">
          <div data-cover-spring="${i}" class="book-spine__connector"></div>
        </div>
      `,
        )
        .join("")}
    </div>`;
}

function cleanText(value = "") {
  return value
    .replace(/[\f\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getEnglishGenus(species) {
  const genus = species?.genera?.find((entry) => entry.language.name === "en");
  return genus ? genus.genus : "Pokemon";
}

function getEnglishFlavor(species) {
  const entry = species?.flavor_text_entries?.find(
    (item) => item.language.name === "en",
  );

  return entry
    ? cleanText(entry.flavor_text)
    : "A page is waiting to be filled with more field notes.";
}

function getGenerationLabel(species) {
  const raw = species?.generation?.name;
  if (!raw) return "Unknown";
  return `Gen ${raw.replace("generation-", "").toUpperCase()}`;
}

function getHabitatLabel(species) {
  return species?.habitat ? capitalize(species.habitat.name) : "Unknown";
}

function getShapeLabel(species) {
  return species?.shape ? capitalize(species.shape.name) : "Unknown";
}

function formatHeight(height) {
  if (typeof height !== "number") return "Unknown";
  return `${(height / 10).toFixed(1)} m`;
}

function formatWeight(weight) {
  if (typeof weight !== "number") return "Unknown";
  return `${(weight / 10).toFixed(1)} kg`;
}

function getStatTotal(stats = []) {
  return stats.reduce((total, stat) => total + (stat.base_stat ?? 0), 0);
}

function getTypeTextColor(type) {
  return LIGHT_TYPE_TEXT.has(type) ? "#121212" : "#FFFFFF";
}

function renderTypeBadge(type, size = "lg") {
  const color = TYPE_BG[type] ?? "#64748b";
  const textColor = getTypeTextColor(type);

  return `
    <span
      class="type-badge type-badge--${size}"
      data-type="${type}"
      style="--type-bg:${color};--type-text:${textColor};"
    >
      <span class="type-badge__label">${escapeHtml(capitalize(type))}</span>
    </span>`;
}

function renderTypePills(types) {
  return types.map((type) => renderTypeBadge(type, "lg")).join("");
}

function renderMetricCard(label, value, accent) {
  return `
    <div class="pokedex-metric" style="--metric-accent:${accent}">
      <p class="pokedex-metric__label">${escapeHtml(label)}</p>
      <p class="pokedex-metric__value">${escapeHtml(value)}</p>
    </div>`;
}

function renderNoteCard(label, value) {
  return `
    <div class="pokedex-note">
      <span class="pokedex-note__label">${escapeHtml(label)}</span>
      <span class="pokedex-note__value">${escapeHtml(value)}</span>
    </div>`;
}

function renderStatRows(stats = []) {
  return stats
    .map((stat) => {
      const pct = Math.min(
        100,
        Math.round(((stat.base_stat ?? 0) / 255) * 100),
      );
      const label = STAT_LABELS[stat.stat.name] ?? capitalize(stat.stat.name);
      const color = STAT_COLORS[stat.stat.name] ?? "#64748b";

      return `
        <div class="pokedex-stat-row">
          <div class="pokedex-stat-label">${escapeHtml(label)}</div>
          <div class="pokedex-stat-value">${stat.base_stat ?? 0}</div>
          <div class="pokedex-stat-track">
            <div
              class="pokedex-stat-fill"
              data-stat-pct="${pct}"
              style="width:0;background:${color};box-shadow:0 0 16px ${color}66"
            ></div>
          </div>
        </div>`;
    })
    .join("");
}

function renderAbilities(abilities = []) {
  const picks = abilities.slice(0, 4);
  const extraCount = Math.max(0, abilities.length - picks.length);

  return `
    <div class="ability-grid">
      ${picks
        .map((entry) => {
          const base = capitalize(entry.ability.name);
          const label = entry.is_hidden ? `${base} (Hidden)` : base;
          const background = entry.is_hidden ? "var(--yellow)" : "var(--card)";

          return `
            <span
              class="ability-chip${entry.is_hidden ? " ability-chip--hidden" : ""}"
              style="--ability-bg:${background}"
            >
              ${escapeHtml(label)}
            </span>`;
        })
        .join("")}
      ${
        extraCount
          ? `<span class="ability-chip ability-chip--more">
              +${extraCount} more
            </span>`
          : ""
      }
    </div>`;
}

function renderWeaknesses(weaknesses = []) {
  if (!weaknesses.length) {
    return `
      <span class="type-badge type-badge--sm type-badge--empty">
        No weakness data
      </span>`;
  }

  return weaknesses.map((type) => renderTypeBadge(type, "sm")).join("");
}

function renderMoves(moves = []) {
  const picks = moves.slice(0, 4);
  const extraCount = Math.max(0, moves.length - picks.length);

  if (!picks.length) {
    return '<p class="moves-empty">No move data available yet.</p>';
  }

  return `
    <div class="moves-grid">
      ${picks
        .map((move) => {
          return `
            <div class="move-chip">
              ${escapeHtml(capitalize(move.move.name))}
            </div>`;
        })
        .join("")}
      ${
        extraCount
          ? `<div class="move-chip move-chip--more">
              +${extraCount} more moves in the Pokedex
            </div>`
          : ""
      }
    </div>`;
}

function renderNotesGrid(notes) {
  return `
    <div class="pokedex-notes-grid">
      ${notes
        .map(
          (note) => `
            ${renderNoteCard(note.label, note.value)}`,
        )
        .join("")}
    </div>`;
}

function closeIcon() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4">
      <path d="M18 6 6 18M6 6l12 12"></path>
    </svg>`;
}

function chevronIcon(direction) {
  const path = direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-6 w-6">
      <path d="${path}"></path>
    </svg>`;
}

export function renderPokedex(
  { id, totalCount = 0, pokemon, species, weaknesses = [] },
  { hideUntilReady = false } = {},
) {
  const types = pokemon.types.map((entry) => entry.type.name);
  const mainColor = TYPE_BG[types[0]] ?? "#8b5e34";
  const genus = getEnglishGenus(species);
  const flavor = shortenText(getEnglishFlavor(species), 160);
  const generation = getGenerationLabel(species);
  const habitat = getHabitatLabel(species);
  const shape = getShapeLabel(species);
  const statTotal = getStatTotal(pokemon.stats);
  const progress = totalCount
    ? Math.max(1, Math.round((id / totalCount) * 100))
    : 0;
  const canNavigate = totalCount > 1;
  const detailNotes = [
    { label: "Base EXP", value: String(pokemon.base_experience ?? "Unknown") },
    { label: "Generation", value: generation },
    { label: "Shape", value: shape },
    { label: "Habitat", value: habitat },
  ];

  return `
    <div data-book-stage class="pokedex-stage">
      <button
        type="button"
        data-book-action="previous"
        data-book-nav="true"
        ${canNavigate ? "" : "disabled"}
        class="pokedex-nav pokedex-nav--prev"
        aria-label="Previous Pokemon"
      >
        <span class="pokedex-nav__icon">${chevronIcon("left")}</span>
      </button>

      <div
        data-book-shell
        class="pokedex-shell"
        style="width:${BOOK_WIDTH}px;height:${BOOK_HEIGHT}px;opacity:${hideUntilReady ? "0" : "1"};transition:opacity .15s ease-out"
      >
        <div
          data-book-root
          class="pokedex-book"
          style="padding:${BOOK_PADDING}px;background:${BOOK_COVER_COLOR};--accent:${mainColor};--spring-color:${BOOK_SPRING_COLOR};"
        >
          <div data-book-spread class="pokedex-spread" style="gap:${PAGE_GAP}px">
            <section data-book-page="left" class="pokedex-page pokedex-page--left">
              <div class="pokedex-page-inner">
              <div class="pokedex-hero">
                <div class="pokedex-title">
                  <span class="pokedex-eyebrow">Pokedex Entry</span>
                  <h2 class="pokedex-name">${escapeHtml(capitalize(pokemon.name))}</h2>
                </div>
                <div class="pokedex-id-card">
                  <span class="pokedex-id-label">Pokedex ID</span>
                  <span class="pokedex-id-value">${escapeHtml(formatId(id))}</span>
                </div>
              </div>

                <div class="pokedex-hero-grid">
                  <div class="pokedex-image-panel">
                    <div class="pokedex-image-frame">
                      <img
                        data-book-image
                        src="${imageUrl(id)}"
                        alt="${escapeHtml(pokemon.name)}"
                        class="pokedex-image"
                      />
                    </div>
                  </div>

                  <div class="pokedex-summary-panel">
                    <div class="pokedex-genus">
                      <span class="pokedex-genus__label">Category</span>
                      <span class="pokedex-genus__value">${escapeHtml(genus)}</span>
                    </div>
                    <div class="pokedex-summary-head">
                      <span class="pokedex-section-label">Field Summary</span>
                    </div>
                    <p class="pokedex-summary-text">
                      ${escapeHtml(flavor)}
                    </p>
                  </div>
                </div>

                <div class="pokedex-type-row">
                  ${renderTypePills(types)}
                </div>

                <div class="pokedex-metrics">
                  ${renderMetricCard("Height", formatHeight(pokemon.height), "#121212")}
                  ${renderMetricCard("Weight", formatWeight(pokemon.weight), "#121212")}
                  ${renderMetricCard("Stat Total", String(statTotal), "#121212")}
                </div>

                <div class="pokedex-notes">
                  <div class="pokedex-section-label">Pokedex Details</div>
                  ${renderNotesGrid(detailNotes)}
                </div>
              </div>
              ${renderPageRings("right")}
            </section>

            <section data-book-page="right" class="pokedex-page pokedex-page--right">
              <button
                type="button"
                data-book-action="close"
                class="pokedex-close"
                aria-label="Close notebook"
              >
                ${closeIcon()}
              </button>

              <div class="pokedex-page-inner pokedex-page-inner--right">
                <div class="pokedex-right-top">
                  <div class="pokedex-card pokedex-progress">
                    <div class="pokedex-card-head">
                      <span class="pokedex-section-label">Pokedex Progress</span>
                    </div>
                    <div class="pokedex-progress-value">
                      ${totalCount ? `${progress}%` : escapeHtml(formatId(id))}
                    </div>
                    <div class="pokedex-progress-sub">
                      ${totalCount ? `Entry ${id} of ${totalCount}` : "Single entry loaded"}
                    </div>
                  </div>

                  <div class="pokedex-card pokedex-abilities">
                    <div class="pokedex-card-head">
                      <span class="pokedex-section-label">Abilities</span>
                    </div>
                    ${renderAbilities(pokemon.abilities)}
                  </div>
                </div>

                <div class="pokedex-card pokedex-stats">
                  <div class="pokedex-card-head pokedex-card-head--split">
                    <span class="pokedex-section-label">Base Stats</span>
                    <span class="pokedex-meta">Scaled to 255</span>
                  </div>
                  <div class="pokedex-stats-list">
                    ${renderStatRows(pokemon.stats)}
                  </div>
                </div>

                <div class="pokedex-bottom-grid">
                  <div class="pokedex-card pokedex-moves">
                    <div class="pokedex-card-head">
                      <span class="pokedex-section-label">Moves To Remember</span>
                    </div>
                    ${renderMoves(pokemon.moves)}
                  </div>

                  <div class="pokedex-card pokedex-weakness">
                    <div class="pokedex-card-head">
                      <span class="pokedex-section-label">Weaknesses</span>
                    </div>
                    <div class="pokedex-weakness-grid">
                      ${renderWeaknesses(weaknesses)}
                    </div>
                  </div>
                </div>
              </div>
              ${renderPageRings("left")}
            </section>

            ${renderCoverSpringConnectors()}
          </div>

          <div data-book-covers class="pointer-events-none absolute inset-0 z-20">
            <div
              data-book-cover="left"
              class="absolute left-0 top-0 h-full w-1/2 overflow-hidden rounded-l-[18px]"
              style="transform-origin:right center;transform-style:preserve-3d;transform:rotateY(0deg);z-index:30;"
            >
              <div
                class="relative h-full rounded-l-[18px]"
                style="background:${BOOK_COVER_COLOR};backface-visibility:hidden;"
              >
              </div>
              <div
                class="absolute inset-0 rounded-r-[18px] bg-white"
                style="transform:rotateY(180deg);backface-visibility:hidden;"
              ></div>
            </div>

            <div
              data-book-cover="right"
              class="absolute right-0 top-0 h-full w-1/2 overflow-hidden rounded-r-[18px]"
              style="transform-origin:left center;transform-style:preserve-3d;transform:rotateY(0deg);z-index:30;"
            >
              <div
                class="relative h-full rounded-r-[18px]"
                style="background:${BOOK_COVER_COLOR};backface-visibility:hidden;"
              >
              </div>
              <div
                class="absolute inset-0 rounded-l-[18px] bg-white"
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
        ${canNavigate ? "" : "disabled"}
        class="pokedex-nav pokedex-nav--next"
        aria-label="Next Pokemon"
      >
        <span class="pokedex-nav__icon">${chevronIcon("right")}</span>
      </button>
    </div>`;
}

function setCoverState(root, state) {
  const leftCover = root.querySelector('[data-book-cover="left"]');
  const rightCover = root.querySelector('[data-book-cover="right"]');
  if (!leftCover || !rightCover) return;

  if (state === "open") {
    leftCover.style.transform = "rotateY(-180deg)";
    rightCover.style.transform = "rotateY(180deg)";
    leftCover.style.zIndex = "10";
    rightCover.style.zIndex = "10";
    return;
  }

  leftCover.style.transform = "rotateY(0deg)";
  rightCover.style.transform = "rotateY(0deg)";
  leftCover.style.zIndex = "30";
  rightCover.style.zIndex = "30";
}

function setCoverVisibility(root, visible) {
  const covers = root.querySelector("[data-book-covers]");
  if (!covers) return;

  covers.style.opacity = visible ? "1" : "0";
  covers.style.visibility = visible ? "visible" : "hidden";
}

function openBookImmediate(root) {
  root.dataset.bookOpening = "false";
  root.dataset.bookSessionOpen = "true";
  setCoverState(root, "open");
  setCoverVisibility(root, false);
}

function pulseSpineRings(root, action) {
  const group = root.querySelector(
    `[data-ring-group="${action === "next" ? "right" : "left"}"]`,
  );
  if (!group) return;

  group.querySelectorAll("[data-ring]").forEach((ring, index) => {
    if (index === 0) return;
    ring.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.08)" },
        { transform: "scale(1)" },
      ],
      {
        duration: 500,
        easing: "ease-out",
      },
    );
  });
}

function buildFlipOverlay(root, action) {
  const spread = root.querySelector("[data-book-spread]");
  const sourcePage = root.querySelector(
    `[data-book-page="${action === "next" ? "right" : "left"}"]`,
  );
  const backPage = root.querySelector(
    `[data-book-page="${action === "next" ? "left" : "right"}"]`,
  );

  if (!spread || !sourcePage || !backPage) return null;
  return buildFlipOverlayFromPages(
    root,
    action,
    sourcePage.cloneNode(true),
    backPage.cloneNode(true),
  );
}

function buildFlipOverlayFromPages(root, action, frontPage, backPage) {
  const spread = root.querySelector("[data-book-spread]");
  if (!spread || !frontPage || !backPage) return null;
  const pageWidth = getRenderedPageWidth(spread);

  const overlay = document.createElement("div");
  overlay.setAttribute("data-book-flip-overlay", action);
  overlay.className = "absolute top-0";
  overlay.style.width = `${pageWidth}px`;
  overlay.style.height = "100%";
  overlay.style.transformStyle = "preserve-3d";
  overlay.style.willChange = "transform";
  overlay.style.zIndex = "20";

  const flipper = document.createElement("div");
  flipper.setAttribute("data-book-flip-surface", "");
  flipper.style.position = "absolute";
  flipper.style.inset = "0";
  flipper.style.transformStyle = "preserve-3d";
  flipper.style.willChange = "transform";

  if (action === "next") {
    overlay.style.right = "0px";
    flipper.style.transformOrigin = "0px 50%";
  } else {
    overlay.style.left = "0px";
    flipper.style.transformOrigin = `${pageWidth}px 50%`;
  }

  const frontFace = frontPage;
  const backFace = backPage;

  frontFace.style.position = "absolute";
  frontFace.style.inset = "0";
  frontFace.style.width = "100%";
  frontFace.style.height = "100%";
  frontFace.style.backfaceVisibility = "hidden";
  frontFace.style.transformOrigin = "50% 50%";

  backFace.style.position = "absolute";
  backFace.style.inset = "0";
  backFace.style.width = "100%";
  backFace.style.height = "100%";
  backFace.style.backfaceVisibility = "hidden";
  backFace.style.transformOrigin = "50% 50%";
  backFace.style.transform = "rotateY(180deg)";

  flipper.append(frontFace, backFace);
  overlay.appendChild(flipper);
  spread.appendChild(overlay);
  return overlay;
}

function replaceNotebookPage(bookRoot, side, replacementPage) {
  const currentPage = bookRoot?.querySelector(`[data-book-page="${side}"]`);
  if (!currentPage || !replacementPage) return null;

  currentPage.replaceWith(replacementPage);
  return bookRoot.querySelector(`[data-book-page="${side}"]`);
}

function getRenderedPageWidth(spread) {
  if (!spread) return PAGE_WIDTH;
  const width = (spread.clientWidth - PAGE_GAP) / 2;
  return Number.isFinite(width) && width > 0 ? width : PAGE_WIDTH;
}

function getPageTurnShift(action) {
  return action === "next" ? -PAGE_TURN_SHIFT : PAGE_TURN_SHIFT;
}

function fitNotebook(root) {
  const stage = root.querySelector("[data-book-stage]");
  const shell = root.querySelector("[data-book-shell]");
  if (!stage || !shell) return;

  const navWidth = Array.from(
    root.querySelectorAll('[data-book-nav="true"]'),
  ).reduce((total, button) => total + button.offsetWidth, 0);
  const sideGap = root.querySelectorAll('[data-book-nav="true"]').length
    ? 32
    : 0;
  const availableWidth = Math.max(
    120,
    stage.clientWidth - navWidth - sideGap - 4 - PAGE_FLIP_BLEED * 2,
  );
  const availableHeight = Math.max(
    120,
    stage.clientHeight - 4 - PAGE_FLIP_BLEED * 2,
  );
  const widthScale = Math.max(0.1, availableWidth / BOOK_WIDTH);
  const heightScale = Math.max(0.1, availableHeight / BOOK_HEIGHT);
  shell.style.transform = `scale(${Math.min(widthScale, heightScale, 1)})`;
}

function revealNotebook(root) {
  const shell = root.querySelector("[data-book-shell]");
  if (!shell) return;
  shell.style.opacity = "1";
}

function scheduleNotebookFit(root) {
  const image = root.querySelector("[data-book-image]");
  const runFit = () => fitNotebook(root);
  const settleFit = () => {
    runFit();
    revealNotebook(root);
  };

  runFit();

  requestAnimationFrame(() => {
    runFit();

    requestAnimationFrame(() => {
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          settleFit();
        });
        return;
      }

      settleFit();
    });
  });

  if (image && !image.complete) {
    image.addEventListener("load", runFit, { once: true });
  }
}

function getPageTurnRotationKeyframes(action) {
  return action === "next"
    ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }]
    : [{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)" }];
}

function getPageTurnShiftKeyframes(action) {
  const shift = getPageTurnShift(action);

  return [
    { transform: "translateX(0px)", offset: 0 },
    { transform: `translateX(${shift}px)`, offset: 0.5 },
    { transform: `translateX(${shift}px)`, offset: 1 },
  ];
}

function getCombinedPageTurnKeyframes(action) {
  const shift = getPageTurnShift(action);

  return action === "next"
    ? [
        { transform: "translateX(0px) rotateY(0deg)", offset: 0 },
        { transform: `translateX(${shift}px) rotateY(-90deg)`, offset: 0.5 },
        { transform: `translateX(${shift}px) rotateY(-180deg)`, offset: 1 },
      ]
    : [
        { transform: "translateX(0px) rotateY(0deg)", offset: 0 },
        { transform: `translateX(${shift}px) rotateY(90deg)`, offset: 0.5 },
        { transform: `translateX(${shift}px) rotateY(180deg)`, offset: 1 },
      ];
}

function animateTurningPage(
  action,
  rotationTarget,
  shiftTarget = rotationTarget,
) {
  if (!rotationTarget) return;

  if (rotationTarget === shiftTarget) {
    rotationTarget.animate(getCombinedPageTurnKeyframes(action), {
      duration: PAGE_FLIP_DURATION,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
      fill: "forwards",
    });
    return;
  }

  rotationTarget.animate(getPageTurnRotationKeyframes(action), {
    duration: PAGE_FLIP_DURATION,
    easing: "cubic-bezier(0.4, 0, 1, 1)",
    fill: "forwards",
  });

  shiftTarget?.animate(getPageTurnShiftKeyframes(action), {
    duration: PAGE_FLIP_DURATION,
    easing: "ease-in-out",
    fill: "forwards",
  });
}

function animatePageTurn(root, action, onComplete) {
  const target =
    action === "next"
      ? root.querySelector('[data-book-page="right"]')
      : root.querySelector('[data-book-page="left"]');

  if (!target || typeof onComplete !== "function") {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  const overlay = buildFlipOverlay(root, action);
  const flipSurface = overlay?.querySelector("[data-book-flip-surface]");
  root.dataset.turning = "true";
  pulseSpineRings(root, action);

  if (overlay && flipSurface) {
    target.style.visibility = "hidden";
    animateTurningPage(action, flipSurface, overlay);
  } else {
    animateTurningPage(action, target);
  }

  window.setTimeout(() => {
    if (overlay?.isConnected) overlay.remove();
    root.dataset.turning = "false";
    target.style.visibility = "";
    onComplete();
  }, PAGE_FLIP_CLEANUP_DELAY);
}

function isNotebookTurnPayload(value) {
  return !!(
    value &&
    typeof value === "object" &&
    value.detail &&
    value.detail.pokemon &&
    value.handlers
  );
}

function transitionNotebookTurn(root, action, payload) {
  const sourceSide = action === "next" ? "right" : "left";
  const heldSide = action === "next" ? "left" : "right";
  const currentBookRoot = root.querySelector("[data-book-root]");
  const sourcePage = currentBookRoot
    ?.querySelector(`[data-book-page="${sourceSide}"]`)
    ?.cloneNode(true);
  const heldPage = currentBookRoot
    ?.querySelector(`[data-book-page="${heldSide}"]`)
    ?.cloneNode(true);

  if (!sourcePage || !heldPage) {
    root.dataset.detailLoading = "false";
    root.innerHTML = renderPokedex(payload.detail);
    root.dataset.bookSessionOpen = "true";
    hydratePokedex(root, payload.handlers);
    return;
  }

  const temp = document.createElement("div");
  temp.innerHTML = renderPokedex(payload.detail);
  const nextStage = temp.querySelector("[data-book-stage]");
  const nextBookRoot = nextStage?.querySelector("[data-book-root]");
  const backPage = nextBookRoot
    ?.querySelector(`[data-book-page="${heldSide}"]`)
    ?.cloneNode(true);
  const finalHeldPage = nextBookRoot
    ?.querySelector(`[data-book-page="${heldSide}"]`)
    ?.cloneNode(true);

  if (!nextStage || !backPage || !finalHeldPage) {
    root.dataset.detailLoading = "false";
    root.innerHTML = renderPokedex(payload.detail);
    root.dataset.bookSessionOpen = "true";
    hydratePokedex(root, payload.handlers);
    return;
  }

  root.dataset.bookSessionOpen = "true";
  root.innerHTML = nextStage.outerHTML;
  hydratePokedex(root, payload.handlers);

  const activeBookRoot = root.querySelector("[data-book-root]");
  const activeHeldPage = replaceNotebookPage(
    activeBookRoot,
    heldSide,
    heldPage,
  );
  const overlay = buildFlipOverlayFromPages(
    activeBookRoot,
    action,
    sourcePage,
    backPage,
  );
  const flipSurface = overlay?.querySelector("[data-book-flip-surface]");

  if (!activeBookRoot || !activeHeldPage || !overlay || !flipSurface) {
    root.dataset.detailLoading = "false";
    root.dataset.turning = "false";
    return;
  }

  root.dataset.detailLoading = "false";
  root.dataset.turning = "true";
  pulseSpineRings(activeBookRoot, action);

  animateTurningPage(action, flipSurface, overlay);

  window.setTimeout(() => {
    if (overlay.isConnected) overlay.remove();
    replaceNotebookPage(activeBookRoot, heldSide, finalHeldPage);
    root.dataset.turning = "false";
  }, PAGE_FLIP_CLEANUP_DELAY);
}

function animateNavButton(button) {
  button.animate(
    [
      {
        transform: "translate(0px, 0px) scale(1)",
        boxShadow: "3px 3px 0px 0px #2d2d2d",
      },
      {
        transform: "translate(1px, 1px) scale(0.96)",
        boxShadow: "2px 2px 0px 0px #2d2d2d",
      },
      {
        transform: "translate(0px, 0px) scale(1)",
        boxShadow: "3px 3px 0px 0px #2d2d2d",
      },
    ],
    {
      duration: 180,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  );
}

export function hydratePokedex(root, handlers = {}) {
  root.dataset.turning = "false";
  root.dataset.detailLoading = "false";
  root.dataset.bookClosing = "false";
  root.dataset.bookOpening = "false";

  if (!resizeBound) {
    window.addEventListener("resize", () => {
      if (typeof activeFit === "function") activeFit();
    });
    resizeBound = true;
  }

  activeFit = () => fitNotebook(root);
  scheduleNotebookFit(root);

  if (root.dataset.bookSessionOpen === "true") {
    setCoverState(root, "open");
    setCoverVisibility(root, false);
  } else {
    openBookImmediate(root);
  }

  root.__pokemonNotebookClose = (onComplete) => {
    root.dataset.bookClosing = "false";
    root.dataset.bookSessionOpen = "false";
    setCoverVisibility(root, false);
    if (typeof onComplete === "function") onComplete();
  };

  root.__pokedexClose = (onComplete) => {
    root.dataset.bookClosing = "false";
    root.dataset.bookSessionOpen = "false";
    setCoverVisibility(root, false);
    if (typeof onComplete === "function") onComplete();
  };

  root.querySelectorAll("[data-book-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.bookAction;
      const handler = handlers[action];
      if (typeof handler !== "function") return;
      if (button.disabled) return;

      if (action === "previous" || action === "next") {
        if (
          root.dataset.turning === "true" ||
          root.dataset.detailLoading === "true"
        )
          return;
        animateNavButton(button);
        const direction = action === "previous" ? "previous" : "next";
        const result = handler();

        if (result && typeof result.then === "function") {
          root.dataset.detailLoading = "true";
          result
            .then((payload) => {
              if (!isNotebookTurnPayload(payload)) {
                root.dataset.detailLoading = "false";
                return;
              }

              transitionNotebookTurn(root, direction, payload);
            })
            .catch((error) => {
              console.error(error);
              root.dataset.detailLoading = "false";
              root.dataset.turning = "false";
            });
          return;
        }

        if (isNotebookTurnPayload(result)) {
          root.dataset.detailLoading = "true";
          transitionNotebookTurn(root, direction, result);
          return;
        }

        animatePageTurn(root, direction, handler);
        return;
      }

      if (action === "close") {
        if (root.dataset.bookClosing === "true") return;
      }

      handler();
    });
  });

  const image = root.querySelector("[data-book-image]");
  if (image) {
    image.addEventListener(
      "error",
      () => {
        image.src = FALLBACK_IMAGE;
      },
      { once: true },
    );
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.querySelectorAll("[data-stat-pct]").forEach((fill) => {
        fill.style.width = `${fill.dataset.statPct}%`;
      });
    });
  });
}

export {
  renderPokedex as renderPokemonNotebook,
  hydratePokedex as hydratePokemonNotebook,
};
