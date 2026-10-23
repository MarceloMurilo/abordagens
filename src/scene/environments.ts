import * as THREE from 'three';
import type { SceneId } from '../../shared/scenes';
import { ball, box, cyl, inked, toon } from './toon';

export interface Stage {
  group: THREE.Group;
  bg: string;
  fog: [number, number];
  light: { sun: number; sunColor: string; ambient: number; sky: string; ground: string };
  girl: { pos: THREE.Vector3; rotY: number; seatY?: number };
  man: { path: THREE.Vector3[]; exit: THREE.Vector3[] };
  wide: { pos: THREE.Vector3; look: THREE.Vector3 };
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const rand = mulberry(7);

function floor(g: THREE.Group, w: number, d: number, color: string) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), toon(color));
  m.rotation.x = -Math.PI / 2;
  g.add(m);
  return m;
}

function wall(g: THREE.Group, w: number, h: number, color: string, pos: [number, number, number], rotY = 0) {
  const m = box(w, h, 0.12, color, pos, 0.02);
  m.rotation.y = rotY;
  g.add(m);
  return m;
}

function chair(g: THREE.Group, x: number, z: number, rotY: number, color = '#8a5a3c') {
  const c = new THREE.Group();
  c.add(box(0.44, 0.05, 0.44, color, [0, 0.45, 0]));
  c.add(box(0.44, 0.5, 0.05, color, [0, 0.72, -0.2]));
  for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.add(cyl(0.02, 0.02, 0.45, '#3a2a20', [a, 0.22, b], 8));
  c.position.set(x, 0, z);
  c.rotation.y = rotY;
  g.add(c);
}

function roundTable(g: THREE.Group, x: number, z: number, top = '#f4efe6') {
  g.add(cyl(0.42, 0.42, 0.04, top, [x, 0.75, z], 28));
  g.add(cyl(0.035, 0.035, 0.73, '#2c2a30', [x, 0.37, z], 10));
  g.add(cyl(0.22, 0.22, 0.03, '#2c2a30', [x, 0.015, z], 20));
}

function plant(g: THREE.Group, x: number, z: number, s = 1) {
  g.add(cyl(0.16 * s, 0.12 * s, 0.3 * s, '#c96f4a', [x, 0.15 * s, z], 14));
  for (let i = 0; i < 5; i++) {
    const leaf = ball(0.14 * s, i % 2 ? '#5f9e57' : '#79b765', [x + (rand() - 0.5) * 0.25 * s, (0.4 + rand() * 0.35) * s, z + (rand() - 0.5) * 0.25 * s]);
    g.add(leaf);
  }
}

function tree(g: THREE.Group, x: number, z: number, s = 1) {
  g.add(cyl(0.12 * s, 0.18 * s, 2.2 * s, '#7a5236', [x, 1.1 * s, z], 10, 0.025));
  const greens = ['#6faa5a', '#86c06a', '#5c9a4e'];
  for (let i = 0; i < 4; i++) {
    const m = inked(new THREE.IcosahedronGeometry((0.7 + rand() * 0.4) * s, 1), toon(greens[i % 3]), 0.03);
    m.position.set(x + (rand() - 0.5) * 0.9 * s, (2.4 + rand() * 0.8) * s, z + (rand() - 0.5) * 0.9 * s);
    g.add(m);
  }
}

function books(g: THREE.Group, x: number, y: number, z: number, width: number, rotY: number) {
  const colors = ['#d9534f', '#5b8fd1', '#f0b84a', '#6fae6b', '#9b6bc2', '#e9e1cf', '#3c4a63', '#c7703f'];
  const row = new THREE.Group();
  let cx = -width / 2;
  while (cx < width / 2 - 0.05) {
    const w = 0.035 + rand() * 0.04;
    const h = 0.22 + rand() * 0.1;
    row.add(box(w, h, 0.18, colors[Math.floor(rand() * colors.length)], [cx + w / 2, h / 2, 0], 0.006));
    cx += w + 0.004;
  }
  row.position.set(x, y, z);
  row.rotation.y = rotY;
  g.add(row);
}

