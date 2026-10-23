import * as THREE from 'three';
import type { SceneId } from '../../shared/scenes';
import type { Look } from '../../shared/types';
import { Character } from './character';
import { STAGES, type Stage } from './environments';

export type Shot = 'wide' | 'him' | 'her' | 'preview';
export type CameraMode = 'auto' | 'wide' | 'him' | 'her';

const UP = new THREE.Vector3(0, 1, 0);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
  private hemi = new THREE.HemisphereLight('#ffffff', '#888888', 1.4);
  private sun = new THREE.DirectionalLight('#ffffff', 1.5);
  private stage: Stage | null = null;
  private stageGroup = new THREE.Group();
  girl: Character | null = null;
  man: Character | null = null;
  engaged = false;
  private camPos = new THREE.Vector3(0, 1.5, 4);
  private camLook = new THREE.Vector3(0, 1, 0);
  private shot: Shot = 'wide';
  private clock = new THREE.Clock();
  private previewAngle = 0;
  private mode: CameraMode = 'auto';
  private orbit = { yaw: 0, pitch: 0, zoom: 1 };
  private sides: [number, number] = [1, 1];
  private ray = new THREE.Raycaster();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.sun.position.set(4, 8, 5);
    this.scene.add(this.hemi, this.sun, this.stageGroup);
    this.scene.fog = new THREE.Fog('#ffffff', 10, 30);
    addEventListener('resize', () => this.resize());
    this.bindOrbit(canvas);
    this.resize();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 55 : 40;
    this.camera.updateProjectionMatrix();
  }

  setStage(id: SceneId | 'preview') {
    this.stageGroup.clear();
    this.man = null;
    this.resetOrbit();
    this.sides = [1, 1];
    if (id === 'preview') {
      this.stage = null;
      const bg = '#f7d9d9';
      this.scene.background = new THREE.Color(bg);
      (this.scene.fog as THREE.Fog).color.set(bg);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshToonMaterial({ color: '#f2b8c0' }));
      disc.rotation.x = -Math.PI / 2;
      this.stageGroup.add(disc);
      this.hemi.intensity = 1.6; this.sun.intensity = 1.5;
      return;
    }
    const s = (this.stage = STAGES[id]());
    this.stageGroup.add(s.group);
    this.scene.background = new THREE.Color(s.bg);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.set(s.bg); fog.near = s.fog[0]; fog.far = s.fog[1];
    this.hemi.color.set(s.light.sky); this.hemi.groundColor.set(s.light.ground); this.hemi.intensity = s.light.ambient;
    this.sun.color.set(s.light.sunColor); this.sun.intensity = s.light.sun;
  }

  get currentStage() { return this.stage; }

  placeGirl(look: Look) {
    const g = new Character(look);
    this.girl = g;
    this.stageGroup.add(g.root);
    if (this.stage) {
      g.root.position.copy(this.stage.girl.pos);
      g.root.rotation.y = this.stage.girl.rotY;
      if (this.stage.girl.seatY) g.sitting = { seatY: this.stage.girl.seatY };
    }
    return g;
  }

  spawnMan(look: Look) {
    const m = new Character(look);
    this.man = m;
    this.stageGroup.add(m.root);
    m.root.position.copy(this.stage!.man.path[0]);
    return m;
  }

  removeMan() {
    if (this.man) this.stageGroup.remove(this.man.root);
    this.man = null;
  }

  /** Plano pedido pelo jogo. Se a jogadora fixou um plano, ele tem prioridade. */
  setShot(s: Shot) { this.shot = s; }

  setCameraMode(m: CameraMode) {
    this.mode = m;
    this.resetOrbit();
  }

  resetOrbit() { this.orbit = { yaw: 0, pitch: 0, zoom: 1 }; }

  private get activeShot(): Shot {
    if (this.shot === 'preview' || this.mode === 'auto') return this.shot;
    return this.mode;
  }

  private bindOrbit(canvas: HTMLCanvasElement) {
    let drag: { x: number; y: number; id: number } | null = null;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      this.orbit.yaw -= (e.clientX - drag.x) * 0.0035;
      this.orbit.pitch = clamp(this.orbit.pitch + (e.clientY - drag.y) * 0.0028, -0.4, 0.8);
      drag.x = e.clientX; drag.y = e.clientY;
    });
    const end = () => { drag = null; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.orbit.zoom = clamp(this.orbit.zoom * Math.exp(e.deltaY * 0.001), 0.45, 2.2);
    }, { passive: false });
    canvas.style.cursor = 'grab';
  }

  // Fração livre (0..1) da linha entre o alvo e a câmera; < 1 se algo do cenário está no caminho.
  private clearance(look: THREE.Vector3, pos: THREE.Vector3) {
    if (!this.stage) return 1;
    const d = pos.clone().sub(look);
    const len = d.length();
    this.ray.set(look, d.divideScalar(len));
    this.ray.far = len;
    const hit = this.ray.intersectObject(this.stage.group, true)[0];
    return hit ? hit.distance / len : 1;
  }

  // Tira a câmera de dentro de paredes/estantes, trazendo-a para perto do alvo.
  private unblock(look: THREE.Vector3, pos: THREE.Vector3) {
    const c = this.clearance(look, pos);
    if (c < 1) pos.lerpVectors(look, pos, Math.max(0.4, c - 0.08));
    return pos;
  }

  private targetShot(): [THREE.Vector3, THREE.Vector3] {
    const [pos, look] = this.baseShot();
    // órbita manual da jogadora em volta do ponto de mira
    const { yaw, pitch, zoom } = this.orbit;
    if (yaw || pitch || zoom !== 1) {
      const off = pos.clone().sub(look);
      off.applyAxisAngle(UP, yaw);
      const side = new THREE.Vector3().crossVectors(off, UP).normalize();
      if (side.lengthSq() > 0) off.applyAxisAngle(side, -pitch);
      off.multiplyScalar(zoom);
      pos.copy(look).add(off);
      pos.y = Math.max(0.25, pos.y);
    }
    if (this.activeShot !== 'preview') this.unblock(look, pos);
    return [pos, look];
  }

  private baseShot(): [THREE.Vector3, THREE.Vector3] {
    const t = this.clock.elapsedTime;
    const shot = this.activeShot;
    if (shot === 'preview' && this.girl) {
      this.previewAngle += 0.0025;
      const a = Math.sin(this.previewAngle) * 0.6;
      const landscape = innerWidth > innerHeight;
      // em retrato o menu é uma gaveta de ~60% da altura: a garota vai para o espaço livre de cima
      const dist = landscape ? 3.3 : 5.9;
      const right = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
      // em paisagem a garota fica à direita do painel; em retrato, acima dele
      const look = new THREE.Vector3(0, landscape ? 0.85 : -0.72, 0).addScaledVector(right, landscape ? -0.75 : 0);
      return [new THREE.Vector3(Math.sin(a) * dist, landscape ? 1.05 : 1.0, Math.cos(a) * dist).addScaledVector(right, landscape ? -0.75 : 0), look];
    }
    if (!this.stage) return [this.camPos.clone(), this.camLook.clone()];
    if (shot === 'wide' || !this.girl || !this.man) {
      const sway = new THREE.Vector3(Math.sin(t * 0.2) * 0.15, Math.sin(t * 0.27) * 0.05, 0);
      return [this.stage.wide.pos.clone().add(sway), this.stage.wide.look.clone()];
    }
    // contraplano por cima do ombro, do lado que estiver livre
    const G = this.girl.headWorld(), M = this.man.headWorld();
    const [from, to] = shot === 'him' ? [G, M] : [M, G];
    const dir = to.clone().sub(from).setY(0).normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x);
    const make = (side: number): [THREE.Vector3, THREE.Vector3] => {
      const pos = from.clone().addScaledVector(dir, -1.05).addScaledVector(right, 0.62 * side).add(new THREE.Vector3(0, 0.18, 0));
      pos.y = Math.max(pos.y, to.y - 0.1);
      // mira abaixo do rosto para a cabeça ficar no terço de cima (o diálogo ocupa a parte de baixo)
      const look = to.clone().addScaledVector(right, -0.05 * side).add(new THREE.Vector3(0, -0.32, 0));
      pos.y += Math.sin(t * 0.5) * 0.01;
      return [pos, look];
    };
    // troca de ombro só quando o atual fica bloqueado (evita a câmera ficar pulando)
    const key = shot === 'him' ? 0 : 1;
    let side = this.sides[key];
    const cur = make(side);
    const curFree = this.clearance(cur[1], cur[0]);
    if (curFree < 0.98) {
      const alt = make(-side);
      if (this.clearance(alt[1], alt[0]) > curFree) { this.sides[key] = side = -side; return alt; }
    }
    return cur;
  }

  private tick() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.engaged && this.girl && this.man) {
      this.girl.lookAt = this.man.headWorld();
      this.man.lookAt = this.girl.headWorld();
    }
    this.girl?.update(dt);
    this.man?.update(dt);
    const [p, l] = this.targetShot();
    const k = 1 - Math.exp(-dt * 3.2);
    this.camPos.lerp(p, k);
    this.camLook.lerp(l, k);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.renderer.render(this.scene, this.camera);
  }

  snapCamera() {
    const [p, l] = this.targetShot();
    this.camPos.copy(p); this.camLook.copy(l);
  }
}
