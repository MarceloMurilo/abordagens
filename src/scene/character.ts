import * as THREE from 'three';
import type { Emocao, Gesto, Look } from '../../shared/types';
import { Face, shade } from './face';
import { blobShadow, inked, toon } from './toon';

type Joint = 'hips' | 'spine' | 'head' | 'shL' | 'elL' | 'shR' | 'elR' | 'lgL' | 'knL' | 'lgR' | 'knR';
type Pose = Partial<Record<Joint, [number, number, number]>>;
const JOINTS: Joint[] = ['hips', 'spine', 'head', 'shL', 'elL', 'shR', 'elR', 'lgL', 'knL', 'lgR', 'knR'];

const LINE = 0.0075;
const HEAD_R = 0.125;

// Lado L fica em +x, R em -x. O personagem olha para +z.
// Braço erguido para o lado: shR.z negativo / shL.z positivo. Para frente: sh*.x negativo.
const GESTURES: Record<Exclude<Gesto, 'nenhum'>, { dur: number; pose: (t: number) => Pose }> = {
  acenar: { dur: 2.0, pose: (t) => ({ shR: [0, 0, -2.5], elR: [0, 0, -0.35 + Math.sin(t * 14) * 0.4], head: [0, 0, 0.08] }) },
  cocar_cabeca: { dur: 2.4, pose: (t) => ({ shR: [-0.5, 0, -2.1], elR: [Math.sin(t * 18) * 0.12, 0, -2.3], head: [0.12, 0, -0.15] }) },
  rir: { dur: 2.0, pose: (t) => ({ spine: [-0.12 + Math.sin(t * 24) * 0.04, 0, 0], head: [-0.22, 0, 0], shL: [-0.3, 0, 0.2], shR: [-0.3, 0, -0.2], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0] }) },
  ombros: { dur: 1.8, pose: () => ({ shL: [0, 0, 0.55], shR: [0, 0, -0.55], elL: [-1.3, 0.3, 0], elR: [-1.3, -0.3, 0], head: [0, 0, 0.18] }) },
  apontar: { dur: 1.8, pose: () => ({ shR: [-1.35, 0, 0.1], elR: [-0.1, 0, 0] }) },
  inclinar: { dur: 2.6, pose: () => ({ spine: [0.2, 0, 0], head: [0.05, 0, 0.12] }) },
  cruzar_bracos: { dur: 3.6, pose: () => ({ shL: [-0.35, 0, -0.32], shR: [-0.35, 0, 0.32], elL: [-1.9, -1.0, 0], elR: [-1.9, 1.0, 0], spine: [-0.05, 0, 0] }) },
  mao_no_peito: { dur: 2.4, pose: () => ({ shR: [-0.45, 0, 0.28], elR: [-2.05, 0.6, 0], head: [0.1, 0, 0.1] }) },
};

const EMOTION_POSE: Partial<Record<Emocao, Pose>> = {
  confiante: { spine: [-0.06, 0, 0], head: [-0.06, 0, 0] },
  timido: { head: [0.18, 0, 0.06], shL: [0, 0, 0.02], shR: [0, 0, -0.02] },
  nervoso: { head: [0.08, 0, 0], shL: [-0.2, 0, -0.05], shR: [-0.2, 0, 0.05], elL: [-0.9, -0.4, 0], elR: [-0.9, 0.4, 0] },
  triste: { head: [0.22, 0, 0], spine: [0.08, 0, 0] },
  flertando: { head: [0, 0, 0.14], spine: [-0.03, 0, 0] },
  irritado: { head: [-0.04, 0, 0] },
  surpreso: { head: [-0.1, 0, 0], spine: [-0.06, 0, 0] },
};

export class Character {
  readonly root = new THREE.Group();
  readonly look: Look;
  private j = {} as Record<Joint, THREE.Object3D>;
  private cur = {} as Record<Joint, THREE.Euler>;
  private face: Face;
  private hipsY: number;

