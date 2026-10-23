import { World, type CameraMode } from './scene/world';
import { portrait } from './scene/portrait';
import { SCENES, type SceneId } from '../shared/scenes';
import {
  ACAO_DISPENSAR, ACAO_NUMERO,
  type Emocao, type Encontro, type EncontroFeito, type Final, type Gesto, type HairStyle, type Look, type TomDela, type Turno,
} from '../shared/types';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const world = new World($<HTMLCanvasElement>('#c'));
if (import.meta.env.DEV) (window as any).__world = world;

// ---------------- personagem da jogadora ----------------

const ESTILOS: [HairStyle, string][] = [['longo', 'Longo'], ['rabo', 'Rabo de cavalo'], ['coque', 'Coque'], ['chanel', 'Chanel']];
const CABELOS: [string, string][] = [['#2a1a12', 'preto'], ['#5a3420', 'castanho'], ['#a0662f', 'mel'], ['#e6c27a', 'loiro'], ['#b5452a', 'ruivo'], ['#e58fb5', 'rosa']];
const PELES = ['#f6d7bd', '#f0c9a8', '#d9a77f', '#a8714a', '#6b4128'];
const ROUPAS: [string, string][] = [['vestido', 'Vestido'], ['casual', 'Blusa + calça']];
const CORES: [string, string][] = [['#e86f8c', 'rosa'], ['#5b8fd1', 'azul'], ['#f2c14e', 'amarelo'], ['#2d2a32', 'preto'], ['#f4f1ea', 'branco'], ['#6fae6b', 'verde'], ['#b23b3b', 'vermelho']];

const pick = { estilo: 'longo' as HairStyle, cabelo: CABELOS[1][0], pele: PELES[1], roupa: 'vestido', cor: CORES[0][0] };

function girlLook(): Look {
  const vestido = pick.roupa === 'vestido';
  return {
    pele: pick.pele, cabelo: pick.cabelo, estiloCabelo: pick.estilo, camisa: pick.cor,
    calca: vestido ? pick.pele : '#3d4f75', sapato: vestido ? '#f4f1ea' : '#2d2a32',
    altura: 0.93, porte: 0.9, feminino: true, vestido,
  };
}

function girlDescricao() {
  const estilo = ESTILOS.find((e) => e[0] === pick.estilo)![1].toLowerCase();
  const cabelo = CABELOS.find((c) => c[0] === pick.cabelo)![1];
  const cor = CORES.find((c) => c[0] === pick.cor)![1];
  const roupa = pick.roupa === 'vestido' ? `um vestido ${cor}` : `blusa ${cor} e calça jeans`;
  return `mulher jovem e bonita, cabelo ${cabelo} (${estilo}), usando ${roupa}`;
}

function buildPicker(el: string, items: [string, string][] | string[], key: keyof typeof pick, swatch: boolean) {
  const box = $(el);
  for (const it of items) {
    const [value, label] = Array.isArray(it) ? it : [it, it];
    const b = document.createElement('button');
    b.type = 'button';
    if (swatch) { b.style.background = value; b.title = label; } else b.textContent = label;
    if (pick[key] === value) b.classList.add('on');
    b.onclick = () => {
      (pick as any)[key] = value;
      box.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      refreshPreview();
    };
    box.appendChild(b);
  }
}

function refreshPreview() {
  world.setStage('preview');
  const g = world.placeGirl(girlLook());
  g.emocao = 'feliz';
  world.setShot('preview');
}

buildPicker('#f-estilo', ESTILOS, 'estilo', false);
buildPicker('#f-cabelo', CABELOS, 'cabelo', true);
buildPicker('#f-pele', PELES, 'pele', true);
buildPicker('#f-roupa', ROUPAS, 'roupa', false);
buildPicker('#f-cor', CORES, 'cor', true);
refreshPreview();
world.snapCamera();

// ---------------- câmera ----------------

