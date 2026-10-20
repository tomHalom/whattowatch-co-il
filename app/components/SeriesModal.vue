<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="series"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="series.nameHe || series.name"
        @click.self="emit('close')"
      >
        <div class="modal-frame">
          <button
            class="modal-close"
            aria-label="סגור"
            @click="emit('close')"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="modal-close-label">סגור</span>
          </button>
        <div ref="panelEl" class="modal-panel" dir="rtl" @scroll="measureScroll">

          <!-- Backdrop image blur -->
          <div
            v-if="series.backdropPath"
            class="modal-backdrop-img"
            :style="{ backgroundImage: `url(${series.backdropPath})` }"
          />

          <div ref="contentEl" class="modal-content">
            <!-- Left: Poster -->
            <div class="modal-poster-col">
              <div class="modal-poster-wrap">
                <img
                  v-if="series.posterPath"
                  :src="posterSrc(series.posterPath)"
                  :alt="series.nameHe || series.name"
                  class="modal-poster"
                  @load="measureScroll"
                />
                <div v-else class="modal-poster-placeholder">
                  <span>🎬</span>
                </div>
                <!-- Rank badge — special color per top-3 position, plain numeral -->
                <div class="modal-rank-badge" :class="rankClass">
                  {{ series.rank }}
                </div>
              </div>
            </div>

            <!-- Right: Details -->
            <div class="modal-details-col">
              <div class="modal-meta-row">
                <span v-for="g in (series.genres || [])" :key="g" class="modal-genre-tag">{{ g }}</span>
                <span v-if="series.firstAirDate" class="modal-year">
                  {{ new Date(series.firstAirDate).getFullYear() }}
                </span>
                <span v-if="series.seasons" class="modal-seasons">
                  {{ series.seasons === 1 ? 'עונה אחת' : `${series.seasons} עונות` }}
                </span>
              </div>

              <h2 class="modal-title">{{ series.nameHe || series.name }}</h2>
              <p class="modal-title-en" dir="ltr">{{ series.name }}</p>

              <!-- Star rating -->
              <div class="modal-rating">
                <div class="modal-stars">
                  <template v-for="i in 5" :key="i">
                    <span class="modal-star" :class="starClass(i, series.voteAverage)">★</span>
                  </template>
                </div>
                <span class="modal-score">{{ series.voteAverage?.toFixed(1) }}/10</span>
              </div>

              <!-- Overview -->
              <p class="modal-overview">{{ series.overview }}</p>

              <!-- Editor review -->
              <div v-if="series.editorReview" class="modal-editor-review">
                <div class="editor-review-header">
                  <span class="editor-icon">✍️</span>
                  <span class="editor-label">ביקורת הבינג'יונרים</span>
                </div>
                <blockquote class="editor-quote">{{ series.editorReview }}</blockquote>
              </div>

              <!-- Trailer + Netflix CTAs — side by side. Once the trailer
                   starts playing, the play button gives way to the full
                   iframe below the row instead of squeezing beside it. -->
              <div class="modal-cta-row">
                <button
                  v-if="series.trailerYoutubeId && !showTrailer"
                  class="trailer-play-btn"
                  @click="showTrailer = true"
                >
                  <span class="play-circle">▶</span>
                  <span>צפה בטריילר</span>
                </button>

                <!-- קישור עומק רגיל לנטפליקס — לא מונטיזציה. Netflix אין
                     לה תוכנית affiliate פתוחה/self-serve, אז אין כאן שום
                     מזהה שותפים אמיתי; rel="sponsored" הושמט בכוונה כדי
                     לא לתייג קישור לא-ממומן כממומן. אם/כשתאושר שותפות
                     Netflix Partner Program (Impact/Partnerize), מחליפים
                     את ה-href הזה בקישור עם מזהה השותפים ומחזירים
                     rel="sponsored". תשתית affiliate אמיתית (מוגדרת
                     כבר) נמצאת ב-AffiliateLink.vue (NordVPN/Amazon). -->
                <a
                  :href="`https://www.netflix.com/search?q=${encodeURIComponent(series.name)}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="modal-netflix-btn"
                >
                  צפה בנטפליקס →
                </a>
              </div>

              <div v-if="series.trailerYoutubeId && showTrailer" class="trailer-frame-wrap">
                <iframe
                  :src="`https://www.youtube.com/embed/${series.trailerYoutubeId}?autoplay=1&rel=0`"
                  :title="`טריילר ${series.nameHe || series.name}`"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="trailer-iframe"
                />
              </div>
            </div>
          </div>
        </div>
        <p v-show="showScrollHint" class="modal-scroll-hint" aria-hidden="true">גלול להמשך ↓</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Series {
  rank: number
  name: string
  nameHe?: string
  overview?: string
  posterPath?: string | null
  backdropPath?: string | null
  voteAverage?: number
  genres?: string[]
  firstAirDate?: string | null
  seasons?: number
  trailerYoutubeId?: string | null
  editorReview?: string
}

