import * as THREE from 'three';
import type { Emocao, Look } from '../../shared/types';

// A cabeça é uma esfera; o rosto é pintado num canvas equirretangular.
// A frente da esfera (+z) cai em u = 0.25, então o centro do rosto fica em x = W/4.
const W = 1024, H = 512, S = 2;
const CX = 128, EYE_Y = 122, MOUTH_Y = 152, EYE_DX = 23;
const INK = '#18131c';

export class Face {
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private key = '';

  constructor(private look: Look) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    this.ctx = c.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(c);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
  }

  draw(emocao: Emocao, mouthOpen: number, blink: boolean, lookX = 0) {
    const key = `${emocao}|${mouthOpen}|${blink}|${lookX.toFixed(1)}`;
    if (key === this.key) return;
    this.key = key;

    const g = this.ctx;
    g.setTransform(S, 0, 0, S, 0, 0);
    g.fillStyle = this.look.pele;
    g.fillRect(0, 0, W / S, H / S);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = INK;
    g.fillStyle = INK;

    this.beard();
    if (['timido', 'flertando', 'rindo', 'nervoso'].includes(emocao)) this.blush(emocao === 'timido' ? 0.55 : 0.35);
    this.brows(emocao);
    this.eyes(emocao, blink, lookX);
    this.mouth(emocao, mouthOpen);
    if (emocao === 'nervoso') this.sweat();
    this.texture.needsUpdate = true;
  }

  private beard() {
    const b = this.look.barba;
    if (!b || b === 'nenhuma') return;
    const g = this.ctx;
    g.save();
    g.globalAlpha = b === 'cheia' ? 0.95 : 0.28;
    g.fillStyle = this.look.cabelo;
    g.beginPath();
    g.moveTo(CX - 40, 128);
    g.quadraticCurveTo(CX - 38, 186, CX, 192);
    g.quadraticCurveTo(CX + 38, 186, CX + 40, 128);
    g.lineTo(CX + 30, 140);
    g.quadraticCurveTo(CX, 136, CX - 30, 140);
    g.closePath();
    g.fill();
    if (b === 'cheia') {
      // bigode + espaço da boca
      g.fillRect(CX - 16, 143, 32, 5);
      g.globalAlpha = 1;
      g.fillStyle = this.look.pele;
      g.beginPath();
      g.ellipse(CX, MOUTH_Y + 2, 13, 5, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  private blush(a: number) {
    const g = this.ctx;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = '#ff7a8a';
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(CX + s * 30, 140, 10, 5, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  private brows(e: Emocao) {
    const g = this.ctx;
    g.lineWidth = this.look.feminino ? 2.2 : 3.4;
    g.strokeStyle = this.look.feminino ? INK : this.look.cabelo === '#141214' ? INK : shade(this.look.cabelo, -0.35);
    const by = EYE_Y - 16;
    for (const s of [-1, 1]) {
      let inner = 0, outer = 0;
      if (e === 'irritado') { inner = 5; outer = -2; }
      else if (e === 'triste' || e === 'nervoso' || e === 'timido') { inner = -4; outer = 2; }
      else if (e === 'surpreso') { inner = -6; outer = -6; }
      else if (e === 'flertando' || e === 'confiante') { if (s === 1) { inner = -4; outer = -5; } }
      g.beginPath();
      g.moveTo(CX + s * 10, by + inner);
      g.quadraticCurveTo(CX + s * 20, by - 3 + (inner + outer) / 2, CX + s * 31, by + outer);
      g.stroke();
    }
    g.strokeStyle = INK;
  }

  private eyes(e: Emocao, blink: boolean, lookX: number) {
    const g = this.ctx;
    const fem = !!this.look.feminino;
    const ry = fem ? 12.5 : 10, rx = fem ? 8.5 : 7;
    for (const s of [-1, 1]) {
      const x = CX + s * EYE_DX;
      g.lineWidth = 3;
      if (blink || e === 'rindo') {
        // olho fechado: arco ^
        g.beginPath();
        if (e === 'rindo') { g.moveTo(x - 8, EYE_Y + 3); g.quadraticCurveTo(x, EYE_Y - 8, x + 8, EYE_Y + 3); }
        else { g.moveTo(x - 8, EYE_Y + 1); g.quadraticCurveTo(x, EYE_Y + 5, x + 8, EYE_Y + 1); }
        g.stroke();
        continue;
      }
      const big = e === 'surpreso' ? 1.25 : e === 'nervoso' ? 0.85 : 1;
      // branco do olho
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.ellipse(x, EYE_Y, rx * 1.25 * big, ry * big, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      // íris
      const dy = e === 'timido' ? 3 : 0;
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(x + lookX * 3, EYE_Y + 1 + dy, rx * 0.8 * big, ry * 0.8 * big, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(x + lookX * 3 - 2, EYE_Y - 3 + dy, 2.4, 0, Math.PI * 2);
      g.fill();
      // pálpebra: olhar meio fechado
      const lid = e === 'confiante' ? 0.45 : e === 'flertando' ? 0.5 : e === 'triste' ? 0.35 : e === 'irritado' ? 0.3 : 0;
      if (lid) {
        g.fillStyle = this.look.pele;
        g.fillRect(x - rx * 1.5, EYE_Y - ry - 2, rx * 3, ry * 2 * lid + 2);
        g.beginPath();
        g.moveTo(x - rx * 1.3, EYE_Y - ry + ry * 2 * lid);
        g.lineTo(x + rx * 1.3, EYE_Y - ry + ry * 2 * lid);
        g.stroke();
      }
      if (fem) {
        g.lineWidth = 2.4;
        g.beginPath();
        g.moveTo(x + s * rx * 1.1, EYE_Y - ry * 0.6);
        g.lineTo(x + s * (rx * 1.1 + 5), EYE_Y - ry * 0.9 - 3);
        g.stroke();
      }
    }
    g.fillStyle = INK;
  }

  private mouth(e: Emocao, open: number) {
    const g = this.ctx;
    const y = MOUTH_Y;
    g.lineWidth = 2.8;
    const lip = this.look.feminino ? '#c4455d' : '#9a4a4a';
    const talkOpen = open > 0;

    const openMouth = (w: number, h: number) => {
      g.fillStyle = '#5a1f2b';
      g.beginPath();
      g.ellipse(CX, y + 1, w, h, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#e8737f';
      g.beginPath();
      g.ellipse(CX, y + h * 0.55, w * 0.55, h * 0.35, 0, 0, Math.PI * 2);
      g.fill();
    };

    if (e === 'rindo') {
      g.fillStyle = '#5a1f2b';
      g.beginPath();
      g.moveTo(CX - 14, y - 3);
      g.quadraticCurveTo(CX, y - 1, CX + 14, y - 3);
      g.quadraticCurveTo(CX, y + 18 + open * 2, CX - 14, y - 3);
      g.fill();
      g.stroke();
      return;
    }
    if (e === 'surpreso') return openMouth(6, 7 + open * 2);
    if (talkOpen) return openMouth(e === 'feliz' || e === 'flertando' ? 9 : 7, 3 + open * 2.5);

    g.strokeStyle = INK;
    g.beginPath();
    switch (e) {
      case 'feliz':
        g.moveTo(CX - 11, y - 2); g.quadraticCurveTo(CX, y + 8, CX + 11, y - 2); break;
      case 'confiante':
      case 'flertando':
        g.moveTo(CX - 9, y + 1); g.quadraticCurveTo(CX + 2, y + 5, CX + 12, y - 4); break;
      case 'timido':
        g.moveTo(CX - 5, y); g.quadraticCurveTo(CX, y + 3, CX + 5, y); break;
      case 'nervoso':
        g.moveTo(CX - 9, y + 1); g.lineTo(CX - 4, y - 2); g.lineTo(CX + 1, y + 1); g.lineTo(CX + 5, y - 2); g.lineTo(CX + 9, y + 1); break;
      case 'irritado':
      case 'triste':
        g.moveTo(CX - 9, y + 4); g.quadraticCurveTo(CX, y - 3, CX + 9, y + 4); break;
      default:
        g.moveTo(CX - 7, y); g.quadraticCurveTo(CX, y + 2, CX + 7, y);
    }
    g.stroke();
    if (this.look.feminino) {
      g.save();
      g.globalAlpha = 0.5;
      g.strokeStyle = lip;
      g.lineWidth = 4;
      g.stroke();
      g.restore();
    }
  }

  private sweat() {
    const g = this.ctx;
    g.fillStyle = '#9fd8ff';
    g.beginPath();
    g.moveTo(CX + 40, 96);
    g.quadraticCurveTo(CX + 46, 108, CX + 40, 112);
    g.quadraticCurveTo(CX + 34, 108, CX + 40, 96);
    g.fill();
    g.lineWidth = 1.8;
    g.stroke();
  }
}

export function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return '#' + c.getHexString();
}
