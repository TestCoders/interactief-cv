import Phaser from 'phaser';
import { buildStations } from '../cv/stations.js';
import { SCENES } from '../config/gameConfig.js';
import { MOVEMENT, CAMERA, STOPS } from '../config/levelConfig.js';
import { BASE_H, GROUND_H, START_X, PIECE_GAP, BONUS_GAP, CHAPTERS } from '../config/traversalConfig.js';
import { BRAND } from '../config/brand.js';
import Player from '../level/Player.js';
import KeyboardControls from '../level/KeyboardControls.js';
import ScrollWalkInput from '../level/ScrollWalkInput.js';
import { esc } from '../ui/html.js';
import { showPanel, hidePanel } from '../ui/panel.js';
import { stationHtml } from '../ui/stationTemplates.js';
import { createPiece, widthOf, bonusFor } from '../pieces/pieceRegistry.js';
import Bonus from '../pieces/Bonus.js';
import { THEMES } from '../themes/index.js';
import { heroKey as pixelHeroKey } from '../graphics/heroSprites.js';
import { audio } from '../audio/index.js';

// Coach marks: een mini-tutorial, elk één keer, precies op het moment dat het nodig is.
const COACH = {
  martijn: '💬 Martijn vertelt over je nieuwe collega. Scroll of druk <b>→</b> voor de volgende zin.',
  springen: '🎁 Een cadeautje! Druk op <b>spatie</b> (of tik erop) om te springen — er zit extra info in.',
  release: '▶ Loop over <b>RUN</b>: elke opdracht draait als test. Groen? Dan gaat de vlag de mast in.',
  snel: '⏩ Snel naar een onderdeel? Klik onderin een hoofdstuk of druk <b>1–8</b>.',
  bug: '🐛 Hap! Deze bug brengt je er in een flits heen.'
};

