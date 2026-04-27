import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

try {
  (yahooFinance as unknown as { suppressNotices?: (n: string[]) => void })
    .suppressNotices?.(["yahooSurvey", "ripHistorical"]);
} catch {
  // ignore
}

export async function fetchCandles(symbol: string, days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const result = await yahooFinance.chart(symbol, {
    period1: from,
    period2: to,
    interval: "1d",
  });

  const quotes = result?.quotes ?? [];
  const candles = quotes
    .filter(
      (q) =>
        q.open != null &&
        q.high != null &&
        q.low != null &&
        q.close != null,
    )
    .map((q) => ({
      t: Math.floor(new Date(q.date).getTime() / 1000),
      o: Number(q.open),
      h: Number(q.high),
      l: Number(q.low),
      c: Number(q.close),
      v: Number(q.volume ?? 0),
    }));

  return { symbol: symbol.toUpperCase(), candles };
}