  emocao: Emocao = 'neutro';
  talking = 0;
  sitting: { seatY: number } | null = null;
  lookAt: THREE.Vector3 | null = null;
  private gesture: { name: Exclude<Gesto, 'nenhum'>; t: number } | null = null;
  private path: THREE.Vector3[] = [];
  private walkDone?: () => void;
  private walkPhase = 0;
  private faceYaw: number | null = null;
  private blinkT = 2;
  private time = Math.random() * 10;

  constructor(look: Look) {
    this.look = look;
    this.face = new Face(look);
    this.build();
    this.hipsY = this.j.hips.position.y;
    this.face.draw('neutro', 0, false);
  }

  private build() {
    const L = this.look;
    const fem = !!L.feminino;
    const bw = L.porte;
    const skin = toon(L.pele);
    const shirt = toon(L.camisa);
    const pants = toon(L.vestido ? L.pele : L.calca);
    const jacket = L.jaqueta ? toon(L.jaqueta) : shirt;
    const sleeve = L.regata ? skin : jacket;
    const shoe = toon(L.sapato);
    const hair = toon(L.cabelo);

    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], scale?: [number, number, number]) => {
      const m = inked(geo, mat, LINE);
      m.position.set(...pos);
      if (scale) m.scale.set(...scale);
      parent.add(m);
      return m;
    };
    const joint = (name: Joint, parent: THREE.Object3D, pos: [number, number, number]) => {
      const o = new THREE.Group();
      o.position.set(...pos);
      parent.add(o);
      this.j[name] = o;
      this.cur[name] = new THREE.Euler();
      return o;
    };

    const body = new THREE.Group();
    body.scale.setScalar(L.altura);
    this.root.add(body, blobShadow(0.32 * bw));

    const hips = joint('hips', body, [0, 0.94, 0]);
    add(hips, new THREE.SphereGeometry(0.15, 18, 12), L.vestido ? shirt : pants, [0, 0.0, 0], [1.05 * (fem ? 1.08 : bw * 0.95), 0.75, 0.8]);

    // Tronco
    const spine = joint('spine', hips, [0, 0.04, 0]);
    const shoulderW = fem ? 0.165 : 0.2 * Math.min(bw, 1.25);
    const torso = add(spine, new THREE.CapsuleGeometry(0.15, 0.24, 6, 16), jacket, [0, 0.24, 0],
      [fem ? 0.92 : 1.05 * bw, 1, fem ? 0.82 : 0.78 * Math.min(bw, 1.2)]);
    if (L.jaqueta) add(spine, new THREE.BoxGeometry(0.09, 0.3, 0.02), shirt, [0, 0.3, 0.12 * Math.min(bw, 1.2)]);
    if (L.capuz) add(spine, new THREE.TorusGeometry(0.1, 0.04, 8, 18), jacket, [0, 0.5, -0.06], [1, 1, 1]).rotation.x = Math.PI / 2.4;
    if (L.vestido) {
      add(hips, new THREE.CylinderGeometry(0.15, 0.3, 0.46, 20, 1, true), shirt, [0, -0.2, 0]);
    }
    torso.name = 'torso';

    // Pescoço e cabeça
    add(spine, new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12), skin, [0, 0.5, 0]);
    const head = joint('head', spine, [0, 0.53, 0]);
    head.scale.setScalar(1.22); // cabeça maior: proporção mais "desenho"
    const headMat = new THREE.MeshToonMaterial({ map: this.face.texture, gradientMap: (skin as THREE.MeshToonMaterial).gradientMap });
    const headMesh = add(head, new THREE.SphereGeometry(HEAD_R, 32, 24), headMat, [0, 0.11, 0], [0.95, 1.05, 1]);
    add(head, new THREE.SphereGeometry(0.025, 8, 6), skin, [0.118, 0.105, 0], [0.6, 1, 1]);
    add(head, new THREE.SphereGeometry(0.025, 8, 6), skin, [-0.118, 0.105, 0], [0.6, 1, 1]);
    add(head, new THREE.SphereGeometry(0.018, 8, 6), skin, [0, 0.095, HEAD_R * 0.98], [0.9, 1, 0.9]); // nariz
    this.buildHair(head, hair, headMesh.position.y);
    if (L.oculos) this.buildGlasses(head, headMesh.position.y);

    // Braços
    for (const s of [1, -1] as const) {
      const side = s === 1 ? 'L' : 'R';
      const sh = joint(`sh${side}` as Joint, spine, [s * shoulderW, 0.43, 0]);
      const armR = fem ? 0.04 : 0.048 * Math.min(bw, 1.35);
      add(sh, new THREE.CapsuleGeometry(armR, 0.2, 4, 10), sleeve, [0, -0.13, 0]);
      const el = joint(`el${side}` as Joint, sh, [0, -0.27, 0]);
      add(el, new THREE.CapsuleGeometry(armR * 0.9, 0.18, 4, 10), L.regata || L.vestido ? skin : sleeve, [0, -0.12, 0]);
      add(el, new THREE.SphereGeometry(0.045, 12, 8), skin, [0, -0.26, 0], [0.85, 1.1, 0.7]);
    }

    // Pernas
    for (const s of [1, -1] as const) {
      const side = s === 1 ? 'L' : 'R';
      const lg = joint(`lg${side}` as Joint, hips, [s * (fem ? 0.08 : 0.09 * Math.min(bw, 1.2)), -0.03, 0]);
      add(lg, new THREE.CapsuleGeometry(fem ? 0.06 : 0.07 * Math.min(bw, 1.2), 0.3, 4, 10), pants, [0, -0.22, 0]);
      const kn = joint(`kn${side}` as Joint, lg, [0, -0.45, 0]);
      add(kn, new THREE.CapsuleGeometry(fem ? 0.048 : 0.058, 0.3, 4, 10), L.vestido ? skin : pants, [0, -0.21, 0]);
      add(kn, new THREE.BoxGeometry(0.1, 0.06, 0.2), shoe, [0, -0.44, 0.04]);
    }
  }

  private buildHair(head: THREE.Object3D, hair: THREE.Material, cy: number) {
    const r = HEAD_R * 1.07;
    const style = this.look.estiloCabelo;
    const cap = (thetaLen: number, scale = 1) => {
      const g = new THREE.SphereGeometry(r * scale, 28, 16, 0, Math.PI * 2, 0, thetaLen);
      const m = inked(g, hair, LINE);
      m.position.set(0, cy, -0.005);
      m.scale.set(0.97, 1.05, 1.02);
      head.add(m);
      return m;
    };
    // Lados e nuca, deixando a frente (rosto) aberta.
    const back = (thetaLen: number, open = 1.15) => {
      const g = new THREE.SphereGeometry(r, 28, 16, Math.PI / 2 + open, Math.PI * 2 - open * 2, 0, thetaLen);
      const m = inked(g, hair, LINE);
      m.position.set(0, cy, -0.005);
      m.scale.set(0.97, 1.05, 1.02);
      head.add(m);
      return m;
    };
    const blob = (rad: number, pos: [number, number, number], sc?: [number, number, number]) => {
      const m = inked(new THREE.SphereGeometry(rad, 16, 12), hair, LINE);
      m.position.set(pos[0], cy + pos[1], pos[2]);
      if (sc) m.scale.set(...sc);
      head.add(m);
      return m;
    };

    switch (style) {
      case 'raspado':
        cap(Math.PI * 0.36, 0.95); back(Math.PI * 0.55, 1.2); break;
      case 'curto':
        cap(Math.PI * 0.34); back(Math.PI * 0.58); blob(0.06, [0.03, 0.1, 0.07], [1.6, 0.6, 1]); break;
      case 'topete':
        cap(Math.PI * 0.34); back(Math.PI * 0.55); blob(0.07, [0, 0.12, 0.06], [1.5, 0.9, 1.2]); break;
      case 'cacheado': {
        cap(Math.PI * 0.4); back(Math.PI * 0.55);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          const up = i % 2 ? 0.1 : 0.06;
          if (Math.sin(a) > 0.55) blob(0.04, [Math.cos(a) * 0.08, 0.12, Math.sin(a) * 0.09]);
          else blob(0.045, [Math.cos(a) * 0.115, up, Math.sin(a) * 0.115]);
        }
        blob(0.06, [0, 0.14, 0]);
        break;
      }
      case 'medio':
        cap(Math.PI * 0.36); back(Math.PI * 0.62, 1.05);
        blob(0.1, [0, -0.06, -0.07], [1.25, 1.3, 0.7]);
        blob(0.05, [0.11, -0.04, 0.0], [0.7, 1.6, 1]);
        blob(0.05, [-0.11, -0.04, 0.0], [0.7, 1.6, 1]);
        break;
      case 'longo':
        cap(Math.PI * 0.38); back(Math.PI * 0.62, 1.0);
        blob(0.13, [0, -0.15, -0.07], [1.1, 2.0, 0.55]);
        blob(0.05, [0.115, -0.08, 0.02], [0.65, 2.2, 0.9]);
        blob(0.05, [-0.115, -0.08, 0.02], [0.65, 2.2, 0.9]);
        blob(0.05, [0.04, 0.1, 0.1], [1.4, 0.5, 0.6]).rotation.z = 0.4;
        break;
      case 'rabo':
        cap(Math.PI * 0.38); back(Math.PI * 0.58, 1.05);
        blob(0.05, [0, 0.06, -0.13]);
        blob(0.06, [0, -0.1, -0.16], [0.8, 2.2, 0.8]).rotation.x = 0.25;
        break;
      case 'coque':
        cap(Math.PI * 0.38); back(Math.PI * 0.58, 1.05);
        blob(0.075, [0, 0.15, -0.06]);
        break;
      case 'chanel':
        cap(Math.PI * 0.4); back(Math.PI * 0.66, 0.95);
        blob(0.06, [0.105, -0.02, 0.02], [0.7, 1.3, 1]);
        blob(0.06, [-0.105, -0.02, 0.02], [0.7, 1.3, 1]);
        blob(0.05, [-0.03, 0.1, 0.1], [1.6, 0.5, 0.6]).rotation.z = -0.35;
        break;
    }
  }

  private buildGlasses(head: THREE.Object3D, cy: number) {
    const ink = toon('#1d1a22');
    for (const s of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.004, 6, 20), ink);
      ring.position.set(s * 0.045, cy + 0.007, HEAD_R * 0.93);
      ring.rotation.y = s * 0.25;
      head.add(ring);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.005), ink);
    bridge.position.set(0, cy + 0.012, HEAD_R * 0.98);
    head.add(bridge);
  }

  // ---------- comportamento ----------

  walkTo(points: THREE.Vector3[]): Promise<void> {
    this.path = points.map((p) => p.clone());
    this.faceYaw = null;
    return new Promise((r) => (this.walkDone = r));
  }

  get walking() { return this.path.length > 0; }

  faceTowards(target: THREE.Vector3) {
    this.faceYaw = Math.atan2(target.x - this.root.position.x, target.z - this.root.position.z);
  }

  play(g: Gesto) {
    if (g !== 'nenhum') this.gesture = { name: g, t: 0 };
  }

  say(seconds: number) { this.talking = Math.max(this.talking, seconds); }

  headWorld(out = new THREE.Vector3()) {
    return this.j.head.getWorldPosition(out).add(new THREE.Vector3(0, 0.13 * this.look.altura, 0));
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    const pose: Record<Joint, [number, number, number]> = Object.fromEntries(JOINTS.map((k) => [k, [0, 0, 0]])) as any;
    const addPose = (p: Pose | undefined, w = 1) => {
      if (!p) return;
      for (const k in p) {
        const v = p[k as Joint]!;
        const d = pose[k as Joint];
        d[0] += v[0] * w; d[1] += v[1] * w; d[2] += v[2] * w;
      }
    };

    // repouso + respiração
    const breath = Math.sin(t * 1.8);
    addPose({
      shL: [0.02 * breath, 0, 0.1 + 0.015 * breath],
      shR: [0.02 * breath, 0, -0.1 - 0.015 * breath],
      elL: [-0.12, 0, 0], elR: [-0.12, 0, 0],
      spine: [0.01 * breath, 0, 0],
      head: [0.02 * Math.sin(t * 0.7), 0.05 * Math.sin(t * 0.43), 0],
    });

    // andar
    let hipsLift = 0;
    if (this.path.length) {
      const target = this.path[0];
      const pos = this.root.position;
      const dx = target.x - pos.x, dz = target.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const speed = 1.15;
      if (dist < 0.04) {
        this.path.shift();
        if (!this.path.length) { this.walkDone?.(); this.walkDone = undefined; }
      } else {
        const step = Math.min(dist, speed * dt);
        pos.x += (dx / dist) * step;
        pos.z += (dz / dist) * step;
        this.root.rotation.y = lerpAngle(this.root.rotation.y, Math.atan2(dx, dz), 1 - Math.exp(-dt * 10));
      }
      this.walkPhase += dt * 7.5;
      const s = Math.sin(this.walkPhase);
      addPose({
        lgL: [s * 0.5, 0, 0], lgR: [-s * 0.5, 0, 0],
        knL: [Math.max(0, -s) * 0.8, 0, 0], knR: [Math.max(0, s) * 0.8, 0, 0],
        shL: [-s * 0.35, 0, 0], shR: [s * 0.35, 0, 0],
        elL: [-0.25, 0, 0], elR: [-0.25, 0, 0],
        spine: [0.05, -s * 0.06, 0],
      });
      hipsLift = Math.abs(Math.cos(this.walkPhase)) * 0.025;
    } else if (this.faceYaw !== null) {
      this.root.rotation.y = lerpAngle(this.root.rotation.y, this.faceYaw, 1 - Math.exp(-dt * 5));
    }

    // sentada
    if (this.sitting) {
      addPose({ lgL: [-1.5, 0, 0.06], lgR: [-1.5, 0, -0.06], knL: [1.5, 0, 0], knR: [1.5, 0, 0], shL: [-0.35, 0, -0.05], shR: [-0.35, 0, 0.05], elL: [-0.75, 0, 0], elR: [-0.75, 0, 0] });
      this.j.hips.position.y = this.sitting.seatY / this.look.altura + 0.07;
      this.j.hips.position.z = -0.04;
    } else {
      this.j.hips.position.y = this.hipsY + hipsLift;
      this.j.hips.position.z = 0;
    }

    addPose(EMOTION_POSE[this.emocao]);

    if (this.gesture) {
      const gd = GESTURES[this.gesture.name];
      this.gesture.t += dt;
      const p = this.gesture.t / gd.dur;
      const w = smooth(Math.min(1, p / 0.18)) * smooth(Math.min(1, (1 - p) / 0.22));
      addPose(gd.pose(this.gesture.t), w);
      if (p >= 1) this.gesture = null;
    }

    if (this.talking > 0) {
      this.talking -= dt;
      addPose({ head: [Math.sin(t * 7) * 0.035, 0, Math.sin(t * 3.1) * 0.02] });
    }

    // cabeça olha para o alvo
    if (this.lookAt && !this.walking) {
      const local = this.root.worldToLocal(this.lookAt.clone());
      const headPos = this.j.head.getWorldPosition(new THREE.Vector3());
      const hl = this.root.worldToLocal(headPos);
      const d = local.sub(hl);
      const yaw = clamp(Math.atan2(d.x, d.z), -0.9, 0.9);
      const pitch = clamp(-Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.4, 0.4);
      addPose({ head: [pitch * 0.8, yaw * 0.75, 0], spine: [0, yaw * 0.25, 0] });
    }

    // aplica com suavização
    const k = 1 - Math.exp(-dt * 12);
    for (const name of JOINTS) {
      const c = this.cur[name], d = pose[name];
      c.x += (d[0] - c.x) * k; c.y += (d[1] - c.y) * k; c.z += (d[2] - c.z) * k;
      this.j[name].rotation.copy(c);
    }

    // rosto
    this.blinkT -= dt;
    const blink = this.blinkT < 0.12;
    if (this.blinkT < 0) this.blinkT = 2 + Math.random() * 3.5;
    const mouth = this.talking > 0 ? Math.round((Math.sin(t * 17) * 0.5 + 0.5 + Math.sin(t * 9.3) * 0.3) * 2) : 0;
    this.face.draw(this.emocao, Math.max(0, mouth), blink);
  }
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
function lerpAngle(a: number, b: number, k: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

export { shade };