// Het level wordt volledig uit het CV opgebouwd: elk CV-onderdeel is een set piece (src/pieces).
// Besturing voor iedereen: pijltjes of muiswiel (de meeste bezoekers), WASD voor gamers.
// Lopen is direct (loslaten = stoppen); spatie / ↑ / W springt.
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super(SCENES.level);
  }

  init({ cv, startX }) {
    this.cv = cv;
    this.theme = THEMES[this.registry.get('theme')] ?? THEMES.retro;
    audio.setPack(this.theme.audio);
    this.startX = startX;
    this.registry.set('currentCv', cv);
    this.finished = false;
    this.lastDir = 1;
    this.glideTo = null;
    this.gate = null;
    this.hasMoved = false;
    this.traveling = false;
    this.cutscene = false; // een set piece bestuurt de held (bijv. sprong tegen de vlaggenmast)
    this.bonusesOpened = 0;
    this.currentChapter = null;
  }

  // ---------- Held per thema ----------

  heroTex(cv) { return this.theme.tex(pixelHeroKey(cv)); }
  get heroScale() { return this.theme.heroScale ?? 3; }

  create() {
    this.theme.createTextures(this); // eerst: grond, lucht, held en set pieces gebruiken thema-textures
    const groundY = BASE_H - GROUND_H;
    this.groundY = groundY;
    const stations = buildStations(this.cv);

    // --- Layout: set pieces naast elkaar op basis van hun breedte ---
    const layout = [];
    let cursor = START_X;
    for (const st of stations) {
      const bonus = bonusFor(st, this.cv);
      if (bonus) cursor += BONUS_GAP;
      const w = widthOf(st);
      layout.push({ st, x: cursor + w / 2, bonus, bonusX: cursor - BONUS_GAP / 2 - 20 });
      cursor += w + PIECE_GAP;
    }
    const finishX = cursor + 40;
    this.worldW = finishX + 600;
    this.physics.world.setBounds(0, 0, this.worldW, BASE_H + 200);

    // --- Lucht: sterren (alleen 's avonds) + parallax ---
    const W = this.scale.width;
    this.stars = this.add.graphics().setScrollFactor(0.02, 1).setAlpha(0);
    for (let i = 0; i < 160; i++) {
      this.stars.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.4, 1)).fillRect(Phaser.Math.Between(-W, 3 * W), Phaser.Math.Between(-600, groundY - 200), 2, 2);
    }
    this.clouds = this.add.tileSprite(0, 20, 10, 160, this.theme.tex('clouds')).setOrigin(0, 0).setScrollFactor(0, 1);
    this.hills = this.add.tileSprite(0, groundY - 260, 10, 300, this.theme.tex('hills')).setOrigin(0, 0).setScrollFactor(0, 1);

    // --- Grond ---
    this.ground = this.add.tileSprite(0, groundY, this.worldW, GROUND_H, this.theme.tex('ground')).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // --- Set pieces + bonussen ---
    this.pieces = layout.map(({ st, x }) => {
      const piece = createPiece(this, x, groundY, st, this.theme);
      piece.station = st;
      piece.active = false;
      return piece;
    });
    this.bonuses = layout.filter((l) => l.bonus).map((l) => new Bonus(this, l.bonusX, groundY, l.bonus, this.theme));

    // --- Finish: TestCoders ---
    this.finishX = finishX;
    this.add.image(finishX, groundY, this.theme.tex('flag')).setOrigin(0, 1);
    // Halteplaatsen: elke stage van een set piece, onder elk cadeautje en bij de finish.
    this.stops = [...this.pieces.flatMap((p) => p.stages.map((s) => s.x)), ...this.bonuses.map((b) => b.x), finishX + 40].sort((a, b) => a - b);

    // Dag → avond: keerpunten in de wereld.
    const firstWork = this.pieces.find((p) => p.station.type === 'work');
    const finale = this.pieces.find((p) => p.station.type === 'finale');
    const { sky, tint } = this.theme;
    this.skyKeys = [
      [0, sky.dag, tint.dag],
      [firstWork?.x ?? finishX * 0.5, sky.middag, tint.dag],
      [(finale?.x ?? finishX) - 900, sky.zonsondergang, tint.zonsondergang],
      [(finale?.x ?? finishX) - 250, sky.avond, tint.avond]
    ];

    // --- Speler ---
    // Hitbox = pixel-held (zelfde gameplay in elk thema); wat je ziet = de held van het thema.
    this.heroKey = this.heroTex(this.cv);
    const startX = this.startX ?? 120;
    this.hero = new Player(this, startX, groundY, pixelHeroKey(this.cv), { visualKey: this.heroKey, scale: this.heroScale, originY: this.theme.heroOriginY });
    this.player = this.hero.sprite;
    this.vis = this.hero.visual;
    this.dust = this.hero.dust;
    this.physics.add.collider(this.player, this.ground);
    for (const b of this.bonuses) this.physics.add.overlap(this.player, b.gift, () => b.open());
    this.cameras.main.startFollow(this.player, true, CAMERA.followLerp, CAMERA.followLerp, -CAMERA.lookahead, 0);
    this.cameras.main.roundPixels = true;

    this.confetti = this.add.particles(0, 0, this.theme.tex('flower'), {
      speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 }, gravityY: 700, rotate: { min: 0, max: 360 },
      lifespan: 1800, scale: { start: 1, end: 0.3 }, emitting: false
    });

    // --- DOM: titelkaart, HUD, hoofdstukken, coach marks (altijd scherp) ---
    this.setupDom();
    this.layoutScreen();
    if (this.startX !== undefined) {
      // Na een stijlwissel: geen intro, direct verder waar je was; wat achter je ligt staat al in eindstand.
      this.hasMoved = true;
      this.dom.titlecard.hidden = true;
      this.dom.hud.hidden = false;
      this.cameras.main.setZoom(this.zoom);
      this.cameras.main.centerOn(startX + CAMERA.lookahead, BASE_H / 2);
      for (const p of this.pieces) for (const s of p.stages) if (s.x < startX - 40) this.runStage(p, s, true);
    } else {
      this.cameras.main.setZoom(this.zoom * CAMERA.introZoom);
    }
    this.scale.on('resize', this.layoutScreen, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layoutScreen, this);
      hidePanel();
      for (const el of ['titlecard', 'hud', 'chapters', 'coach']) this.dom[el].hidden = true;
    });

    // --- Besturing ---
    this.controls = new KeyboardControls(this);
    this.scroll = new ScrollWalkInput(this);
  }

  // ---------- DOM-overlay ----------

  setupDom() {
    const $ = (id) => document.getElementById(id);
    this.dom = { titlecard: $('titlecard'), hud: $('hud'), chapters: $('chapters'), coach: $('coach') };
    const [voor, ...rest] = this.cv.naam.split(' ');
    this.dom.titlecard.innerHTML = `<img class="tc-merk" src="${BRAND.logo}" alt="${BRAND.naam}"><p class="presenteert">presenteert</p>
      <h1>${esc(voor.toUpperCase())} <span>${esc(rest.join(' ').toUpperCase())}</span></h1><p>${esc(this.cv.rol)}</p>
      <p class="start">← → of scroll om te beginnen</p><p class="gamers">gamers: WASD · spatie springt</p>`;
    this.dom.titlecard.classList.remove('weg');
    this.dom.titlecard.hidden = false;
    this.dom.hud.hidden = true;
    this.dom.coach.hidden = true;

    // Hoofdstukken: snel naar een onderdeel (klik of toets 1–8) — de bug brengt je.
    const labels = [{ type: 'host', label: 'Intro' }, ...CHAPTERS];
    this.chapters = labels.map((c) => {
      const x = c.type === 'finish' ? this.finishX + 40 : this.pieces.find((p) => p.station.type === c.type)?.stages[0].x;
      return x === undefined ? null : { ...c, x };
    }).filter(Boolean);
    this.dom.chapters.innerHTML = this.chapters.map((c, i) => `<button type="button" data-i="${i}"><b>${i + 1}</b>${c.label}</button>`).join('');
    this.dom.chapters.onclick = (e) => {
      const b = e.target.closest('button');
      if (b) this.travelTo(this.chapters[Number(b.dataset.i)].x);
    };
    this.dom.chapters.hidden = false;
    this.input.keyboard.on('keydown', (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= this.chapters.length) this.travelTo(this.chapters[n - 1].x);
    });
    this.updateHud();
  }

  /** HUD: TestCoders-beeldmerk, naam, voortgang (stap x van y) en gevonden extra's. */
  updateHud() {
    const step = (this.currentChapter ?? 0) + 1;
    const total = this.chapters?.length ?? 1;
    const extra = this.bonuses?.length ? `<span class="hud-extra">🎁 ${this.bonusesOpened}/${this.bonuses.length}</span>` : '';
    this.dom.hud.innerHTML = `<img class="hud-merk" src="${BRAND.mark}" alt="${BRAND.naam}">
      <div class="hud-tekst"><div class="hud-rij"><b>${esc(this.cv.naam)}</b><span>Stap ${step}/${total}</span></div>
      <div class="hud-rij"><div class="hud-balk"><i style="width:${Math.round((step / total) * 100)}%"></i></div>${extra}</div></div>`;
  }

  onBonusOpened() {
    this.bonusesOpened++;
    this.updateHud();
    this.sharpenText();
  }

  /** Mini-tutorial: elk tipje één keer per bezoek. */
  coach(id) {
    this.coached ??= new Set();
    if (this.coached.has(id) || !COACH[id]) return;
    this.coached.add(id);
    const el = this.dom.coach;
    el.innerHTML = COACH[id];
    el.hidden = false;
    el.classList.remove('weg');
    clearTimeout(this.coachTimer);
    this.coachTimer = setTimeout(() => {
      el.classList.add('weg');
      setTimeout(() => (el.hidden = true), 400);
    }, 4200);
  }

  dismissTitle() {
    if (this.hasMoved) return;
    this.hasMoved = true;
    this.dom.titlecard.classList.add('weg');
    setTimeout(() => (this.dom.titlecard.hidden = true), 500);
    this.dom.hud.hidden = false;
    this.cameras.main.zoomTo(this.zoom, CAMERA.zoomOutMs, 'Sine.easeInOut');
  }

  /** Alles wat aan de schermgrootte hangt. De wereld (540 px hoog) wordt opgezoomd naar het scherm. */
  layoutScreen() {
    const { width, height } = this.scale;
    this.zoom = Math.max(0.6, Math.min(height / BASE_H, width / 640));
    const cam = this.cameras.main;
    if (this.hasMoved) cam.setZoom(this.zoom);
    const viewH = Math.max(BASE_H, height / this.zoom);
    cam.setBounds(0, BASE_H - viewH, this.worldW, viewH);
    for (const layer of [this.clouds, this.hills]) layer.setPosition(-width, layer.y).setSize(width * 3, layer.height);
    this.sharpenText();
  }

  /** Tekst in de wereld renderen op de echte schermresolutie (anders is hij wazig bij opzoomen). */
  sharpenText() {
    const res = Math.min(4, Math.ceil(this.zoom * (window.devicePixelRatio || 1)));
    const walk = (list) => list.forEach((o) => {
      if (o.type === 'Text' && o.style?.resolution !== res) o.setResolution(res);
      if (o.list) walk(o.list);
    });
    walk(this.children.list);
  }

  /** Springen via tikken/klikken (bijv. op een cadeautje): altijd een volle sprong. */
  requestJump() {
    this.hero.bufferJump(this.game.loop.time, true);
  }

  // ---------- Snelreis: de bug ----------

  /** Een bug eet de held op, rent (camera erachteraan) naar het hoofdstuk en spuugt hem daar weer uit. */
  travelTo(destX) {
    if (this.traveling || this.cutscene || Math.abs(destX - this.player.x) < 20) return;
    this.dismissTitle();
    this.coach('bug');
    this.traveling = true;
    this.scroll.reset();
    this.glideTo = null;
    this.gate = null;
    const cam = this.cameras.main;
    const from = this.player.x;
    const dir = destX > from ? 1 : -1;
    const y = this.groundY;
    const tex = (k) => this.theme.tex(k);
    const bug = this.add.sprite(from - dir * (cam.worldView.width / 2 + 80), y, tex('bug0')).setOrigin(0.5, 1).setDepth(7).setFlipX(dir < 0);
    const chewing = () => bug.setTexture(tex(bug.texture.key.endsWith('bug0') ? 'bug1' : 'bug0'));
    this.player.setVelocity(0);
    this.player.body.setAllowGravity(false);
    const chew = this.time.addEvent({ delay: 90, loop: true, callback: chewing });

    this.tweens.add({
      targets: bug, x: from - dir * 20, duration: 420, ease: 'Quad.out',
      onComplete: () => {
        chew.remove();
        bug.setTexture(tex('bug1'));
        audio.play('travelIn');
        this.tweens.add({ targets: this.vis, scale: 0, duration: 160, ease: 'Quad.in' });
        this.time.delayedCall(170, () => {
          bug.setTexture(tex('bug0'));
          this.tweens.add({ targets: bug, scaleY: 0.85, scaleX: 1.15, duration: 90, yoyo: true, repeat: 1 });
          this.vis.setVisible(false);
          this.player.setPosition(destX, y - 40);
          cam.stopFollow();
          cam.startFollow(bug, true, 0.2, 0.2, -dir * CAMERA.lookahead, -40);
          const run = this.time.addEvent({ delay: 60, loop: true, callback: () => { chewing(); this.dust.explode(2, bug.x - dir * 24, y); } });
          this.tweens.add({
            targets: bug, x: destX - dir * 30, duration: Phaser.Math.Clamp(Math.abs(destX - bug.x) / 4, 700, 1600), ease: 'Cubic.inOut', delay: 250,
            onComplete: () => {
              run.remove();
              bug.setTexture(tex('bug1'));
              audio.play('travelOut');
              this.tweens.add({ targets: bug, scaleY: 1.15, scaleX: 0.9, duration: 100, yoyo: true });
              this.player.body.setAllowGravity(true);
              this.player.setPosition(destX, y - 40).setVelocity(0, -420);
              this.vis.setVisible(true).setScale(0.3 * this.hero.scale);
              this.tweens.add({ targets: this.vis, scale: this.hero.scale, duration: 260, ease: 'Back.out' });
              cam.stopFollow();
              cam.startFollow(this.player, true, CAMERA.followLerp, CAMERA.followLerp, -CAMERA.lookahead, 0);
              this.lastDir = 1;
              this.prevX = destX;
              this.time.delayedCall(260, () => {
                bug.setTexture(tex('bug0'));
                this.tweens.add({ targets: bug, x: bug.x - dir * 700, alpha: 0, duration: 900, ease: 'Quad.in', onComplete: () => bug.destroy() });
                this.traveling = false;
              });
            }
          });
        });
      }
    });
  }

  // ---------- Hoofdlus ----------

  update(time, delta) {
    this.updateSky();
    if (this.traveling) {
      this.updateParallax();
      return;
    }
    if (this.cutscene) {
      this.hero.update(time, delta, 0, false); // alleen animatie; het set piece verplaatst de held
      this.updateParallax();
      return;
    }
    const { player } = this;
    const dt = delta / 1000;
    const grounded = player.body.blocked.down;

    // --- Input: ← → direct (loslaten = stoppen), of het muiswiel (kleine uitloop + halteplaats) ---
    const dir = this.controls.direction();
    const forwardPressed = this.controls.forwardJustPressed() || this.scroll.forwardPulse;
    this.scroll.forwardPulse = false;
    if (this.controls.jumpJustPressed()) this.hero.bufferJump(time);

    let target = 0;
    if (dir) {
      target = dir * MOVEMENT.maxSpeed;
      this.scroll.reset();
      this.glideTo = null;
      this.lastKeyAt = time;
    } else if (this.scroll.active) {
      target = this.scroll.targetSpeed();
      this.glideTo = null;
    } else if (this.hasMoved && this.scroll.lastAt > (this.lastKeyAt ?? -1e9) && time - this.scroll.lastAt > STOPS.idleBeforeSnapMs) {
      // Na scrollen: glijd naar een onderdeel vlakbij (alleen vooruit, en nooit na de pijltjes).
      if (this.glideTo === null && !this.gate && this.lastDir > 0) {
        const s = this.stops.find((x) => x - player.x > 4 && x - player.x < STOPS.snapDistance);
        if (s !== undefined) this.glideTo = s;
      }
      if (this.glideTo !== null) {
        const d = this.glideTo - player.x;
        if (Math.abs(d) < 3) this.glideTo = null;
        else target = Math.sign(d) * Math.min(MOVEMENT.maxSpeed * 0.7, 40 + Math.abs(d) * 3);
      }
    }

    const held = this.updateGate(target, forwardPressed, dir < 0 || this.scroll.budget < -0.5);
    if (held) target = 0;
    const newVx = this.hero.update(time, delta, target, this.controls.jumpHeld());
    if (held) player.setX(this.gate.x).setVelocityX(0);
    this.scroll.consume(newVx, dt);
    if (Math.abs(newVx) > MOVEMENT.movingThreshold) this.lastDir = Math.sign(newVx);

    if (Math.abs(newVx) > 5 || forwardPressed) this.dismissTitle();

    const cam = this.cameras.main;
    cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, -this.lastDir * CAMERA.lookahead, CAMERA.lookaheadLerp);
    this.updateParallax();

    for (const b of this.bonuses) b.showHint(Math.abs(b.x - player.x) < 110 && grounded);
    this.updateCoach();
    this.updatePieces();
    this.updateChapters();
  }

  updateCoach() {
    const px = this.player.x;
    const host = this.pieces.find((p) => p.station.type === 'host');
    if (host && this.gate === host.stages[0]) this.coach('martijn');
    const b0 = this.bonuses[0];
    if (b0 && !b0.opened && b0.x - px < 260 && b0.x - px > -40) this.coach('springen');
    const r0 = this.pieces.find((p) => p.station.type === 'work');
    if (r0 && r0.stages[0].x - px < 320 && r0.stages[0].x - px > 0) this.coach('release');
    if (r0?.stages.at(-1).complete) this.coach('snel');
  }

  /**
   * Een onderdeel speelt af als je erlangs loopt (een stage passeert) of er aankomt (bug, halteplaats).
   * Tot de animatie klaar is houdt de halteplaats je vast. Bij Martijn betekent vooruit "volgende zin".
   * Terug (← of terug scrollen) laat je altijd los. Geeft true als de held deze frame wordt vastgehouden.
   */
  updateGate(target, forwardPressed, backPressed) {
    const player = this.player;
    const prevX = this.prevX ?? player.x;
    this.prevX = player.x;
    const now = this.game.loop.time;
    for (const p of this.pieces) for (const s of p.stages) {
      if (s.ran && !s.complete && !s.dialogue && now - s.startedAt >= s.duration) s.complete = true;
    }

    if (!this.gate) {
      const moved = player.x - prevX;
      outer: for (const p of this.pieces) {
        for (const s of p.stages) {
          if (s.ran) continue;
          const passed = target >= 0 && moved > 0 && moved < 100 && prevX < s.x && player.x >= s.x - 2;
          const arrived = Math.abs(player.x - s.x) < 6 && Math.abs(player.body.velocity.x) < 5 && this.hasMoved;
          if (passed || arrived) {
            this.runStage(p, s);
            this.gate = s;
            break outer;
          }
        }
      }
    }
    const s = this.gate;
    if (!s) return false;
    if (s.complete || backPressed || (!s.dialogue && now - s.startedAt > STOPS.gateMaxMs)) {
      this.gate = null;
      return false;
    }
    if (s.dialogue && forwardPressed) s.advance();
    if (s.holdsHero === false) return false; // het set piece bestuurt de held zelf (cutscene)
    this.scroll.reset(); // scrollen tijdens het vasthouden telt niet als loopafstand voor straks
    return true;
  }

  runStage(piece, stage, instant = false) {
    stage.ran = true;
    stage.startedAt = this.game.loop.time;
    if (instant && !stage.dialogue) stage.complete = true;
    stage.run(instant);
    piece.active = true;
    if (!instant) audio.play('enter');
    this.sharpenText();
  }

  updateParallax() {
    const cam = this.cameras.main;
    this.clouds.tilePositionX = cam.scrollX * 0.1;
    this.hills.tilePositionX = cam.scrollX * 0.35;
  }

  /** Luchtkleur, tint van heuvels/wolken en sterren volgen de positie van de camera. */
  updateSky() {
    const x = this.cameras.main.midPoint.x;
    const keys = this.skyKeys;
    let i = 0;
    while (i < keys.length - 2 && x > keys[i + 1][0]) i++;
    const [x0, s0, t0] = keys[i];
    const [x1, s1, t1] = keys[i + 1];
    const f = Phaser.Math.Clamp((x - x0) / Math.max(1, x1 - x0), 0, 1);
    const mix = (a, b) => {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 100, f * 100);
      return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    };
    this.cameras.main.setBackgroundColor(mix(s0, s1));
    const tint = mix(t0, t1);
    this.hills.setTint(tint);
    this.clouds.setTint(tint);
    this.ground.setTint(tint);
    this.stars.setAlpha(i === keys.length - 2 ? f : 0);
  }

  /** Doorlopende effecten (bijv. het gesprek bij het kampvuur) aan als je er bent; tekstbox van het dichtstbijzijnde onderdeel. */
  updatePieces() {
    const px = this.player.x;
    for (const piece of this.pieces) {
      const near = piece.stages[0].ran && Math.abs(piece.stopX - px) < piece.halfWidth + 260;
      if (near && !piece.active) { piece.enter?.(); piece.active = true; }
      if (!near && piece.active) { piece.leave?.(); piece.active = false; }
    }

    if (px >= this.finishX - 20) {
      if (!this.finished) {
        this.finished = true;
        this.confetti.explode(60, this.finishX + 30, BASE_H - 200);
        audio.play('finish');
      }
      showPanel('finish', stationHtml({ type: 'finish' }, this.cv));
      return;
    }
    let nearest = null;
    for (const piece of this.pieces) {
      const d = Math.abs(piece.stopX - px);
      if (d < piece.halfWidth + 120 && (!nearest || d < Math.abs(nearest.stopX - px))) nearest = piece;
    }
    if (nearest?.usesPanel && nearest.stages[0].ran) showPanel(`station-${nearest.x}`, stationHtml(nearest.station, this.cv));
    else hidePanel();
  }

  updateChapters() {
    const px = this.player.x;
    let current = 0;
    this.chapters.forEach((c, i) => { if (px >= c.x - 80) current = i; });
    if (current === this.currentChapter) return;
    this.currentChapter = current;
    [...this.dom.chapters.children].forEach((b, i) => b.classList.toggle('nu', i === current));
    this.updateHud();
  }
}
