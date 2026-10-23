import * as THREE from 'three';
import type { Emocao, Look } from '../../shared/types';
import { Character } from './character';

// Retratos "3x4" dos personagens para as telas de escolha e final.
// Um renderer pequeno e separado, reaproveitado para todos os retratos.
let renderer: THREE.WebGLRenderer | null = null;
const SIZE = 320;

export function portrait(look: Look, emocao: Emocao, bg: string): string {
  renderer ??= new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  const sun = new THREE.DirectionalLight('#ffffff', 1.5);
  sun.position.set(2, 4, 5);
  scene.add(new THREE.HemisphereLight('#ffffff', '#888888', 1.5), sun);

  const c = new Character(look);
  c.emocao = emocao;
  c.root.rotation.y = 0.25;
  scene.add(c.root);
  // assenta a pose e a expressão (1,5 s: antes da primeira piscada, que vem aos 2 s)
  for (let i = 0; i < 30; i++) c.update(0.05);

  const head = c.headWorld();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
  cam.position.set(head.x + 0.22, head.y + 0.04, head.z + 1.0);
  cam.lookAt(head.x, head.y - 0.03, head.z);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL('image/png');

  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      for (const m of [o.material].flat()) { (m as any).map?.dispose(); m.dispose(); }
    }
  });
  return url;
}