const props = defineProps<{ series: Series | null }>()
const emit = defineEmits<{ close: [] }>()

const HASH = '#series'
const route = useRoute()
const router = useRouter()

const showTrailer = ref(false)
const panelEl = ref<HTMLElement | null>(null)
const contentEl = ref<HTMLElement | null>(null)
const showScrollHint = ref(false)

function measureScroll() {
  const el = panelEl.value
  if (!el) {
    showScrollHint.value = false
    return
  }
  showScrollHint.value = el.scrollHeight - el.clientHeight - el.scrollTop > 16
}

watch(() => props.series, (val) => {
  showTrailer.value = false
  if (!import.meta.client) return
  document.body.style.overflow = val ? 'hidden' : ''
  if (val) {
    if (route.hash !== HASH) router.push({ hash: HASH })
    nextTick(measureScroll)
  } else if (route.hash === HASH) {
    router.back()
  }
})

watch(() => route.hash, (hash) => {
  if (hash !== HASH && props.series) emit('close')
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (route.hash === HASH && !props.series) router.replace({ hash: '' })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  if (import.meta.client) document.body.style.overflow = ''
})

watch(contentEl, (el, _, onCleanup) => {
  if (!el) return
  const observer = new ResizeObserver(() => measureScroll())
  observer.observe(el)
  measureScroll()
  onCleanup(() => observer.disconnect())
})

const rankClass = computed(() => {
  const r = props.series?.rank
  if (r === 1) return 'rank-gold'
  if (r === 2) return 'rank-silver'
  if (r === 3) return 'rank-bronze'
  return 'rank-plain'
})

function starClass(i: number, score?: number) {
  if (!score) return 'star-empty'
  const normalized = score / 2
  if (i <= Math.floor(normalized)) return 'star-full'
  if (i === Math.ceil(normalized) && normalized % 1 >= 0.4) return 'star-half'
  return 'star-empty'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(0.75rem, env(safe-area-inset-top)) 0.75rem max(0.75rem, env(safe-area-inset-bottom));
  backdrop-filter: blur(4px);
}

.modal-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  min-height: 0;
  max-height: 100%;
}

.modal-panel {
  position: relative;
  z-index: 1;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1.25rem;
  width: 100%;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  box-shadow: 0 32px 80px rgba(0,0,0,0.8);
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.35) transparent;
}

.modal-scroll-hint {
  position: absolute;
  inset-inline: 0;
  bottom: 0.7rem;
  z-index: 5;
  width: max-content;
  margin-inline: auto;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(20,20,20,0.94);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  text-align: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #f2eee4;
  pointer-events: none;
}

.modal-backdrop-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center top;
  opacity: 0.07;
  filter: blur(2px);
  pointer-events: none;
}

.modal-close {
  position: absolute;
  top: 0.7rem;
  inset-inline-end: 0.7rem;
  z-index: 20;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(20,20,20,0.9);
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0;
  transition: all 0.15s;
}
.modal-close:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border-color: rgba(255,255,255,0.3);
}
.modal-close-label { display: none; }

