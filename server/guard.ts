import type { NextFunction, Request, Response } from 'express';

// Proteções do backend: ninguém além do próprio jogo deve conseguir usar a API,
// e a chave do servidor (se houver) tem teto de uso por IP e por dia.

const PROD = process.env.NODE_ENV === 'production';
const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

/** Origens extras autorizadas (front hospedado em outro domínio), separadas por vírgula. */
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

export const LIMITES = {
  // chamadas por IP por hora: uma partida inteira usa ~40 a 70
  servidorPorHora: num(process.env.RATE_SERVER_KEY, 120),
  propriaPorHora: num(process.env.RATE_USER_KEY, 400),
  // teto de chamadas por dia usando a chave do servidor, somando todo mundo
  servidorPorDia: num(process.env.DAILY_LIMIT, 1500),
};

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '));
  if (PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

const origemDe = (req: Request) => {
  const o = req.get('origin');
  if (o) return o.replace(/\/$/, '');
  const ref = req.get('referer');
  try { return ref ? new URL(ref).origin : null; } catch { return null; }
};

/** Só aceita chamadas vindas do próprio jogo (mesmo host) ou de uma origem em ALLOWED_ORIGINS. */
export function originGuard(req: Request, res: Response, next: NextFunction) {
  const origem = origemDe(req);
  const propria = `${req.protocol}://${req.get('host')}`;
  const externa = !!origem && ALLOWED.includes(origem);

  if (externa) {
    res.setHeader('Access-Control-Allow-Origin', origem!);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-OpenAI-Key');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(externa ? 204 : 403);

  // GET não chama a IA; navegadores nem mandam Origin em GET do próprio site
  const mesmoSite = req.get('sec-fetch-site') === 'same-origin' || (req.method === 'GET' && !origem);
  const ok = origem === propria || externa || mesmoSite || (!PROD && (!origem || /^https?:\/\/localhost(:\d+)?$/.test(origem)));
  if (!ok) return res.status(403).json({ erro: 'Origem não autorizada' });
  next();
}

/** Lê a chave do jogador (opcional). Formato inválido vira erro, para não cair na chave do servidor sem querer. */
export function chaveDoJogador(req: Request): string | null | 'invalida' {
  const k = req.get('x-openai-key')?.trim();
  if (!k) return null;
  return /^sk-[A-Za-z0-9_-]{20,300}$/.test(k) ? k : 'invalida';
}

// ---------- limites de uso (em memória; suficiente para uma instância) ----------

const janelas = new Map<string, { n: number; ate: number }>();
let dia = { data: '', n: 0 };
setInterval(() => {
  const agora = Date.now();
  for (const [k, v] of janelas) if (v.ate < agora) janelas.delete(k);
}, 10 * 60_000).unref();

function conta(chave: string, max: number, janelaMs: number) {
  const agora = Date.now();
  const j = janelas.get(chave);
  if (!j || j.ate < agora) { janelas.set(chave, { n: 1, ate: agora + janelaMs }); return true; }
  if (j.n >= max) return false;
  j.n++;
  return true;
}

/** Retorna uma mensagem de erro se o limite estourou, ou null se pode seguir. */
export function limiteDeUso(ip: string, usaChaveDoServidor: boolean): string | null {
  const max = usaChaveDoServidor ? LIMITES.servidorPorHora : LIMITES.propriaPorHora;
  if (!conta(`${usaChaveDoServidor ? 's' : 'p'}:${ip}`, max, 3600_000)) {
    return 'Muitas conversas em pouco tempo. Respira, toma uma água e volta daqui a pouco.';
  }
  if (usaChaveDoServidor) {
    const hoje = new Date().toISOString().slice(0, 10);
    if (dia.data !== hoje) dia = { data: hoje, n: 0 };
    if (dia.n >= LIMITES.servidorPorDia) return 'O jogo atingiu o limite de hoje. Use sua própria chave da OpenAI para continuar.';
    dia.n++;
  }
  return null;
}
