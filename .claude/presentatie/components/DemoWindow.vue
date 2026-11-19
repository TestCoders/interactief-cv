<script setup>
import { ref } from 'vue'
import FullscreenWindow from './FullscreenWindow.vue'
defineProps({ active: Boolean })
const frame = ref()
const play = ref()
const revision = ref(0)
function focusGame() {
  frame.value?.contentWindow.focus()
}
function connectKeyboard() {
  frame.value?.contentDocument.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      play.value?.focus()
    }
  })
}
</script>

<template>
  <FullscreenWindow>
  <template #toolbar>
    <button ref="play" type="button" @click="focusGame">Spelen</button>
    <button type="button" @click="revision++">Opnieuw</button>
    <span>← → / A D: lopen · spatie: springen · scrollen: lopen · Esc: terug</span>
  </template>
  <template #default="{ fullscreen, toggleFullscreen }">
  <div class="app-window" @click.stop @pointerdown.stop @wheel.stop>
    <div class="window-bar"><i aria-hidden="true"></i><i aria-hidden="true"></i><button class="window-fullscreen" type="button" :aria-label="fullscreen ? 'Terug naar slide' : 'Volledig scherm'" :title="fullscreen ? 'Terug naar slide (Esc)' : 'Volledig scherm'" :aria-pressed="fullscreen" @click="toggleFullscreen" @keydown.enter.stop @keydown.space.stop></button><span>Sam Voorbeeld · fictief profiel</span></div>
    <iframe v-if="active" :key="revision" ref="frame" src="/demo/index.html?cv=sam-voorbeeld" title="Speelbare demo van het interactieve cv van Sam Voorbeeld" class="game-frame" @load="connectKeyboard"></iframe>
  </div>
  </template>
  </FullscreenWindow>
</template>
