import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { PERSONAS, personaById } from './personas';
import { actorSchema, actorSystem, epilogoPrompt, epilogoSchema, momentoAtual, type Jogadora } from './prompts';
import { chaveDoJogador, limiteDeUso, originGuard, securityHeaders } from './guard';
import { RUN_SIZE, SCENES, SCENE_ORDER, type SceneId } from '../shared/scenes';
import type { Encontro, EncontroFeito, Fala, Final, Turno } from '../shared/types';

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
// ALLOW_SERVER_KEY=false faz o jogo exigir a chave de cada jogador, mesmo havendo uma no servidor.
const CHAVE_SERVIDOR = process.env.ALLOW_SERVER_KEY === 'false' ? '' : process.env.OPENAI_API_KEY || '';
const servidor = CHAVE_SERVIDOR ? new OpenAI({ apiKey: CHAVE_SERVIDOR }) : null;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? 1 : 0)));
app.use(securityHeaders);
app.use('/api', originGuard, express.json({ limit: '256kb' }));

class ErroDoJogo extends Error {
  constructor(readonly status: number, msg: string, readonly extra: object = {}) { super(msg); }
}

/** Escolhe a chave da chamada: a do jogador, se mandou; senão a do servidor (com limites). */
function clienteDa(req: Request): OpenAI {
  const propria = chaveDoJogador(req);
  if (propria === 'invalida') throw new ErroDoJogo(400, 'Essa chave não parece uma chave da OpenAI (começa com sk-).', { chave: 'invalida' });
  if (!propria && !servidor) throw new ErroDoJogo(401, 'Para jogar, coloque sua chave da OpenAI na tela inicial.', { precisaChave: true });
  const limite = limiteDeUso(req.ip ?? '?', !propria);
  if (limite) throw new ErroDoJogo(429, limite, { precisaChave: !propria });
  return propria ? new OpenAI({ apiKey: propria, maxRetries: 0 }) : servidor!;
}

async function gerarJSON<T>(ai: OpenAI, input: OpenAI.Responses.ResponseInput, nome: string, schema: object): Promise<T> {
  const r = await ai.responses.create({
    model: MODEL,
    input,
    reasoning: { effort: 'low' },
    max_output_tokens: 2000,
    text: { format: { type: 'json_schema', name: nome, strict: true, schema: schema as Record<string, unknown> } },
  });
  return JSON.parse(r.output_text) as T;
}

/** Nunca loga a chave (nem mascarada, como a OpenAI faz nas mensagens) nem o texto de erro de chaves de jogadores. */
function logar(onde: string, e: any, propria: boolean) {
  if (e instanceof ErroDoJogo) return;
  const status = Number(e?.status) || 0;
  console.error(`[${onde}] ${status || 'erro'}${propria ? ' (chave do jogador)' : ` ${String(e?.message ?? '').replace(/sk-[\w*-]+/g, 'sk-***').slice(0, 200)}`}`);
}

/** Responde o erro sem detalhes internos. */
function falhou(res: Response, onde: string, e: any, propria: boolean) {
  logar(onde, e, propria);
  if (e instanceof ErroDoJogo) return res.status(e.status).json({ erro: e.message, ...e.extra });
  const status = Number(e?.status) || 0;
  if (status === 401) return res.status(401).json({ erro: propria ? 'A OpenAI recusou sua chave. Confira se ela está certa e ativa.' : 'O jogo está sem acesso à IA agora.', chave: propria ? 'recusada' : undefined, precisaChave: !propria });
  if (status === 429) return res.status(429).json({ erro: propria ? 'Sua chave estourou o limite ou ficou sem crédito na OpenAI.' : 'A IA do jogo está sobrecarregada. Tente de novo em instantes.' });
  if (status === 404) return res.status(502).json({ erro: `Essa chave não tem acesso ao modelo ${MODEL}.` });
  return res.status(502).json({ erro: 'A IA não respondeu. Tente de novo.' });
}

const temChave = (req: Request) => !!req.get('x-openai-key');
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const shuffle =<T>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

function limparJogadora(j: any): Jogadora {
  return {
    nome: String(j?.nome || 'ela').slice(0, 30),
    descricao: String(j?.descricao || 'uma mulher bonita').slice(0, 200),
  };
}

function limparHistorico(h: any): Fala[] {
  if (!Array.isArray(h)) return [];
  return h.slice(-40).map((f) => ({ de: f?.de === 'ele' ? 'ele' : 'ela', texto: String(f?.texto ?? '').slice(0, 500) }));
}

// O front pergunta se precisa pedir a chave do jogador.
app.get('/api/config', (_req, res) => res.json({ precisaChave: !servidor, modelo: MODEL }));

// Confere a chave do jogador antes da partida (consultar o modelo não gasta crédito).
app.post('/api/check-key', async (req, res) => {
  if (!temChave(req)) return res.json({ ok: !!servidor });
  try {
    await clienteDa(req).models.retrieve(MODEL);
    res.json({ ok: true });
  } catch (e) {
    falhou(res, 'check-key', e, true);
  }
});

