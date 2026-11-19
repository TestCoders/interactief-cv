import { canvasTexture } from '../pixel.js';

// Thema "Strak en zakelijk" (stijl 2 van Bjorn, design/strak-zakelijk): lichte zakenwijk overdag,
// donkerblauwe borden met neon-accenten, en 's avonds een neonstad. Zelfde gameplay, andere skin.
const C = {
  bg: '#f6f7fb', ink: '#16202a', muted: '#55606b', groen: '#2f6f5d', groenDonker: '#1d4a3e',
  rand: '#c3cce0', navy: '#1b1f3b', navyDonker: '#0d1024', cyaan: '#22e5ff', roze: '#ff3ea5', geel: '#ffd23f', vloer: '#cfd8e8'
};

const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

export default {
  name: 'zakelijk',
  label: 'Zakelijk',
  tex: (key) => `z-${key}`,
  font: '"Space Grotesk", Inter, system-ui, sans-serif',
  colors: {
    board: 0x1b1f3b,
    boardEdge: 0x22e5ff,
    boardShadow: 0x0d1024,
    post: 0x55606b,
    text: '#e6fdff',
    title: '#22e5ff',
    dim: '#8b95b5',
    window: 0x0d1024,
    windowLit: 0x22e5ff
  },
  sky: { dag: 0xf6f7fb, middag: 0xe6ecf7, zonsondergang: 0xf7c9b0, avond: 0x1b1f3b },
  tint: { dag: 0xffffff, zonsondergang: 0xffe0d0, avond: 0x5b6690 },
  css: {
    '--pixel-font': '"Space Grotesk", Inter, system-ui, sans-serif',
    '--box': '#1b1f3b', '--box-hover': '#262b52', '--box-text': '#e6fdff',
    '--box-title': '#22e5ff', '--box-dim': '#8b95b5', '--box-shadow': '#0d1024'
  },

  createTextures(scene) {
    const t = (k) => `z-${k}`;

    // Achtergrond: vloer, skyline, wolken.
    canvasTexture(scene, t('ground'), 64, 64, (ctx) => {
      ctx.fillStyle = C.vloer; ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#9aa6bd'; ctx.fillRect(0, 0, 64, 4);
      ctx.fillStyle = '#bfc9dc'; ctx.fillRect(0, 4, 1, 60); ctx.fillRect(32, 4, 1, 60);
    });
    canvasTexture(scene, t('hills'), 960, 300, (ctx) => {
      const gebouwen = [[20, 90, 170], [120, 70, 230], [200, 110, 150], [330, 80, 260], [420, 120, 190], [560, 70, 240], [640, 100, 160], [760, 90, 280], [860, 80, 200]];
      gebouwen.forEach(([x, w, h], i) => {
        ctx.fillStyle = ['#dfe5f0', '#d3dbea', '#c7d1e3'][i % 3];
        ctx.fillRect(x, 300 - h, w, h);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (let wy = 300 - h + 14; wy < 290; wy += 22) for (let wx = x + 10; wx < x + w - 14; wx += 18) ctx.fillRect(wx, wy, 8, 10);
      });
      // twee neonborden
      ctx.fillStyle = C.navy; rr(ctx, 350, 300 - 260 - 26, 50, 20, 4); ctx.fill();
      ctx.fillStyle = C.roze; ctx.fillRect(358, 300 - 260 - 18, 34, 4);
      ctx.fillStyle = C.navy; rr(ctx, 775, 300 - 280 - 26, 60, 20, 4); ctx.fill();
      ctx.fillStyle = C.cyaan; ctx.fillRect(783, 300 - 280 - 18, 44, 4);
    });
    canvasTexture(scene, t('clouds'), 960, 160, (ctx) => {
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      [[90, 50, 160, 34], [140, 34, 90, 30], [540, 80, 190, 36], [600, 62, 100, 30]].forEach(([x, y, w, h]) => { rr(ctx, x, y, w, h, h / 2); ctx.fill(); });
    });
    canvasTexture(scene, t('sign'), 96, 110, (ctx) => {
      ctx.fillStyle = C.muted; ctx.fillRect(45, 50, 6, 60);
      ctx.fillStyle = C.navy; rr(ctx, 2, 2, 92, 52, 8); ctx.fill();
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 2; rr(ctx, 4, 4, 88, 48, 7); ctx.stroke();
    });
    canvasTexture(scene, t('flag'), 72, 160, (ctx) => {
      ctx.fillStyle = '#9aa6bd'; ctx.fillRect(0, 0, 5, 160);
      ctx.fillStyle = C.groen; ctx.beginPath(); ctx.moveTo(5, 6); ctx.lineTo(70, 26); ctx.lineTo(5, 46); ctx.fill();
    });

    // Skills: koffertjes i.p.v. bloemetjes (Bjorns "skill-koffertje").
    canvasTexture(scene, t('flower'), 18, 22, (ctx) => {
      ctx.strokeStyle = C.groenDonker; ctx.lineWidth = 2; rr(ctx, 5, 3, 8, 6, 2); ctx.stroke();
      ctx.fillStyle = C.groen; rr(ctx, 1, 8, 16, 13, 3); ctx.fill();
      ctx.fillStyle = C.geel; ctx.fillRect(8, 12, 3, 3);
    });
    canvasTexture(scene, t('soil'), 20, 8, (ctx) => { ctx.fillStyle = '#2a3060'; rr(ctx, 1, 1, 18, 6, 3); ctx.fill(); });
    canvasTexture(scene, t('spark'), 8, 8, (ctx) => {
      ctx.fillStyle = C.cyaan; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(8, 4); ctx.lineTo(4, 8); ctx.lineTo(0, 4); ctx.fill();
    });

    // Expertise: aktetas die openklapt.
    canvasTexture(scene, t('chest'), 64, 28, (ctx) => {
      ctx.fillStyle = C.navy; rr(ctx, 0, 0, 64, 28, 4); ctx.fill();
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 2; rr(ctx, 2, 2, 60, 24, 3); ctx.stroke();
      ctx.fillStyle = C.geel; ctx.fillRect(28, 0, 8, 6);
    });
    canvasTexture(scene, t('chestLid'), 64, 20, (ctx) => {
      ctx.strokeStyle = C.navy; ctx.lineWidth = 4; rr(ctx, 22, 2, 20, 10, 4); ctx.stroke();
      ctx.fillStyle = C.navy; rr(ctx, 0, 8, 64, 12, 4); ctx.fill();
      ctx.fillStyle = C.cyaan; ctx.fillRect(4, 16, 56, 2);
    });

    // Opleiding: badge, hoed.
    canvasTexture(scene, t('medal'), 24, 28, (ctx) => {
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(10, 0); ctx.lineTo(14, 12); ctx.lineTo(8, 12); ctx.fill();
      ctx.fillStyle = C.cyaan; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, 0); ctx.lineTo(16, 12); ctx.lineTo(10, 12); ctx.fill();
      ctx.fillStyle = '#e0a800'; ctx.beginPath(); ctx.arc(12, 18, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.geel; ctx.beginPath(); ctx.arc(12, 18, 6, 0, Math.PI * 2); ctx.fill();
    });
    canvasTexture(scene, t('cap'), 42, 24, (ctx) => {
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.moveTo(21, 0); ctx.lineTo(42, 8); ctx.lineTo(21, 16); ctx.lineTo(0, 8); ctx.fill();
      ctx.fillRect(12, 10, 18, 10);
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(34, 10); ctx.lineTo(34, 22); ctx.stroke();
    });

    // Bonus, pipeline (glazen lift), wensballon (neonlampje), vuurschaal.
    canvasTexture(scene, t('gift'), 36, 34, (ctx) => {
      ctx.fillStyle = C.navy; rr(ctx, 3, 10, 30, 22, 4); ctx.fill();
      ctx.fillStyle = C.roze; ctx.fillRect(16, 10, 4, 22); rr(ctx, 1, 6, 34, 7, 3); ctx.fill();
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 2; rr(ctx, 3, 10, 30, 22, 4); ctx.stroke();
    });
    canvasTexture(scene, t('pipeline'), 48, 72, (ctx) => {
      ctx.fillStyle = 'rgba(34,229,255,.28)'; rr(ctx, 4, 8, 40, 64, 6); ctx.fill();
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 3; rr(ctx, 4, 8, 40, 64, 6); ctx.stroke();
      ctx.fillStyle = C.navy; rr(ctx, 0, 0, 48, 12, 4); ctx.fill();
      ctx.fillStyle = '#7cff6b'; ctx.fillRect(8, 4, 6, 4);
    });
    canvasTexture(scene, t('lantern'), 26, 26, (ctx) => {
      ctx.fillStyle = 'rgba(255,62,165,.35)'; ctx.beginPath(); ctx.arc(13, 13, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.geel; ctx.beginPath(); ctx.arc(13, 13, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(11, 11, 3, 0, Math.PI * 2); ctx.fill();
    });
    const vuur = (flip) => (ctx) => {
      ctx.save(); if (flip) { ctx.translate(40, 0); ctx.scale(-1, 1); }
      ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(8, 30); ctx.quadraticCurveTo(6, 12, 18, 2); ctx.quadraticCurveTo(16, 14, 26, 10); ctx.quadraticCurveTo(36, 20, 32, 30); ctx.fill();
      ctx.fillStyle = C.geel; ctx.beginPath(); ctx.moveTo(14, 30); ctx.quadraticCurveTo(14, 18, 20, 12); ctx.quadraticCurveTo(22, 20, 27, 18); ctx.quadraticCurveTo(30, 26, 27, 30); ctx.fill();
      ctx.restore();
      ctx.fillStyle = C.muted; rr(ctx, 4, 30, 32, 8, 3); ctx.fill();
    };
    canvasTexture(scene, t('fire0'), 40, 40, vuur(false));
    canvasTexture(scene, t('fire1'), 40, 40, vuur(true));
  }
};