function shelf(g: THREE.Group, x: number, z: number, rotY: number, w = 1.6) {
  const s = new THREE.Group();
  s.add(box(w, 2.2, 0.04, '#6e4a2f', [0, 1.1, -0.15]));
  for (const x of [-w / 2, w / 2]) s.add(box(0.05, 2.2, 0.32, '#8b5e3c', [x, 1.1, 0]));
  s.add(box(w + 0.05, 0.05, 0.34, '#8b5e3c', [0, 2.2, 0]));
  for (let i = 0; i < 5; i++) {
    s.add(box(w - 0.08, 0.03, 0.3, '#a57349', [0, 0.15 + i * 0.42, 0.02], 0.008));
    books(s, 0, 0.17 + i * 0.42, 0.03, w - 0.15, 0);
  }
  s.position.set(x, 0, z);
  s.rotation.y = rotY;
  g.add(s);
}

function windowsTexture(lit: number) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) {
    if (rand() < lit) { g.fillStyle = rand() < 0.7 ? '#ffd98a' : '#bfe6ff'; g.fillRect(x, y, 6, 6); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

// ---------------- cenas ----------------

function cafe(): Stage {
  const g = new THREE.Group();
  floor(g, 16, 16, '#c9a27c');
  wall(g, 12, 3.4, '#f1e0c0', [0, 1.7, -3.2]);
  wall(g, 10, 3.4, '#e9cfa8', [-4.5, 1.7, 1.5], Math.PI / 2);
  wall(g, 10, 3.4, '#e9cfa8', [5.2, 1.7, 1.5], Math.PI / 2);
  wall(g, 12, 3.4, '#f1e0c0', [0, 1.7, 6]);
  g.add(box(0.05, 2.2, 1.1, '#7b4d33', [5.12, 1.1, 3.6]));       // porta
  g.add(box(0.05, 1.6, 0.8, '#bfe3f2', [5.1, 1.25, 3.6], 0.01));
  g.add(box(0.04, 0.9, 0.7, '#f0b84a', [5.12, 1.8, 0.4], 0.01)); // pôsteres
  g.add(box(0.04, 0.7, 0.55, '#d9534f', [5.12, 1.6, -0.6], 0.01));
  g.add(box(0.05, 0.12, 4, '#7b4d33', [5.12, 1.05, -0.2]));
  plant(g, 4.6, 5.3, 1.2);
  // janelas
  for (const x of [-2.2, 0.2, 2.6]) {
    g.add(box(1.7, 1.5, 0.05, '#bfe3f2', [x, 1.75, -3.12], 0.02));
    g.add(box(0.06, 1.5, 0.08, '#6b4a33', [x, 1.75, -3.1]));
  }
  // balcão
  g.add(box(3, 1.05, 0.7, '#7b4d33', [-2.6, 0.52, -1.9]));
  g.add(box(3.1, 0.06, 0.8, '#3b2a22', [-2.6, 1.08, -1.9]));
  g.add(box(0.5, 0.45, 0.4, '#c9c9cf', [-3.3, 1.33, -2.0]));
  g.add(box(0.2, 0.2, 0.2, '#2b2a30', [-3.3, 1.2, -1.75]));
  g.add(box(1.4, 0.8, 0.05, '#2f3b33', [-2.6, 2.4, -3.1]));
  for (const x of [-2.6, 0, 2.4]) {
    g.add(cyl(0.005, 0.005, 0.9, '#222', [x, 2.95, 0.2], 4));
    g.add(cyl(0.08, 0.25, 0.22, '#f0b84a', [x, 2.45, 0.2], 18));
  }
  // mesa dela + vizinhas
  roundTable(g, 0, 0.55);
  chair(g, 0, 0, 0);
  g.add(cyl(0.045, 0.035, 0.08, '#ffffff', [0.12, 0.81, 0.5], 14, 0.006));
  g.add(box(0.2, 0.025, 0.28, '#d9534f', [-0.12, 0.78, 0.6], 0.006));
  roundTable(g, 2.6, -1.2); chair(g, 2.6, -1.75, 0); chair(g, 2.6, -0.65, Math.PI);
  roundTable(g, -2.2, 1.6); chair(g, -2.2, 1.05, 0);
  plant(g, 3.8, -2.6, 1.3);
  plant(g, -3.9, -0.4, 1.1);

  return {
    group: g, bg: '#f6e7cf', fog: [9, 22],
    light: { sun: 1.6, sunColor: '#fff2dc', ambient: 1.4, sky: '#fff6e8', ground: '#c9a27c' },
    girl: { pos: v(0, 0, 0), rotY: 0, seatY: 0.48 },
    man: { path: [v(4.5, 0, 3.5), v(2.4, 0, 1.6), v(0.85, 0, 0.75)], exit: [v(2.4, 0, 2.2), v(5, 0, 5)] },
    wide: { pos: v(3.2, 2.2, 4.6), look: v(0.4, 0.9, 0.3) },
  };
}

function livraria(): Stage {
  const g = new THREE.Group();
  floor(g, 16, 16, '#a5764e');
  wall(g, 12, 3.6, '#efe3cc', [0, 1.8, -2.4]);
  wall(g, 10, 3.6, '#e6d6ba', [4.6, 1.8, 2], Math.PI / 2);
  wall(g, 12, 3.6, '#efe3cc', [0, 1.8, 6]);
  shelf(g, 3.9, 3.2, -Math.PI / 2, 1.8);
  for (const x of [-2.5, -0.8, 0.9, 2.6]) shelf(g, x, -2.15, 0, 1.6);
  shelf(g, -3.6, 0.4, Math.PI / 2, 1.8);
  shelf(g, 3.9, 0.6, -Math.PI / 2, 1.8);
  // tapete, poltrona, mesa de destaques
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), toon('#b6544a'));
  rug.rotation.x = -Math.PI / 2; rug.position.set(1.6, 0.006, 1.4); g.add(rug);
  g.add(box(0.9, 0.45, 0.8, '#5c7c6a', [2.6, 0.25, 2.0]));
  g.add(box(0.9, 0.6, 0.2, '#5c7c6a', [2.6, 0.65, 2.35]));
  g.add(box(1.4, 0.8, 0.8, '#7b4d33', [-1.4, 0.4, 1.6]));
  books(g, -1.4, 0.8, 1.6, 1.2, 0);
  g.add(cyl(0.18, 0.18, 0.5, '#f3d27a', [-2.5, 2.9, 0.5], 18));
  plant(g, -3.2, 2.6);

  return {
    group: g, bg: '#efe0c6', fog: [9, 20],
    light: { sun: 1.3, sunColor: '#ffe9c4', ambient: 1.5, sky: '#fff1d6', ground: '#a5764e' },
    girl: { pos: v(-0.1, 0, -1.3), rotY: Math.PI },
    man: { path: [v(2.4, 0, 5.2), v(1.6, 0, 0.2), v(0.65, 0, -0.95)], exit: [v(1.8, 0, 0.8), v(2.4, 0, 5.2)] },
    wide: { pos: v(0.9, 1.9, 2.9), look: v(0.2, 1.1, -1.0) },
  };
}

