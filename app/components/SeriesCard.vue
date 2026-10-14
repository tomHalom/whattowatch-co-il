<template>
  <article
    class="series-card card-enter"
    :class="`rank-${rank <= 3 ? rank : 'other'}`"
    @click="$emit('openModal')"
    tabindex="0"
    role="button"
    :aria-label="`${nameHe || name} — מקום ${rank}${isNew === true ? `, ${$t('series.newThisMonth')}` : ''}`"
    @keydown.enter="$emit('openModal')"
    @keydown.space.prevent="$emit('openModal')"
  >
    <!-- Oversized rank numeral -->
    <span class="rank-bg" aria-hidden="true">{{ rank }}</span>

    <!-- Poster -->
    <div class="card-poster-wrap">
      <img
        v-if="posterPath"
        :src="posterPath"
        :alt="`פוסטר ${nameHe || name}`"
        class="card-poster"
        loading="lazy"
      />
      <div v-else class="card-poster-placeholder">
        <span>🎬</span>
      </div>

      <!-- Rank numeral over the poster — echoes the homepage hero's big
           "TOP10" background text, tinted per medal color, glowing with
           no background box. This is the only rank indicator on the
           card now (replaced the small circular badge). Toggle
           SHOW_POSTER_RANK_ART to false to hide it entirely. -->
      <span v-if="SHOW_POSTER_RANK_ART" class="poster-rank-art" :class="medalClass" aria-hidden="true">
        {{ rank }}
      </span>
      <!-- Hover overlay — clicking the card opens the details modal, not
           inline playback, so this is an "expand for details" icon, not
           a play triangle. -->
      <div class="trailer-overlay">
        <span class="expand-btn">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M20 20l-4.8-4.8" />
          </svg>
        </span>
      </div>
      <!-- Score pill on poster -->
      <div class="poster-score-pill">
        <span class="pill-star">★</span>
        <span class="pill-num">{{ voteAverage?.toFixed(1) }}</span>
      </div>
      <span v-if="isNew === true" class="poster-new-badge" aria-hidden="true">
        {{ $t('series.newThisMonth') }}
      </span>
    </div>

    <!-- Card content -->
    <div class="card-body">
      <h3 class="card-title">{{ nameHe || name }}</h3>
      <p class="card-title-en">{{ name }}</p>

      <!-- Star rating row -->
      <div class="star-row">
        <template v-for="i in 5" :key="i">
          <span class="star" :class="starClass(i)">★</span>
        </template>
        <span class="score-txt">{{ voteAverage?.toFixed(1) }}</span>
      </div>

      <!-- Genre tags -->
      <div class="genre-tags">
        <span v-for="g in (genres || []).slice(0, 2)" :key="g" class="genre-tag">{{ g }}</span>
      </div>

      <!-- Overview snippet -->
      <p class="card-overview">{{ overview }}</p>

      <!-- Footer CTA -->
      <div class="card-footer">
        <span class="cta-text">פרטים נוספים →</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  rank: number
  name: string
  nameHe?: string
  overview?: string
  posterPath?: string | null
  voteAverage?: number
  genres?: string[]
  trailerYoutubeId?: string | null
  editorReview?: string
  isNew?: boolean
}>()

defineEmits<{ openModal: [] }>()

// EXPERIMENTAL: flip to false to revert the poster-overlay rank numeral
// to the plain poster (see template + .poster-rank-art below).
const SHOW_POSTER_RANK_ART = true

const medalClass = computed(() => {
  if (props.rank === 1) return 'medal-gold'
  if (props.rank === 2) return 'medal-silver'
  if (props.rank === 3) return 'medal-bronze'
  return 'medal-plain'
})

function starClass(i: number) {
  const normalized = (props.voteAverage ?? 0) / 2
  if (i <= Math.floor(normalized)) return 'star-full'
  if (i === Math.ceil(normalized) && normalized % 1 >= 0.4) return 'star-half'
  return 'star-empty'
}
</script>

