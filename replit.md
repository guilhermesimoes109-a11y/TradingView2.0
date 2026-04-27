# AnalisCX

Plataforma de análise de ações em português (pt-PT) com dados de mercado em tempo real e assistente de IA.

## Arquitetura

Monorepo pnpm com três artefactos:

- **artifacts/analiscx** (`/`) — Aplicação web React + Vite. Páginas:
  - `/` — Hero com market movers ao vivo e grelha de funcionalidades.
  - `/analise` — Pesquisa com sugestões, gráficos OHLC/linha (recharts), métricas, notícias e painel "Assistente AnalisCX". Suporta `?ticker=XXX`.
  - `/etfs` — Grelha curada de 16 ETFs com cotações em direto.
  - `/favoritos` — Lista de ativos marcados pelo utilizador (guardada em `localStorage`).
- **artifacts/api-server** (`/api`) — Servidor Express (TypeScript) que expõe endpoints REST validados por Zod.
- **artifacts/mockup-sandbox** — Servidor Vite para previsualizações de componentes na canvas.

## Fontes de dados

- **Finnhub** (chave em `FINNHUB_API_KEY`): cotações, perfis de empresa (incluindo logos reais), métricas, pesquisa de tickers, notícias.
- **Yahoo Finance** (`yahoo-finance2`): velas históricas (OHLC) — porque `/stock/candle` do Finnhub é premium.

## API (`/api/stocks/*`)

| Endpoint | Origem |
| --- | --- |
| `GET /quote/:symbol` | Finnhub |
| `GET /profile/:symbol` | Finnhub |
| `GET /metrics/:symbol` | Finnhub |
| `GET /candles/:symbol?days=N` | Yahoo Finance |
| `GET /search?q=...` | Finnhub |
| `GET /news/:symbol?limit=N` | Finnhub |
| `GET /movers` | Finnhub (lista curada: AAPL, MSFT, NVDA, TSLA, GOOGL, AMZN, META, AMD) |

Spec OpenAPI em `lib/api-spec/openapi.yaml`. Schemas Zod gerados em `@workspace/api-zod`. Hooks React Query em `@workspace/api-client-react`.

## UI

- **Idioma**: português (pt-PT)
- **Tema**: escuro por defeito
- **Ícones**: `lucide-react` (sem emojis)
- **Logos**: reais via `profile.logo` (CDN do Finnhub)
- **Animações**: `framer-motion`
- **Gráficos**: `recharts`
