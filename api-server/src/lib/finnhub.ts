import { logger } from "./logger";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function getApiKey(): string {
  const key = process.env["FINNHUB_API_KEY"];
  if (!key) {
    throw new Error("FINNHUB_API_KEY is not configured");
  }
  return key;
}

export class FinnhubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FinnhubError";
  }
}

async function finnhubFetch<T>(
  pathname: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(`${FINNHUB_BASE}${pathname}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  url.searchParams.set("token", getApiKey());

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.warn(
      { pathname, status: res.status, body: text.slice(0, 200) },
      "Finnhub request failed",
    );
    throw new FinnhubError(
      `Finnhub ${pathname} returned ${res.status}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

// ── Quote ─────────────────────────────────────────────────────
interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // % change
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
  t: number; // unix s
}

export async function fetchQuote(symbol: string) {
  const q = await finnhubFetch<FinnhubQuote>("/quote", { symbol });
  if (!q || q.c === 0) {
    throw new FinnhubError(`No quote for symbol ${symbol}`, 404);
  }
  return {
    symbol: symbol.toUpperCase(),
    price: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
    high: q.h,
    low: q.l,
    open: q.o,
    previousClose: q.pc,
    timestamp: q.t,
  };
}

// ── Profile ───────────────────────────────────────────────────
interface FinnhubProfile {
  country?: string;
  currency?: string;
  exchange?: string;
  ipo?: string;
  marketCapitalization?: number;
  name?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
  logo?: string;
  finnhubIndustry?: string;
}

export async function fetchProfile(symbol: string) {
  const p = await finnhubFetch<FinnhubProfile>("/stock/profile2", { symbol });
  if (!p || !p.name) {
    // Free-tier fallback for symbols not in profile2
    return {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      country: null,
      currency: null,
      exchange: null,
      industry: null,
      logo: null,
      weburl: null,
      marketCap: null,
      shareOutstanding: null,
      ipo: null,
    };
  }
  return {
    symbol: symbol.toUpperCase(),
    name: p.name,
    country: p.country ?? null,
    currency: p.currency ?? null,
    exchange: p.exchange ?? null,
    industry: p.finnhubIndustry ?? null,
    logo: p.logo ?? null,
    weburl: p.weburl ?? null,
    marketCap: p.marketCapitalization ?? null,
    shareOutstanding: p.shareOutstanding ?? null,
    ipo: p.ipo ?? null,
  };
}

// ── Metrics ───────────────────────────────────────────────────
interface FinnhubMetricResponse {
  metric?: Record<string, number | undefined>;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

export async function fetchMetrics(symbol: string) {
  const r = await finnhubFetch<FinnhubMetricResponse>("/stock/metric", {
    symbol,
    metric: "all",
  });
  const m = r.metric ?? {};
  return {
    symbol: symbol.toUpperCase(),
    peRatio: num(m["peTTM"]) ?? num(m["peNormalizedAnnual"]),
    epsTTM: num(m["epsTTM"]),
    dividendPerShareTTM: num(m["dividendPerShareTTM"]),
    dividendYieldTTM: num(m["dividendYieldIndicatedAnnual"]),
    weekHigh52: num(m["52WeekHigh"]),
    weekLow52: num(m["52WeekLow"]),
    beta: num(m["beta"]),
    priceToBook: num(m["pbAnnual"]),
    roeTTM: num(m["roeTTM"]),
    volume10Day: num(m["10DayAverageTradingVolume"]),
  };
}

// ── Search ────────────────────────────────────────────────────
interface FinnhubSearchResponse {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export async function fetchSearch(q: string) {
  const r = await finnhubFetch<FinnhubSearchResponse>("/search", { q });
  const results = (r.result ?? [])
    .filter((x) => x.type === "Common Stock" || x.type === "")
    .filter((x) => !x.symbol.includes(".") && !x.symbol.includes(":"))
    .slice(0, 12)
    .map((x) => ({
      symbol: x.symbol,
      description: x.description,
      type: x.type || null,
    }));
  return { results };
}

// ── News ──────────────────────────────────────────────────────
interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchNews(symbol: string, limit: number) {
  const to = new Date();
  const from = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000);
  const arr = await finnhubFetch<FinnhubNews[]>("/company-news", {
    symbol,
    from: ymd(from),
    to: ymd(to),
  });
  const items = (arr ?? [])
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, limit)
    .map((n) => ({
      id: n.id,
      headline: n.headline,
      summary: n.summary,
      source: n.source,
      url: n.url,
      image: n.image || null,
      datetime: n.datetime,
    }));
  return { items };
}
