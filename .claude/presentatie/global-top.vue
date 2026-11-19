<template>
  <footer class="deck-footer" @click.stop>
    <div class="wordmark">Test<span>Coders</span><small>INTERACTIEF CV</small></div>
    <nav aria-label="Presentatienavigatie">
      <button type="button" :disabled="$slidev.nav.currentPage <= 1" @click="$slidev.nav.prev()">← Terug</button>
      <span>{{ String($slidev.nav.currentPage).padStart(2, '0') }} / {{ String($slidev.nav.total).padStart(2, '0') }}</span>
      <button type="button" :disabled="$slidev.nav.currentPage >= $slidev.nav.total" @click="$slidev.nav.next()">Verder →</button>
    </nav>
  </footer>
</template>
