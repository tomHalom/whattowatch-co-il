<script setup lang="ts">
const props = defineProps<{ items: { label: string; to?: string }[] }>()
const { public: pub } = useRuntimeConfig()

useJsonLd(
  () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.to ? `${pub.siteUrl}${item.to}` : undefined,
    })),
  }),
  'breadcrumbs',
)
</script>

<template>
  <nav aria-label="breadcrumb" class="text-sm text-mist-grey">
    <ol class="flex flex-wrap items-center gap-2">
      <li v-for="(item, index) in items" :key="item.label" class="flex items-center gap-2">
        <NuxtLink v-if="item.to" :to="item.to" class="hover:text-sunset-gold transition-colors">
          {{ item.label }}
        </NuxtLink>
        <span v-else>{{ item.label }}</span>
        <span v-if="index < items.length - 1" aria-hidden="true">›</span>
      </li>
    </ol>
  </nav>
</template>