function parque(): Stage {
  const g = new THREE.Group();
  floor(g, 60, 60, '#98cc72');
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 40), toon('#e8d6a8'));
  path.rotation.x = -Math.PI / 2; path.rotation.z = 0.25; path.position.set(1.8, 0.004, 0); g.add(path);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), toon('#7fc6e8'));
  pond.rotation.x = -Math.PI / 2; pond.scale.set(1.6, 1, 1); pond.position.set(-5, 0.006, -5); g.add(pond);
  // banco
  const bench = new THREE.Group();
  bench.add(box(1.6, 0.06, 0.45, '#b07a4a', [0, 0.45, 0]));
  bench.add(box(1.6, 0.35, 0.05, '#b07a4a', [0, 0.72, -0.22]));
  for (const x of [-0.7, 0.7]) { bench.add(box(0.06, 0.45, 0.45, '#3d3b40', [x, 0.22, 0])); }
  bench.position.set(-0.3, 0, 0); g.add(bench);
  g.add(cyl(0.05, 0.06, 3.2, '#3d3b40', [-1.6, 1.6, -0.4], 10));
  g.add(ball(0.18, '#fff3c4', [-1.6, 3.25, -0.4]));
  const spots: [number, number, number][] = [[-3, -2.5, 1.1], [-6, 1, 1.3], [3.5, -4, 1.2], [6, 2, 1], [-4, 5, 1.2], [-9, -7, 1.4], [8, -8, 1.3], [0, -7, 1.1], [-2, 9, 1]];
  for (const [x, z, s] of spots) tree(g, x, z, s);
  for (let i = 0; i < 12; i++) g.add(ball(0.35 + rand() * 0.2, '#6faa5a', [(rand() - 0.5) * 20, 0.2, -6 - rand() * 6]));

  return {
    group: g, bg: '#cdebff', fog: [14, 40],
    light: { sun: 2.0, sunColor: '#fff4d6', ambient: 1.3, sky: '#d8f0ff', ground: '#98cc72' },
    girl: { pos: v(-0.55, 0, 0.02), rotY: 0, seatY: 0.48 },
    man: { path: [v(4, 0, 9), v(2.2, 0, 3), v(0.45, 0, 1.0)], exit: [v(1.8, 0, -2), v(3.5, 0, -10)] },
    wide: { pos: v(3.4, 2.0, 5.2), look: v(0, 0.8, 0.3) },
  };
}

