---
theme: none
title: Interactief CV — TestCoders
info: Hackathonproject Interactief CV
lang: nl
aspectRatio: 16/9
canvasWidth: 1280
colorSchema: dark
fonts:
  sans: Arial
  mono: Courier New
  provider: none
highlighter: shiki
drawings:
  enabled: false
transition: fade
mdc: true
---

<div class="eyebrow">TESTCODERS / HACKATHON / 19 NOV 2026</div>
<div class="cover-grid">
<div>
<h1 class="hero-title">Interactief<br/><span>CV</span></h1>
<p class="team">Bjorn · Eric · Demi · Jurgen</p>
</div>
<div class="cover-window">
<div class="window-bar"><i></i><i></i><i></i><span>Levelontwerp</span></div>
<iframe src="/design/retro-pixel-art/level.html" title="Retro pixel-art ontwerp van het cv-level" class="cover-preview" tabindex="-1"></iframe>
</div>
</div>

---

# Doel

<p class="lead">Een professional voorstellen aan klanten en opdrachtgevers via een game.</p>

<div class="three-columns">
<div class="card"><h2>Cv-inhoud</h2><p>Expertise en vaardigheden, interesses, opleidingen en ervaring.</p></div>
<div class="card"><h2>Spelvorm</h2><p>Een side scroller met cv-onderdelen als tussenstations.</p></div>
<div class="card"><h2>Scope</h2><p>Een lokale demo voor één persoon. Later te integreren in de TestCoders-website.</p></div>
</div>

---

# Functionaliteit

<div class="two-columns">
<div class="feature-list">
<h2>Game</h2><p>Lopen, springen en scrollen langs de cv-onderdelen.</p>
<h2>Klassiek cv</h2><p>Een leesbare, printbare weergave.</p>
<h2>Markdown</h2><p>Automatische export vanuit de JSON-data.</p>
</div>
<div class="terminal-panel">
<h2>Demo</h2>
<p>Drie fictieve voorbeeldprofielen</p>
<p>Expertise uit een schatkist</p>
<p>Vaardigheden als bloemen</p>
<p>Een scène over werkplezier</p>
<p>Contact via TestCoders</p>
</div>
</div>

---

# Skills en techniek

<div class="two-columns">
<div class="card skill-card"><h2>cv-docx-naar-md</h2><p>Agent-skill voor Word → Markdown met vaste cv-kopjes.</p><p>Python-scripts voor extractie en controle op volledigheid.</p><p class="muted">Een fictief Word-cv en de Markdown-uitvoer staan in de repo.</p></div>
<div class="card skill-card"><h2>Implementatie</h2><p><b>Phaser</b> — gameplay en animaties</p><p><b>Vite + JavaScript</b> — applicatie en build</p><p><b>JSON</b> — cv-data voor de game en export</p><p><b>Validatie</b> — controle van de cv-bestanden</p></div>
</div>

<p class="small-note">Markdown-invoer voor de game is nog niet geïmplementeerd.</p>

---

# Demo

<DemoWindow :active="$slidev.nav.currentPage === 5" />

---

# Designs

<DesignWindow :active="$slidev.nav.currentPage === 6" />

---

# Vervolg

<p class="lead">Andere spelvormen genereren en vergelijken.</p>

<div class="two-columns final-columns">
<div class="card"><h2>Vergelijking</h2><p>Dezelfde cv-inhoud in elke game.</p><p>Beoordelen op leesbaarheid, bediening en uitstraling.</p></div>
<div class="card"><h2>Keuze</h2><p>Een spelvorm kiezen voor verdere uitwerking.</p></div>
</div>

<!-- Vormgeving gebaseerd op testcoders.nl en design/retro-pixel-art uit deze repo. -->
