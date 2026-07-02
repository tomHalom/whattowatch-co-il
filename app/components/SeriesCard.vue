<script setup lang="ts">
const props = defineProps<{
  rank: number
  name: string
  overview: string
  posterPath: string | null
  voteAverage: number
  genres: string[]
  trailerYoutubeId: string | null
  to?: string
}>()

// טריילר לא נטען עד קליק — כדי לא לפגוע ב-CLS/ביצועים (lazy iframe).
const showTrailer = ref(false)
</script>

<template>
  <article
    class="card-enter group relative overflow-hidden rounded-xl bg-charcoal-deep ring-1 ring-charcoal-line transition-transform duration-300 hover:-translate-y-1 hover:ring-sunset-gold/30 hover:shadow-lg hover:shadow-black/40"
  >
    <!-- Oversized background rank numeral — editorial zine signature -->
    <span class="rank-bg" aria-hidden="true">{{ rank }}</span>

    <!-- Foreground rank badge -->
    <span class="rank-badge absolute right-3 top-2 z-10 select-none">{{ rank }}</span>

    <!-- Poster / trailer area -->
    <div class="relative aspect-video bg-charcoal-night">
      <template v-if="showTrailer && trailerYoutubeId">
        <iframe
          class="h-full w-full"
          :src="`https://www.youtube-nocookie.com/embed/${trailerYoutubeId}?autoplay=1`"
          title="נגן טריילר"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        />
      </template>
      <template v-else>
        <NuxtImg
          v-if="posterPath"
          :src="posterPath"
          :alt="`פוסטר ${name}`"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width="500"
          height="281"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-mist-grey text-sm">
          {{ name }}
        </div>
        <button
          v-if="trailerYoutubeId"
          type="button"
          class="absolute inset-0 flex items-center justify-center bg-charcoal-night/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          :aria-label="$t('series.watchTrailer')"
          @click="showTrailer = true"
        >
          <span class="rounded-full bg-sunset-gold px-5 py-2 text-sm font-semibold text-charcoal-night shadow-lg">
            ▶ {{ $t('series.watchTrailer') }}
          </span>
        </button>
      </template>
    </div>

    <!-- Card body -->
    <div class="relative z-10 p-4">
      <h3 class="font-display text-lg font-bold text-milk-parchment leading-snug">
        <NuxtLink v-if="to" :to="to" class="hover:text-sunset-gold transition-colors after:absolute after:inset-0">
          {{ name }}
        </NuxtLink>
        <template v-else>{{ name }}</template>
      </h3>
      <p class="mt-1 line-clamp-3 text-sm text-mist-grey leading-relaxed">{{ overview }}</p>
      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span v-if="voteAverage" class="font-utility text-sunset-gold">★ {{ voteAverage }}</span>
        <span
          v-for="genre in genres.slice(0, 3)"
          :key="genre"
          class="rounded-full bg-charcoal-line px-2 py-0.5 text-mist-grey"
        >
          {{ genre }}
        </span>
      </div>
    </div>
  </article>
</template>