function academia(): Stage {
  const g = new THREE.Group();
  floor(g, 18, 18, '#4e525c');
  wall(g, 14, 3.6, '#e4e7ec', [0, 1.8, -3]);
  wall(g, 10, 3.6, '#d0d5dd', [-4.6, 1.8, 1.5], Math.PI / 2);
  wall(g, 10, 3.6, '#d0d5dd', [4.8, 1.8, 1.5], Math.PI / 2);
  wall(g, 14, 3.6, '#e4e7ec', [0, 1.8, 6.5]);
  g.add(box(0.05, 0.4, 9.8, '#f05a5a', [4.72, 2.9, 1.5], 0.01));
  for (const [z, c] of [[-1.2, '#f0b84a'], [0.4, '#5b8fd1'], [2.0, '#7fc6a4']] as const) g.add(box(0.04, 1.0, 0.75, c, [4.72, 1.7, z], 0.01));
  g.add(box(0.5, 1.6, 0.5, '#2b2d33', [4.3, 0.8, 3.6]));
  g.add(box(5, 2, 0.04, '#bcdcf0', [1.5, 1.4, -2.92], 0.015)); // espelho
  g.add(box(14, 0.4, 0.05, '#f05a5a', [0, 2.9, -2.92], 0.01));
  // rack de halteres
  g.add(box(2.2, 0.08, 0.5, '#2b2d33', [-2.4, 0.7, -2.3]));
  g.add(box(2.2, 0.08, 0.5, '#2b2d33', [-2.4, 0.35, -2.3]));
  for (let i = 0; i < 6; i++) for (const y of [0.42, 0.77]) {
    const x = -3.3 + i * 0.36;
    g.add(cyl(0.06, 0.06, 0.07, '#1d1e22', [x - 0.08, y + 0.06, -2.3], 12, 0.006).rotateZ(Math.PI / 2));
    g.add(cyl(0.06, 0.06, 0.07, '#1d1e22', [x + 0.08, y + 0.06, -2.3], 12, 0.006).rotateZ(Math.PI / 2));
  }
  // banco supino + barra
  g.add(box(0.35, 0.45, 1.3, '#2b2d33', [2.8, 0.23, -0.4]));
  g.add(box(0.06, 1.3, 0.06, '#7d828c', [2.4, 0.65, -1.05]));
  g.add(box(0.06, 1.3, 0.06, '#7d828c', [3.2, 0.65, -1.05]));
  g.add(cyl(0.02, 0.02, 1.8, '#c0c4cc', [2.8, 1.2, -1.05], 8).rotateZ(Math.PI / 2));
  for (const x of [1.95, 3.65]) g.add(cyl(0.22, 0.22, 0.05, '#1d1e22', [x, 1.2, -1.05], 20).rotateZ(Math.PI / 2));
  // esteiras
  for (const x of [-3.6, -2.6]) {
    g.add(box(0.7, 0.2, 1.6, '#2b2d33', [x, 0.1, 2.2]));
    g.add(box(0.7, 0.1, 0.1, '#2b2d33', [x, 1.2, 1.5]));
    g.add(box(0.05, 1.1, 0.05, '#7d828c', [x - 0.3, 0.65, 1.5]));
    g.add(box(0.05, 1.1, 0.05, '#7d828c', [x + 0.3, 0.65, 1.5]));
  }
  // bebedouro e bolas de pilates
  g.add(box(0.4, 1.0, 0.35, '#e9edf2', [-0.6, 0.5, -2.7]));
  g.add(cyl(0.16, 0.16, 0.4, '#a9d8f5', [-0.6, 1.2, -2.7], 16));
  g.add(ball(0.32, '#7fc6a4', [-3.8, 0.32, -0.6]));
  g.add(ball(0.3, '#f0b84a', [-3.6, 0.3, 0.2]));

  return {
    group: g, bg: '#e6e9ee', fog: [9, 22],
    light: { sun: 1.4, sunColor: '#ffffff', ambient: 1.6, sky: '#f4f7ff', ground: '#4e525c' },
    girl: { pos: v(-0.2, 0, -1.9), rotY: 0.3 },
    man: { path: [v(1.5, 0, 4.5), v(1.4, 0, 0.5), v(0.75, 0, -1.25)], exit: [v(1.6, 0, 1), v(2, 0, 6)] },
    wide: { pos: v(-2.2, 2.2, 3.0), look: v(0.2, 1.0, -1.4) },
  };
}