// Sorteia RUN_SIZE lugares (na ordem do dia) e um homem por lugar, preferindo quem combina com ele.
app.post('/api/run', (_req, res) => {
  const livres = shuffle(PERSONAS);
  const sorteadas = new Set(shuffle(SCENE_ORDER).slice(0, RUN_SIZE));
  const encontros: Encontro[] = SCENE_ORDER.filter((c) => sorteadas.has(c)).map((cenaId) => {
    const i = Math.max(0, livres.findIndex((p) => p.cenasFavoritas.includes(cenaId)));
    const [p] = livres.splice(i, 1);
    return { personaId: p.id, cenaId, look: p.look };
  });
  res.json({ encontros });
});

app.post('/api/turn', async (req, res) => {
  const p = personaById(String(req.body?.personaId));
  const cena = String(req.body?.cenaId) as SceneId;
  if (!p || !Object.hasOwn(SCENES, cena)) return res.status(400).json({ erro: 'persona ou cena inválida' });
  const ela = limparJogadora(req.body?.jogadora);
  const historico = limparHistorico(req.body?.historico);

  const input: OpenAI.Responses.ResponseInput = [
    { role: 'system', content: actorSystem(p, cena, ela) },
    ...historico.map((f) => ({ role: f.de === 'ela' ? ('user' as const) : ('assistant' as const), content: f.texto })),
    { role: 'developer', content: momentoAtual(p, historico) },
  ];

  try {
    const t = await gerarJSON<Turno>(clienteDa(req), input, 'turno', actorSchema(p));
    t.interesse = Math.max(0, Math.min(100, Math.round(t.interesse)));
    // Só revela o nome se ele realmente aparece na fala (não confia só na marcação do modelo).
    const primeiro = p.nome.split(' ')[0];
    t.disse_nome = new RegExp(`\\b${semAcento(primeiro)}\\b`, 'i').test(semAcento(t.fala));
    if (t.disse_nome) t.nome = primeiro;
    res.json(t);
  } catch (e) {
    falhou(res, 'turn', e, temChave(req));
  }
});

app.post('/api/ending', async (req, res) => {
  const ela = limparJogadora(req.body?.jogadora);
  const encontros: EncontroFeito[] = Array.isArray(req.body?.encontros) ? req.body.encontros.slice(0, RUN_SIZE) : [];
  const conhecidos = encontros.map((e) => ({ e, p: personaById(String(e?.personaId))! })).filter((x) => x.p);

  let total = 0, percebidos = 0;
  const revelacoes = conhecidos.map(({ e, p }) => {
    const rev = new Set(Array.isArray(e.revelados) ? e.revelados.map(String) : []);
    total += p.traits.length;
    percebidos += p.traits.filter((t) => rev.has(t.id)).length;
    return {
      personaId: p.id, nome: p.nome, idade: p.idade, profissao: p.profissao, valor: p.valor, verdade: p.verdade,
      traits: p.traits.map((t) => ({ descricao: t.descricao, tipo: t.tipo, percebido: rev.has(t.id) })),
    };
  });
  const melhor = [...conhecidos].sort((a, b) => b.p.valor - a.p.valor)[0];
  const escolhido = conhecidos.find((x) => x.p.id === req.body?.escolhidoId);

  const final: Final = {
    titulo: 'Escolhendo a si mesma',
    epilogo: 'Você decidiu não sair com ninguém. Foi para casa, tomou um banho demorado e dormiu cedo, com a sensação boa de quem não precisa provar nada a ninguém. Amanhã é outro dia, e outras histórias.',
    revelacoes,
    leitura: total ? Math.round((percebidos / total) * 100) : 0,
    notaEscolha: escolhido ? escolhido.p.valor : null,
    melhorId: melhor?.p.id ?? null,
  };

  if (escolhido) {
    const nome = typeof escolhido.e.nome === 'string' ? escolhido.e.nome.slice(0, 30) : '';
    try {
      const h = limparHistorico(escolhido.e.historico);
      const r = await gerarJSON<{ titulo: string; epilogo: string }>(
        clienteDa(req),
        [{ role: 'user', content: epilogoPrompt(escolhido.p, ela, h, !!escolhido.e.deuNumero, Number(escolhido.e.interesseFinal) || 0, !!nome) }],
        'epilogo', epilogoSchema,
      );
      Object.assign(final, r);
    } catch (e) {
      // o final sai mesmo sem o epílogo: as revelações não dependem da IA
      logar('ending', e, temChave(req));
      final.titulo = nome ? `Um encontro com ${nome}` : 'Um encontro com o desconhecido';
      final.epilogo = 'O encontro aconteceu... mas o narrador perdeu as anotações. Veja abaixo quem ele realmente era.';
    }
  }
  res.json(final);
});

app.use('/api', (_req, res) => res.status(404).json({ erro: 'não encontrado' }));

// Em produção o próprio servidor entrega o front (pasta dist, gerada por "npm run build").
const DIST = fileURLToPath(new URL('../dist', import.meta.url));
if (existsSync(DIST)) {
  app.use(express.static(DIST, { index: 'index.html', maxAge: '1h' }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile('index.html', { root: DIST }));
}

const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => console.log(`API em http://localhost:${PORT} usando ${MODEL} (${servidor ? 'com chave do servidor' : 'só chave do jogador'})`));