<style scoped>
/* ─── Card base ───────────────────────────────────────────── */
.series-card {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background: #1A1A1A;
  border: 1px solid rgba(255,255,255,0.07);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(.22,1,.36,1),
              box-shadow 0.3s ease,
              border-color 0.2s ease;
  display: flex;
  flex-direction: column;
}
.series-card:hover,
.series-card:focus-visible {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.series-card:focus-visible {
  outline: 2px solid var(--clr-gold);
  outline-offset: 3px;
}

/* Rank-specific accent colors */
.rank-1 { border-color: rgba(255,215,0,0.3); background: linear-gradient(160deg, #1E1A0E 0%, #1A1A1A 40%); }
.rank-1:hover { border-color: rgba(255,215,0,0.6); box-shadow: 0 20px 60px rgba(255,215,0,0.15); }
.rank-2 { border-color: rgba(192,192,192,0.25); background: linear-gradient(160deg, #181818 0%, #1A1A1A 40%); }
.rank-2:hover { border-color: rgba(192,192,192,0.5); box-shadow: 0 20px 60px rgba(192,192,192,0.1); }
.rank-3 { border-color: rgba(205,127,50,0.25); background: linear-gradient(160deg, #1C1510 0%, #1A1A1A 40%); }
.rank-3:hover { border-color: rgba(205,127,50,0.5); box-shadow: 0 20px 60px rgba(205,127,50,0.12); }
.rank-other:hover { border-color: rgba(230,60,40,0.3); box-shadow: 0 20px 60px rgba(230,60,40,0.08); }

/* ─── Oversized rank numeral ──────────────────────────────── */
.rank-bg {
  position: absolute;
  bottom: -1rem;
  left: -0.5rem;
  font-size: clamp(5rem, 12vw, 8rem);
  font-weight: 900;
  line-height: 1;
  pointer-events: none;
  select: none;
  opacity: 0.04;
  color: #fff;
  z-index: 0;
}
.rank-1 .rank-bg { color: #FFD700; opacity: 0.07; }
.rank-2 .rank-bg { color: #C0C0C0; opacity: 0.06; }
.rank-3 .rank-bg { color: #CD7F32; opacity: 0.06; }

/* ─── Poster ──────────────────────────────────────────────── */
.card-poster-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  overflow: hidden;
  flex-shrink: 0;
}

/* ─── Poster rank art — the only rank indicator on the card ───────── */
.poster-rank-art {
  position: absolute;
  top: 0.2rem;
  right: 0.45rem;
  z-index: 5;
  font-family: 'Frank Ruhl Libre', serif;
  font-size: clamp(2.6rem, 11vw, 4.75rem);
  font-weight: 900;
  line-height: 0.8;
  opacity: 0.9;
  pointer-events: none;
  user-select: none;
  color: #F2EEE4;
  text-shadow: 0 0 10px rgba(242,238,228,0.5), 0 2px 8px rgba(0,0,0,0.8);
}
.poster-rank-art.medal-gold {
  color: #FFD700;
  text-shadow: 0 0 16px rgba(255,215,0,0.85), 0 0 6px rgba(255,215,0,0.85), 0 2px 8px rgba(0,0,0,0.8);
}
.poster-rank-art.medal-silver {
  color: #E8E8E8;
  text-shadow: 0 0 16px rgba(232,232,232,0.75), 0 0 6px rgba(232,232,232,0.75), 0 2px 8px rgba(0,0,0,0.8);
}
.poster-rank-art.medal-bronze {
  color: #E5A05C;
  text-shadow: 0 0 16px rgba(205,127,50,0.85), 0 0 6px rgba(205,127,50,0.85), 0 2px 8px rgba(0,0,0,0.8);
}
.card-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  transition: transform 0.5s cubic-bezier(.22,1,.36,1);
}
.series-card:hover .card-poster {
  transform: scale(1.05);
}
.card-poster-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}
.trailer-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.series-card:hover .trailer-overlay {
  opacity: 1;
}
.expand-btn {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: rgba(232,163,61,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #14131C;
  box-shadow: 0 4px 20px rgba(232,163,61,0.5);
  transition: transform 0.2s;
}
.series-card:hover .expand-btn {
  transform: scale(1.1);
}
.poster-score-pill {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(0,0,0,0.75);
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 2rem;
  padding: 0.2rem 0.5rem;
  backdrop-filter: blur(4px);
}
.pill-star { color: #FFD700; font-size: 0.75rem; }
.pill-num  { color: #FFD700; font-size: 0.7rem; font-weight: 700; font-family: monospace; }

/* ─── "New this month" ticket stub ────────────────────────── */
.poster-new-badge {
  position: absolute;
  top: 0.625rem;
  inset-inline-end: 0.625rem;
  z-index: 6;
  max-inline-size: calc(100% - 7.5rem);
  display: inline-flex;
  align-items: center;
  padding-block: 0.25rem;
  padding-inline: 0.625rem 0.5rem;
  background: var(--clr-gold);
  color: var(--clr-bg);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1.2;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  border-radius: 2px;
  border-inline-start: 1.5px dashed rgba(20,19,28,0.45);
  box-shadow: 0 2px 8px rgba(0,0,0,0.55);
  transform: rotate(-2deg);
  transform-origin: center;
  pointer-events: none;
  user-select: none;
}
@media (min-width: 1024px) {
  .poster-new-badge { font-size: 0.8125rem; padding-block: 0.3rem; }
}
@media (prefers-reduced-motion: no-preference) {
  .poster-new-badge { transition: transform 0.3s cubic-bezier(.22,1,.36,1); }
  .series-card:hover .poster-new-badge,
  .series-card:focus-visible .poster-new-badge { transform: rotate(0deg); }
}

/* ─── Card body ───────────────────────────────────────────── */
.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
  flex: 1;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #F5F0E8;
  line-height: 1.3;
  margin: 0;
}
.card-title-en {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.3);
  font-family: monospace;
  margin: 0;
}

/* Star row */
.star-row {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}
.star {
  font-size: 1rem;
  line-height: 1;
  transition: transform 0.15s;
}
.star-full  { color: #FFD700; text-shadow: 0 0 6px rgba(255,215,0,0.5); }
.star-half  { color: #FFD700; opacity: 0.55; }
.star-empty { color: rgba(255,255,255,0.12); }
.series-card:hover .star-full {
  transform: scale(1.1);
}
.score-txt {
  margin-right: 0.35rem;
  font-size: 0.72rem;
  color: rgba(255,215,0,0.7);
  font-family: monospace;
  font-weight: 700;
}

/* Genre tags */
.genre-tags {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.genre-tag {
  padding: 0.15rem 0.5rem;
  font-size: 0.62rem;
  border-radius: 0.25rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
  font-family: monospace;
  letter-spacing: 0.02em;
}

/* Overview */
.card-overview {
  font-size: 0.8rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.55);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer */
.card-footer {
  margin-top: auto;
  padding-top: 0.5rem;
}
.cta-text {
  font-size: 0.72rem;
  color: rgba(230,60,40,0.7);
  font-weight: 600;
  transition: color 0.2s;
  font-family: monospace;
}
.series-card:hover .cta-text {
  color: #E63C28;
}

/* Entrance animation */
.card-enter {
  animation: fadeSlideUp 0.5s ease both;
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