function rooftop(): Stage {
  const g = new THREE.Group();
  floor(g, 14, 12, '#6e5a4f');
  // parapeito
  g.add(box(12, 1.0, 0.15, '#9a8f86', [0, 0.5, -3]));
  g.add(box(12, 0.08, 0.3, '#c9bfb6', [0, 1.04, -3]));
  // skyline
  for (let i = 0; i < 26; i++) {
    const w = 1.5 + rand() * 2.5, h = 4 + rand() * 14, d = 2 + rand() * 2;
    const x = -26 + i * 2.1 + rand(), z = -14 - rand() * 14;
    const mat = toon('#2a2f4f', { emissive: '#ffffff', emissiveMap: windowsTexture(0.35), emissiveIntensity: 0.9 });
    (mat.emissiveMap as THREE.Texture).repeat.set(Math.max(1, Math.round(w / 1.2)), Math.max(1, Math.round(h / 3)));
    (mat.emissiveMap as THREE.Texture).wrapS = (mat.emissiveMap as THREE.Texture).wrapT = THREE.RepeatWrapping;
    const b = inked(new THREE.BoxGeometry(w, h, d), mat, 0.05);
    b.position.set(x, h / 2 - 6, z);
    g.add(b);
  }
  // varal de luzinhas
  for (const [z0, z1] of [[-2.8, 2.5]]) {
    for (let x = -4; x <= 4; x += 2) {
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const z = z0 + (z1 - z0) * t;
        const y = 2.8 - Math.sin(t * Math.PI) * 0.4;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd77a' }));
        bulb.position.set(x, y, z);
        g.add(bulb);
      }
    }
  }
  for (const x of [-4, -2, 0, 2, 4]) { g.add(cyl(0.04, 0.04, 2.9, '#2a2a30', [x, 1.45, -2.85], 8)); g.add(cyl(0.04, 0.04, 2.9, '#2a2a30', [x, 1.45, 2.55], 8)); }
  // balcão do bar + banquetas
  g.add(box(3.2, 1.05, 0.7, '#3b2a22', [-3, 0.52, 1.2]));
  g.add(box(3.3, 0.06, 0.8, '#c9a27c', [-3, 1.08, 1.2]));
  for (const x of [-4, -3, -2]) { g.add(cyl(0.18, 0.18, 0.05, '#c9a27c', [x, 0.75, 0.6], 16)); g.add(cyl(0.025, 0.025, 0.73, '#2a2a30', [x, 0.37, 0.6], 8)); }
  plant(g, 3.8, -2.3, 1.4);
  plant(g, 4.4, 1.5, 1.2);

  return {
    group: g, bg: '#1b2045', fog: [16, 45],
    light: { sun: 0.9, sunColor: '#b9c4ff', ambient: 1.25, sky: '#8c94d9', ground: '#ffcf8a' },
    girl: { pos: v(0, 0, -2.45), rotY: Math.PI },
    man: { path: [v(-3, 0, 3), v(-0.4, 0, 0), v(0.6, 0, -1.75)], exit: [v(-0.6, 0, 0.5), v(-4, 0, 5)] },
    wide: { pos: v(2.8, 1.9, 1.8), look: v(0.1, 1.1, -2.2) },
  };
}

export const STAGES: Record<SceneId, () => Stage> = { cafe, livraria, parque, academia, rooftop };

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
