<script setup>
import { ref } from 'vue'
import { toggleFullscreen } from './fullscreen.mjs'
const surface = ref()
const button = ref()
const fullscreen = ref(false)
const error = ref('')
async function toggle() {
  error.value = ''
  try {
    await toggleFullscreen(surface.value)
  } catch {
    error.value = 'Volledig scherm is niet beschikbaar in deze browser.'
  }
}
function syncFullscreen() {
  fullscreen.value = surface.value.ownerDocument.fullscreenElement === surface.value
  if (!fullscreen.value) button.value?.focus()
}
</script>

<template>
  <section ref="surface" class="demo-surface" @fullscreenchange="syncFullscreen" @click.stop @pointerdown.stop @wheel.stop>
    <div class="demo-toolbar" @keydown.enter.stop @keydown.space.stop>
      <slot name="toolbar" />
      <button ref="button" class="fullscreen-toggle" type="button" :aria-pressed="fullscreen" @click="toggle">{{ fullscreen ? '✕ Terug naar slide' : '⛶ Volledig scherm' }}</button>
    </div>
    <p v-if="error" class="fullscreen-error" role="alert">{{ error }}</p>
    <slot :fullscreen="fullscreen" :toggle-fullscreen="toggle" />
  </section>
</template>