const camctl = $('#camctl');
camctl.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
  b.onclick = () => {
    const m = b.dataset.cam!;
    if (m === 'reset') { world.resetOrbit(); return; }
    world.setCameraMode(m as CameraMode);
    camctl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  };
});

// ---------------- API ----------------

// ---------------- API e chave do jogador ----------------

// VITE_API_URL só é preciso quando o front fica num domínio e o backend em outro.
const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const KEY_STORE = 'abordagens.openaiKey';
const keyInput = $<HTMLInputElement>('#f-key'), lembrar = $<HTMLInputElement>('#f-lembrar');
let chave = '';
let precisaChave = false;

class ApiError extends Error {
  constructor(readonly status: number, msg: string, readonly data: any) { super(msg); }
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (chave) headers['X-OpenAI-Key'] = chave;
  const r = await fetch(API + path, body === undefined ? { headers } : { method: 'POST', headers, body: JSON.stringify(body) });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new ApiError(r.status, data?.erro || r.statusText, data);
  }
  return r.json();
}

try {
  const salva = localStorage.getItem(KEY_STORE);
  if (salva) { keyInput.value = salva; lembrar.checked = true; }
} catch { /* armazenamento bloqueado: só não lembra */ }

function lerChave(): string | null {
  const k = keyInput.value.trim();
  if (k && !/^sk-[A-Za-z0-9_-]{20,300}$/.test(k)) return null;
  try {
    if (k && lembrar.checked) localStorage.setItem(KEY_STORE, k);
    else localStorage.removeItem(KEY_STORE);
  } catch { /* idem */ }
  return k;
}

function pedirChave() {
  precisaChave = true;
  const box = $<HTMLDetailsElement>('#keybox');
  box.open = true;
  box.classList.add('need');
  $('#key-title').textContent = 'Sua chave da OpenAI (necessária)';
}

api<{ precisaChave: boolean }>('/api/config').then((c) => { if (c.precisaChave) pedirChave(); }).catch(() => {});

let jogadora = { nome: 'Bia', descricao: '' };
let feitos: EncontroFeito[] = [];

// ---------------- diálogo ----------------

const dialog = $('#dialog'), bubble = $('.bubble'), who = $('.bubble .who'), text = $('.bubble .text');
const form = $<HTMLFormElement>('#say'), input = $<HTMLInputElement>('#msg');
const btnNum = $<HTMLButtonElement>('#btn-num'), btnBye = $<HTMLButtonElement>('#btn-bye');
const log = $('#log');

let typeToken = 0;
async function showLine(nome: string, fala: string, dela: boolean) {
  bubble.classList.toggle('ela', dela);
  who.textContent = nome;
  const tok = ++typeToken;
  text.textContent = '';
  for (let i = 1; i <= fala.length; i++) {
    if (tok !== typeToken) return;
    text.textContent = fala.slice(0, i);
    await sleep(fala[i - 1] === ',' || fala[i - 1] === '.' ? 90 : 22);
  }
}
bubble.addEventListener('click', () => typeToken++);

function showTyping(nome: string) {
  typeToken++;
  bubble.classList.remove('ela');
  who.textContent = nome;
  text.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
}

// O histórico mostra as falas anteriores; a atual fica só no balão.
let pendingLog: [string, string] | null = null;
function addLog(cls: string, t: string) {
  if (pendingLog) {
    const d = document.createElement('div');
    d.className = 'l ' + pendingLog[0];
    d.textContent = pendingLog[1];
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  pendingLog = [cls, t];
}

function setInputs(on: boolean) {
  input.disabled = btnNum.disabled = btnBye.disabled = !on;
  form.querySelector('button')!.disabled = !on;
  input.placeholder = on ? 'Sua vez! Escreva aqui e aperte Enter...' : 'Espere, ele está falando...';
  if (on) input.focus();
}

let resolvePlayer: ((s: string) => void) | null = null;
const waitPlayer = () => new Promise<string>((r) => { resolvePlayer = r; setInputs(true); });
const answer = (s: string) => { if (!resolvePlayer) return; const r = resolvePlayer; resolvePlayer = null; setInputs(false); r(s); };
form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value.trim(); if (v) { input.value = ''; answer(v); } });
btnNum.onclick = () => answer(ACAO_NUMERO);
btnBye.onclick = () => answer(ACAO_DISPENSAR);

