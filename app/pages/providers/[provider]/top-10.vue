<script setup lang="ts">
// עמוד /top-10 בוטל — /providers/[provider] עצמו מציג כיום את הטופ 10
// המלא של החודש הנוכחי (כולל ניווט חודש קודם/הבא, ביקורת עורך וכו').
// הפניה 301 כדי לא לשבור קישורים/סימניות ישנים ל-URL הזה.
const route = useRoute()
await navigateTo(`/providers/${route.params.provider}`, { redirectCode: 301 })
</script>

<template />
