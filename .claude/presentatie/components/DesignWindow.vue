<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import FullscreenWindow from './FullscreenWindow.vue'
defineProps({ active: Boolean })
const selected = ref('selectiescherm')
const viewport = ref()
const width = ref(1152)
const height = ref(420)
const frameStyle = computed(() => {
  const designWidth = ['stijlgids', 'index'].includes(selected.value) ? 1440 : 960
  const scale = (width.value || designWidth) / designWidth
  return { width: `${designWidth}px`, height: `${height.value / scale}px`, zoom: scale }
})
let observer
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width
    height.value = entry.contentRect.height
  })
  observer.observe(viewport.value)
})
onUnmounted(() => observer?.disconnect())
const designs = [
  { id: 'selectiescherm', label: 'Selectiescherm' },
  { id: 'level', label: 'Level + cv-paneel' },
  { id: 'stijlgids', label: 'Stijlgids' },
  { id: 'index', label: 'Volledig overzicht' },
]
</script>

<template>
  <FullscreenWindow>
  <template #toolbar>
    <button v-for="design in designs" :key="design.id" type="button" :aria-pressed="selected === design.id" @click="selected = design.id">{{ design.label }}</button>
    <span>Scrollen in het venster</span>
  </template>
  <template #default="{ fullscreen, toggleFullscreen }">
  <div class="app-window" @click.stop @pointerdown.stop @wheel.stop>
    <div class="window-bar"><i aria-hidden="true"></i><i aria-hidden="true"></i><button class="window-fullscreen" type="button" :aria-label="fullscreen ? 'Terug naar slide' : 'Volledig scherm'" :title="fullscreen ? 'Terug naar slide (Esc)' : 'Volledig scherm'" :aria-pressed="fullscreen" @click="toggleFullscreen" @keydown.enter.stop @keydown.space.stop></button><span>Retro pixel-art · {{ designs.find(d => d.id === selected).label }}</span></div>
    <div ref="viewport" class="design-viewport">
      <iframe v-if="active" :key="selected" :src="`/design/retro-pixel-art/${selected}.html`" :title="`Retrodesign: ${designs.find(d => d.id === selected).label}`" class="design-frame" :style="frameStyle"></iframe>
    </div>
  </div>
  </template>
  </FullscreenWindow>
</template>