// Reação da garota ao humor dele: só na abordagem, antes de ela falar qualquer coisa.
const REACAO: Partial<Record<Emocao, Emocao>> = { rindo: 'rindo', feliz: 'feliz', flertando: 'timido', confiante: 'feliz', irritado: 'surpreso', triste: 'triste', surpreso: 'surpreso', nervoso: 'feliz' };

// Leitura instantânea do tom dela, para a personagem reagir na hora; a IA refina quando responde.
function tomLocal(f: string): { emocao: Emocao; gesto: Gesto } | null {
  const s = f.toLowerCase();
  if (/k{3,}|haha|hehe|rsrs|😂|🤣|\[ri/.test(s)) return { emocao: 'rindo', gesto: 'rir' };
  if (/🙄|aff|\[revir|tá bom\.?$|ok\.?$|sei\.{2,}/.test(s)) return { emocao: 'irritado', gesto: 'ombros' };
  if (/😍|🥰|❤|😊|fofo|que lindo/.test(s)) return { emocao: 'timido', gesto: 'mao_no_peito' };
  if (/\?{2,}|como assim|sério\?|oi\?|😮|😳/.test(s)) return { emocao: 'surpreso', gesto: 'inclinar' };
  if (/😏|😉|será\?/.test(s)) return { emocao: 'flertando', gesto: 'inclinar' };
  if (/!$|amei|adoro|demais/.test(s)) return { emocao: 'feliz', gesto: 'nenhum' };
  return null;
}

const EMOJI: Record<Emocao, string> = { neutro: '🙂', feliz: '😊', rindo: '😂', nervoso: '😬', timido: '😳', confiante: '😎', flertando: '😏', irritado: '😒', triste: '😔', surpreso: '😮' };
const tomEl = $('#tom');
function mostrarTom(t?: TomDela) {
  if (!t || !t.tom || t.tom === '—') { tomEl.classList.add('hidden'); return; }
  tomEl.textContent = `${EMOJI[t.emocao] ?? '🙂'} você soou ${t.tom}`;
  tomEl.classList.remove('hidden');
  // reinicia a animação de "pop"
  tomEl.style.animation = 'none'; void tomEl.offsetWidth; tomEl.style.animation = '';
}

// ---------------- encontro ----------------

async function runEncounter(enc: Encontro, i: number, total: number) {
  const cena = SCENES[enc.cenaId as SceneId];
  world.setStage(enc.cenaId as SceneId);
  const girl = world.placeGirl(girlLook());
  girl.emocao = 'neutro';
  const man = world.spawnMan(enc.look);
  const stage = world.currentStage!;
  world.engaged = false;
  world.setShot('wide');
  world.snapCamera();

  $('#hud-scene').textContent = `${cena.horario} · ${cena.nome}`;
  $('#hud-count').textContent = `${i + 1}/${total}`;
  $('#hud').classList.remove('hidden');
  camctl.classList.remove('hidden');
  const card = $('#card');
  card.querySelector('.time')!.textContent = cena.horario;
  card.querySelector('h2')!.textContent = cena.nome;
  card.querySelector('p')!.textContent = cena.intro;
  card.classList.remove('hidden');
  log.innerHTML = '';
  mostrarTom();
  pendingLog = null;

  const walk = man.walkTo(stage.man.path.slice(1));
  await sleep(2600);
  card.classList.add('hidden');
  await walk;

  world.engaged = true;
  man.faceTowards(girl.root.position);
  if (!girl.sitting) girl.faceTowards(man.root.position);
  girl.emocao = 'surpreso';
  world.setShot('him');
  dialog.classList.remove('hidden');
  setInputs(false);

  const feito: EncontroFeito = { personaId: enc.personaId, cenaId: enc.cenaId, revelados: [], deuNumero: false, interesseFinal: 50, historico: [], look: enc.look };
  feitos.push(feito);
  const nomeDele = () => feito.nome ?? 'Desconhecido';
  let acabou = false;

  const vezDele = async () => {
    showTyping(nomeDele());
    let t: Turno | null = null;
    let motivo = 'a conexão com a IA falhou';
    for (let tentativa = 0; tentativa < 2 && !t; tentativa++) {
      try {
        t = await api<Turno>('/api/turn', { personaId: enc.personaId, cenaId: enc.cenaId, jogadora, historico: feito.historico });
      } catch (e) {
        console.warn(e);
        if (e instanceof ApiError && e.status < 500) { motivo = e.message; break; } // não adianta repetir
        await sleep(800);
      }
    }
    if (!t) {
      await showLine(nomeDele(), `(Ele parece distraído com o celular... ${motivo} Tente responder de novo.)`, false);
      return;
    }
    feito.historico.push({ de: 'ele', texto: t.fala });
    feito.interesseFinal = t.interesse;
    for (const r of t.revelou) if (!feito.revelados.includes(r)) feito.revelados.push(r);
    if (t.nome) feito.nome = t.nome;
    const elaFalou = feito.historico.some((h) => h.de === 'ela');
    if (elaFalou && t.tom_dela) {
      // a personagem dela age como a IA leu o tom, e só então ele responde
      girl.emocao = t.tom_dela.emocao;
      girl.play(t.tom_dela.gesto);
      mostrarTom(t.tom_dela);
      if (t.tom_dela.gesto !== 'nenhum') await sleep(700);
    }
    world.setShot('him');
    man.emocao = t.emocao;
    man.play(t.gesto);
    man.say(Math.min(6, 0.6 + t.fala.length * 0.045));
    if (!elaFalou) girl.emocao = REACAO[t.emocao] ?? 'neutro';
    addLog('ele', `${nomeDele()}: ${t.fala}`);
    await showLine(nomeDele(), t.fala, false);
    btnNum.classList.toggle('pulse', t.acao === 'pedir_numero');
    if (t.acao === 'ir_embora') acabou = true;
  };

  await vezDele();
  while (!acabou) {
    const fala = await waitPlayer();
    const ehAcao = fala === ACAO_NUMERO || fala === ACAO_DISPENSAR;
    feito.historico.push({ de: 'ela', texto: fala });
    btnNum.classList.remove('pulse');
    if (ehAcao) {
      if (fala === ACAO_NUMERO) feito.deuNumero = true;
      const desc = fala === ACAO_NUMERO ? 'Você anota seu número e entrega pra ele.' : 'Você diz que não está interessada.';
      addLog('acao ela', desc);
      girl.emocao = fala === ACAO_NUMERO ? 'feliz' : 'neutro';
      girl.play(fala === ACAO_NUMERO ? 'apontar' : 'ombros');
      await showLine(jogadora.nome, desc, true);
    } else {
      addLog('ela', fala);
      girl.say(Math.min(5, 0.5 + fala.length * 0.045));
      mostrarTom();
      const rapido = tomLocal(fala);
      if (rapido) { girl.emocao = rapido.emocao; girl.play(rapido.gesto); }
      world.setShot('her');
      void showLine(jogadora.nome, fala, true);
    }
    await sleep(900);
    await vezDele();
    if (ehAcao) acabou = true;
  }

  // ele vai embora
  await sleep(1800);
  setInputs(false);
  dialog.classList.add('hidden');
  world.engaged = false;
  world.setShot('wide');
  girl.lookAt = null;
  girl.emocao = feito.deuNumero ? 'feliz' : 'neutro';
  man.emocao = feito.interesseFinal > 50 ? 'feliz' : 'neutro';
  await man.walkTo(stage.man.exit);
  world.removeMan();
  await sleep(500);
}

// ---------------- escolha e final ----------------

function chooseDate(): Promise<string | null> {
  $('#hud').classList.add('hidden');
  camctl.classList.add('hidden');
  world.setStage('preview');
  const g = world.placeGirl(girlLook());
  g.emocao = 'timido';
  world.setShot('preview');
  const list = $('#choice-list');
  list.innerHTML = '';
  $('#choice').classList.remove('hidden');
  return new Promise((resolve) => {
    for (const f of feitos) {
      const cena = SCENES[f.cenaId as SceneId];
      const b = document.createElement('button');
      b.innerHTML = `${retratoImg(f)}<b>${f.nome ? esc(f.nome) : `O desconhecido ${DO_LUGAR[f.cenaId as SceneId]}`}</b><small>${f.nome ? '' : 'nunca disse o nome · '}${cena.nome} · ${cena.horario.split(', ')[1]}</small>
        <small>${f.historico.filter((h) => h.de === 'ela').length} falas suas</small>
        ${f.deuNumero ? '<span class="badge">tem seu número</span>' : ''}`;
      b.onclick = () => resolve(f.personaId);
      list.appendChild(b);
    }
    const none = document.createElement('button');
    none.className = 'none';
    none.innerHTML = '<b>Ninguém</b><small>Sábado que vem tem mais. Hoje é dia de mim.</small>';
    none.onclick = () => resolve(null);
    list.appendChild(none);
  });
}

const DO_LUGAR = Object.fromEntries(Object.entries(SCENES).map(([id, c]) => [id, c.doLugar])) as Record<SceneId, string>;

// Como a jogadora conhece cada um: pelo nome, se ele disse, ou pelo lugar.
const apelido = (personaId?: string) => {
  const f = feitos.find((x) => x.personaId === personaId);
  return f?.nome ?? `o desconhecido ${DO_LUGAR[f?.cenaId as SceneId] ?? ''}`.trim();
};

// Cor de fundo de cada lugar (a mesma do cenário) para o retrato.
const FUNDO: Record<SceneId, string> = {
  feira: '#d6ecff', cafe: '#f6e7cf', lavanderia: '#e3f4f1', livraria: '#efe0c6', praia: '#bfe6ff',
  parque: '#cdebff', museu: '#efe9df', academia: '#e6e9ee', metro: '#20232b', rooftop: '#1b2045',
};
const retratos = new Map<string, string>();

function retratoImg(f: EncontroFeito, cls = 'portrait') {
  if (!f.look) return '';
  let url = retratos.get(f.personaId);
  if (!url) {
    url = portrait(f.look, f.interesseFinal > 55 ? 'feliz' : 'neutro', FUNDO[f.cenaId as SceneId] ?? '#ffffff');
    retratos.set(f.personaId, url);
  }
  return `<img class="${cls}" src="${url}" alt="">`;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

async function showEnding(escolhidoId: string | null) {
  $('#choice').classList.add('hidden');
  const body = $('#ending-body');
  body.innerHTML = '<h2>Escrevendo o que aconteceu...</h2><p class="tag">O narrador está pensando.</p>';
  $('#ending').classList.remove('hidden');
  world.placeGirl(girlLook());
  let f: Final;
  try {
    f = await api<Final>('/api/ending', { escolhidoId, jogadora, encontros: feitos });
  } catch (e) {
    body.innerHTML = `<h2>Ops</h2><p>Não deu pra gerar o final: ${esc(String(e))}</p>`;
    return;
  }
  const best = f.revelacoes.find((r) => r.personaId === f.melhorId);
  const notaTxt = f.notaEscolha === null ? '—' : `${f.notaEscolha}/10`;
  const veredito = f.notaEscolha === null ? 'Você escolheu você.'
    : f.melhorId === escolhidoId ? 'Melhor escolha possível!'
    : `O de mais valor era ${apelido(best?.personaId)} (${best?.valor}/10).`;

  body.innerHTML = `
    <h2>${esc(f.titulo)}</h2>
    <div class="epilogo">${f.epilogo.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="scores">
      <div class="score"><small>Leitura de pessoas</small><b>${f.leitura}%</b><small>dos traços escondidos que vieram à tona</small></div>
      <div class="score"><small>Valor de quem você escolheu</small><b>${notaTxt}</b><small>${esc(veredito)}</small></div>
    </div>
    <h3>Quem eles eram de verdade</h3>
    ${f.revelacoes.map((r) => {
      const feito = feitos.find((x) => x.personaId === r.personaId);
      const desconhecido = !feito?.nome;
      const titulo = desconhecido ? `O desconhecido ${DO_LUGAR[feito?.cenaId as SceneId] ?? ''}` : `${r.nome}, ${r.idade}`;
      const cena = feito && SCENES[feito.cenaId as SceneId];
      const abertura = feito?.historico.find((h) => h.de === 'ele')?.texto;
      return `
      <div class="reveal">
        <div class="reveal-head">
          ${feito ? retratoImg(feito, 'portrait big') : ''}
          <div>
            <h3><span>${esc(titulo)} ${r.personaId === escolhidoId ? '<span class="chosen">sua escolha</span>' : ''}</span><span class="valor">${r.valor}/10</span></h3>
            ${cena ? `<div class="onde">📍 ${esc(cena.nome)} · ${esc(cena.horario)}${feito?.deuNumero ? ' · <span class="badge">deu seu número</span>' : ''}</div>` : ''}
            ${abertura ? `<div class="abertura">Chegou dizendo: “${esc(abertura)}”</div>` : ''}
          </div>
        </div>
        <small>${desconhecido ? `Ele nunca te disse, mas era ${esc(r.nome)}, ${r.idade} · ` : ''}${esc(r.profissao)}</small>
        <div class="meter"><i style="width:${r.valor * 10}%"></i></div>
        <p>${esc(r.verdade)}</p>
        <ul>${r.traits.map((t) => `<li class="${t.percebido ? '' : 'miss'}">${t.percebido ? '👁️' : '🙈'} <span class="${t.tipo === 'qualidade' ? 't-q' : 't-r'}">${t.tipo === 'qualidade' ? '✦' : '⚑'} ${esc(t.descricao)}</span>${t.percebido ? '' : ' <small>(não apareceu na conversa)</small>'}</li>`).join('')}</ul>
      </div>`;
    }).join('')}`;
}

// ---------------- fluxo ----------------

$('#start').onclick = async () => {
  const btn = $<HTMLButtonElement>('#start');
  btn.disabled = true;
  $('#start-err').textContent = '';
  const falha = (msg: string) => { $('#start-err').textContent = msg; btn.disabled = false; };
  const k = lerChave();
  if (k === null) return falha('Essa chave não parece uma chave da OpenAI (começa com sk-).');
  if (!k && precisaChave) return falha('Coloque sua chave da OpenAI para jogar.');
  chave = k;
  jogadora = { nome: $<HTMLInputElement>('#f-nome').value.trim() || 'Bia', descricao: girlDescricao() };
  let encontros: Encontro[];
  try {
    if (chave) {
      btn.textContent = 'Conferindo sua chave...';
      await api('/api/check-key', {}).finally(() => { btn.textContent = 'Começar o sábado →'; });
    }
    encontros = (await api<{ encontros: Encontro[] }>('/api/run', {})).encontros;
  } catch (e) {
    return falha(e instanceof ApiError ? e.message : 'Servidor fora do ar. Rode "npm run dev".');
  }
  $('#title').classList.add('hidden');
  feitos = [];
  for (let i = 0; i < encontros.length; i++) await runEncounter(encontros[i], i, encontros.length);
  await showEnding(await chooseDate());
};

$('#again').onclick = () => location.reload();
