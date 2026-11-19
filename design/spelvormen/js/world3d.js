import * as THREE from 'three';
import { BRAND } from '../../../src/config/brand.js';
import { cvSections } from './sections.js';
import { showPanel, hidePanel } from '../../../src/ui/panel.js';
import { audio } from '../../../src/audio/index.js';

// Spelvorm "3D-wereld": rijd met een autootje over een eiland langs kiosken; elke kiosk is een CV-onderdeel.
// Eigen, simpele modellen (geen externe assets). Pijltjes of WASD: gas, remmen/achteruit en sturen.
const RADIUS = 34; // eiland
const KIOSK_RING = 20;
const NEAR = 6.5;
const COLORS = [0x2f6f5d, 0x1f5ea8, 0xe4572e, 0x6c5ce7, 0xffb400, 0x2e86de, 0x7cc242];

function labelSprite(text, { bg = '#ffffff', fg = '#16202a', size = 64, pad = 28 } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `700 ${size}px "Space Grotesk", Inter, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  c.width = w; c.height = size + pad * 1.6;
  ctx.font = `700 ${size}px "Space Grotesk", Inter, sans-serif`;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(0, 0, c.width, c.height, 24); ctx.fill();
  ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.fillText(text, pad, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
  s.scale.set(c.width / 120, c.height / 120, 1);
  return s;
}

function car() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.4), new THREE.MeshStandardMaterial({ color: 0x2f6f5d, roughness: 0.5 }));
  body.position.y = 0.75; body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.6), new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: 0.3 }));
  cabin.position.set(0, 1.4, -0.2); cabin.castShadow = true;
  g.add(body, cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x16202a });
  g.wheels = [[-1.1, 1.1], [1.1, 1.1], [-1.1, -1.1], [1.1, -1.1]].map(([x, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.45, z); w.castShadow = true;
    g.add(w);
    return w;
  });
  return g;
}

export function startWorld3d(root, cv) {
  const sections = cvSections(cv);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(root.clientWidth, root.clientHeight);
  renderer.shadowMap.enabled = true;
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe4e9f7);
  scene.fog = new THREE.Fog(0xe4e9f7, 50, 120);
  const camera = new THREE.PerspectiveCamera(50, root.clientWidth / root.clientHeight, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb2d3, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(20, 40, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45 });
  scene.add(sun);

  // Zee + eiland.
  const sea = new THREE.Mesh(new THREE.CircleGeometry(200, 48), new THREE.MeshStandardMaterial({ color: 0x9fd6ff }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.6;
  const island = new THREE.Mesh(new THREE.CylinderGeometry(RADIUS, RADIUS + 3, 1.2, 64), new THREE.MeshStandardMaterial({ color: 0x8ccfa8, roughness: 0.9 }));
  island.position.y = -0.6; island.receiveShadow = true;
  scene.add(sea, island);

  // TestCoders-zuil in het midden.
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 6, 24), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  pillar.position.y = 3; pillar.castShadow = true;
  const logo = labelSprite('TESTCODERS', { bg: '#1f5ea8', fg: '#ffffff', size: 72 });
  logo.position.set(0, 8.2, 0);
  scene.add(pillar, logo);
  const naam = labelSprite(`${cv.naam} · ${cv.rol}`, { size: 40 });
  naam.position.set(0, 6.9, 0);
  scene.add(naam);

  // Kiosken in een ring; contact staat aan het eind (sluit de ring).
  const kiosks = sections.map((s, i) => {
    const a = (i / sections.length) * Math.PI * 2 + Math.PI / 2; // Profiel recht voor de startpositie
    const x = Math.cos(a) * KIOSK_RING;
    const z = Math.sin(a) * KIOSK_RING;
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 3.2), new THREE.MeshStandardMaterial({ color: COLORS[i % COLORS.length], roughness: 0.6 }));
    base.position.set(x, 1.2, z); base.castShadow = true; base.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.6, 4), new THREE.MeshStandardMaterial({ color: 0xf4f6fb }));
    roof.position.set(x, 3.2, z); roof.rotation.y = Math.PI / 4; roof.castShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.8, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z);
    const label = labelSprite(`${s.icoon} ${s.titel}`, { size: 56 });
    label.position.set(x, 4.9, z);
    scene.add(base, roof, ring, label);
    return { s, x, z, ring, label, base };
  });

  // Auto.
  const player = car();
  player.position.set(0, 0, 9);
  scene.add(player);
  let heading = 0; // kijkt van het midden af, richting de kiosken
  let speed = 0;
  const keys = new Set();
  const down = (e) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) { keys.add(e.key.toLowerCase()); e.preventDefault(); } };
  const up = (e) => keys.delete(e.key.toLowerCase());
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  const onResize = () => { renderer.setSize(root.clientWidth, root.clientHeight); camera.aspect = root.clientWidth / root.clientHeight; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', onResize);

  const hint = document.createElement('div');
  hint.className = 'w3d-hint';
  hint.innerHTML = `<img src="${BRAND.mark}" alt=""> Rijd met de <b>pijltjes</b> of <b>WASD</b> naar een kiosk`;
  root.appendChild(hint);

  let current = null;
  let last = performance.now();
  let frame;
  const camPos = new THREE.Vector3(0, 12, -10);
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const has = (...k) => k.some((x) => keys.has(x));
    const accel = (has('arrowup', 'w') ? 1 : 0) - (has('arrowdown', 's') ? 1 : 0);
    speed += accel * 26 * dt;
    speed *= 1 - 2.2 * dt; // rolweerstand
    speed = THREE.MathUtils.clamp(speed, -8, 16);
    const steer = (has('arrowleft', 'a') ? 1 : 0) - (has('arrowright', 'd') ? 1 : 0);
    heading += steer * dt * 2.2 * Math.min(1, Math.abs(speed) / 4) * Math.sign(speed || 1);
    player.position.x += Math.sin(heading) * speed * dt;
    player.position.z += Math.cos(heading) * speed * dt;
    // Binnen het eiland blijven.
    const r = Math.hypot(player.position.x, player.position.z);
    if (r > RADIUS - 2) { player.position.multiplyScalar((RADIUS - 2) / r); speed *= -0.3; }
    if (r < 3.4) { player.position.multiplyScalar(3.4 / Math.max(r, 0.01)); speed *= -0.3; } // niet door de TestCoders-zuil
    for (const k of kiosks) { // niet door de kiosken heen
      const dx = player.position.x - k.x;
      const dz = player.position.z - k.z;
      const d = Math.hypot(dx, dz);
      if (d < 3.2) { player.position.x = k.x + (dx / (d || 1)) * 3.2; player.position.z = k.z + (dz / (d || 1)) * 3.2; speed *= -0.25; }
    }
    player.rotation.y = heading;
    player.wheels.forEach((w) => (w.rotation.x += speed * dt * 2));

    // Camera achter en boven de auto.
    const behind = new THREE.Vector3(-Math.sin(heading) * 16, 11, -Math.cos(heading) * 16).add(player.position);
    camPos.lerp(behind, 1 - Math.pow(0.02, dt));
    camera.position.copy(camPos);
    camera.lookAt(player.position.x + Math.sin(heading) * 6, 1.5, player.position.z + Math.cos(heading) * 6);

    // Dichtstbijzijnde kiosk = CV-onderdeel in de tekstbox.
    let near = null;
    for (const k of kiosks) {
      const d = Math.hypot(k.x - player.position.x, k.z - player.position.z);
      const on = d < NEAR;
      k.ring.material.opacity = on ? 1 : 0.5;
      k.base.position.y = 1.2 + (on ? Math.sin(now / 180) * 0.15 : 0);
      if (on) near = k;
    }
    if (near !== current) {
      current = near;
      if (near) { showPanel(`w3d-${near.s.id}`, near.s.html); audio.play('enter'); hint.hidden = true; } else hidePanel();
    }
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    stop() {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('resize', onResize);
      hidePanel();
      renderer.dispose();
      root.innerHTML = '';
    }
  };
}