@media (max-width: 700px) {
  .modal-close {
    width: auto;
    height: 2.25rem;
    padding-inline: 0.7rem 0.85rem;
    gap: 0.35rem;
    border-radius: 999px;
  }
  .modal-close-label {
    display: inline;
    font-size: 0.8rem;
    font-weight: 700;
  }
  .modal-poster-wrap {
    width: min(128px, 34vw);
    margin-inline: auto;
  }
}

.modal-content {
  display: grid;
  grid-template-columns: minmax(140px, 200px) minmax(0, 1fr);
  gap: 1.25rem;
  padding: 3.25rem 1.15rem 1.35rem;
  position: relative;
}

@media (max-width: 700px) {
  .modal-content { grid-template-columns: 1fr; gap: 0.85rem; padding-top: 3.4rem; }
}

.modal-poster-col { position: relative; }
.modal-poster-wrap { position: relative; }
.modal-poster {
  width: 100%;
  border-radius: 0.75rem;
  aspect-ratio: 2/3;
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}
.modal-poster-placeholder {
  aspect-ratio: 2/3;
  background: rgba(255,255,255,0.05);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}
.modal-rank-badge {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1.3rem;
  border: 3px solid;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.rank-gold   { background: linear-gradient(135deg, #FFD700, #B8860B); border-color: #FFD700; color: #3a2700; }
.rank-silver { background: linear-gradient(135deg, #E8E8E8, #9E9E9E); border-color: #C0C0C0; color: #222; }
.rank-bronze { background: linear-gradient(135deg, #CD7F32, #8B4513); border-color: #CD7F32; color: #fff; }
.rank-plain  { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.6); font-size: 1rem; }

.modal-details-col { display: flex; flex-direction: column; gap: 1rem; }

.modal-meta-row { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
.modal-genre-tag {
  padding: 0.2rem 0.6rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.3rem;
  font-size: 0.7rem;
  color: rgba(255,255,255,0.6);
  font-family: monospace;
}
.modal-year, .modal-seasons {
  font-size: 0.85rem;
  font-weight: 800;
  color: rgba(255,255,255,0.85);
  font-family: monospace;
}

.modal-title { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 900; color: #F5F0E8; line-height: 1.2; margin: 0; }
.modal-title-en { font-size: 0.85rem; color: rgba(255,255,255,0.3); font-family: monospace; margin: 0; text-align: right; width: 100%; }

.modal-rating { display: flex; align-items: center; gap: 0.75rem; }
.modal-stars { display: flex; gap: 0.1rem; }
.modal-star { font-size: 1.5rem; line-height: 1; }
.star-full  { color: #FFD700; text-shadow: 0 0 8px rgba(255,215,0,0.5); }
.star-half  { color: #FFD700; opacity: 0.6; }
.star-empty { color: rgba(255,255,255,0.15); }
.modal-score { font-size: 0.9rem; color: rgba(255,255,255,0.5); font-family: monospace; }

.modal-overview { font-size: 0.95rem; line-height: 1.7; color: rgba(255,255,255,0.7); margin: 0; }

.modal-editor-review {
  background: linear-gradient(135deg, rgba(230,60,40,0.06), rgba(255,140,0,0.04));
  border: 1px solid rgba(230,60,40,0.2);
  border-inline-start: 3px solid #E63C28;
  border-radius: 0.5rem;
  padding: 1rem;
}
.editor-review-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; }
.editor-icon { font-size: 1rem; }
.editor-label { font-size: 0.75rem; letter-spacing: 0; color: #E63C28; font-weight: 700; }
.editor-quote { margin: 0; font-size: 0.9rem; line-height: 1.6; color: rgba(255,255,255,0.75); font-style: italic; }

.modal-cta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.trailer-play-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.5rem;
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
}
.trailer-play-btn:hover { background: rgba(230,60,40,0.15); border-color: rgba(230,60,40,0.4); color: #fff; }
.play-circle {
  width: 2rem; height: 2rem; border-radius: 50%; background: #E63C28;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; color: #fff; flex-shrink: 0;
}
.trailer-frame-wrap { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem; overflow: hidden; background: #000; }
.trailer-iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }

.modal-netflix-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #E50914;
  color: #fff;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
  width: fit-content;
}
.modal-netflix-btn:hover { background: #b81c2d; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(229,9,20,0.4); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
