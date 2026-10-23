# Abordagens

Simulador 3D (toon com contorno preto) de um sábado comum: cinco lugares, cinco homens se aproximando, conversa em texto livre com personalidades interpretadas pela LLM (`gpt-5.6-luna`). No fim você escolhe com quem sair e descobre quem cada um era de verdade.

## Rodar

```bash
npm install
npm run dev        # API em :8787 + Vite em :5173
```

Abra http://localhost:5173. O `.env` precisa de `OPENAI_API_KEY` e `OPENAI_MODEL`.

## Onde mexer

- `server/personas.ts`: os homens (personalidade, verdade escondida, traços que vazam, valor 0–10)
- `server/prompts.ts`: prompt do ator, schema JSON da resposta e prompt do epílogo
- `shared/scenes.ts`: os cenários (texto que a LLM recebe)
- `src/scene/environments.ts`: os cenários em 3D
- `src/scene/character.ts`, `face.ts`: personagens procedurais, gestos e expressões
- `src/main.ts`: fluxo do jogo e interface

## Publicar

Um serviço Node só (Render, Railway, Fly.io...) entrega o front e a API:

- Build: `npm install --include=dev && npm run build` (o `--include=dev` traz o Vite e o tsx mesmo com `NODE_ENV=production`)
- Start: `npm start`
- Variáveis: `NODE_ENV=production`, `OPENAI_MODEL=gpt-5.6-luna` e, se quiser bancar a IA para os jogadores, `OPENAI_API_KEY`

### Chave da OpenAI

- O jogador pode colocar a própria chave na tela inicial. Ela fica só no navegador (ou no `localStorage`, se ele marcar "lembrar"), vai no header `X-OpenAI-Key` e o servidor só a repassa para a OpenAI: não salva nem loga.
- Sem `OPENAI_API_KEY` no servidor (ou com `ALLOW_SERVER_KEY=false`), a chave do jogador passa a ser obrigatória.

### Proteções do backend (`server/guard.ts`)

| Variável | Padrão | O que faz |
| --- | --- | --- |
| `RATE_SERVER_KEY` | 120 | chamadas por IP por hora usando a chave do servidor |
| `RATE_USER_KEY` | 400 | chamadas por IP por hora com a chave do jogador |
| `DAILY_LIMIT` | 1500 | teto diário de chamadas com a chave do servidor (somando todos) |
| `ALLOWED_ORIGINS` | vazio | outros domínios autorizados a chamar a API (só se o front ficar separado) |
| `TRUST_PROXY` | 1 em produção | quantos proxies confiar para descobrir o IP real |

Além disso:
- a API só aceita chamadas do próprio site;
- o servidor manda headers de segurança (CSP, sem iframe);
- a entrada é validada e limitada;
- os erros não vazam detalhes internos.

Configure também um limite de gasto no painel da OpenAI: é a única trava que vale mesmo se alguém burlar tudo.

### Front e back separados (opcional)

Front estático (Vercel, Netlify, Cloudflare Pages, GitHub Pages) com `VITE_API_URL=https://seu-backend` no build, e no backend `ALLOWED_ORIGINS=https://seu-front`.
