import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Toon com 3 faixas de luz + contorno preto por "casco invertido": o visual de desenho 2D em 3D.

const gradient = (() => {
  const t = new THREE.DataTexture(new Uint8Array([150, 212, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const mats = new Map<string, THREE.MeshToonMaterial>();
export function toon(color: THREE.ColorRepresentation, extra?: THREE.MeshToonMaterialParameters) {
  if (extra) return new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });
  const key = new THREE.Color(color).getHexString();
  let m = mats.get(key);
  if (!m) mats.set(key, (m = new THREE.MeshToonMaterial({ color, gradientMap: gradient })));
  return m;
}

// Normais suavizadas para o contorno não abrir nas quinas das caixas.
const outlineGeos = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
function outlineGeo(g: THREE.BufferGeometry) {
  let o = outlineGeos.get(g);
  if (!o) {
    const c = new THREE.BufferGeometry();
    c.setAttribute('position', g.getAttribute('position'));
    if (g.index) c.setIndex(g.index);
    o = mergeVertices(c, 1e-4);
    o.computeVertexNormals();
    outlineGeos.set(g, o);
  }
  return o;
}

const outlineMats = new Map<number, THREE.ShaderMaterial>();
function outlineMat(thickness: number) {
  let m = outlineMats.get(thickness);
  if (!m) {
    m = new THREE.ShaderMaterial({
      uniforms: { thickness: { value: thickness } },
      vertexShader: /* glsl */ `
        uniform float thickness;
        void main() {
          vec3 p = position + normalize(normal) * thickness;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `void main() { gl_FragColor = vec4(0.09, 0.075, 0.11, 1.0); }`,
      side: THREE.BackSide,
    });
    outlineMats.set(thickness, m);
  }
  return m;
}

export function inked(geo: THREE.BufferGeometry, mat: THREE.Material, thickness = 0.012) {
  const mesh = new THREE.Mesh(geo, mat);
  const line = new THREE.Mesh(outlineGeo(geo), outlineMat(thickness));
  line.raycast = () => {};
  mesh.add(line);
  return mesh;
}

type V3 = [number, number, number];

export function box(w: number, h: number, d: number, color: THREE.ColorRepresentation, pos: V3, line = 0.015) {
  const m = inked(new THREE.BoxGeometry(w, h, d), toon(color), line);
  m.position.set(...pos);
  return m;
}

export function cyl(rt: number, rb: number, h: number, color: THREE.ColorRepresentation, pos: V3, seg = 20, line = 0.015) {
  const m = inked(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color), line);
  m.position.set(...pos);
  return m;
}

export function ball(r: number, color: THREE.ColorRepresentation, pos: V3, line = 0.012) {
  const m = inked(new THREE.SphereGeometry(r, 20, 14), toon(color), line);
  m.position.set(...pos);
  return m;
}

export function blobShadow(r = 0.35) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.005;
  return m;
}
