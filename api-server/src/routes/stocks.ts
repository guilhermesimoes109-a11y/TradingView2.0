import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import {
  GetStockQuoteParams,
  GetStockQuoteResponse,
  GetStockProfileParams,
  GetStockProfileResponse,
  GetStockMetricsParams,
  GetStockMetricsResponse,
  GetStockCandlesParams,
  GetStockCandlesQueryParams,
  GetStockCandlesResponse,
  SearchStocksQueryParams,
  SearchStocksResponse,
  GetStockNewsParams,
  GetStockNewsQueryParams,
  GetStockNewsResponse,
  GetMarketMoversResponse,
  GetEtfsResponse,
} from "@workspace/api-zod";
import {
  FinnhubError,
  fetchQuote,
  fetchProfile,
  fetchMetrics,
  fetchSearch,
  fetchNews,
} from "../lib/finnhub";
import { fetchCandles } from "../lib/candles";

const router: IRouter = Router();

const POPULAR: Array<{ symbol: string; name: string }> = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com, Inc." },
  { symbol: "META", name: "Meta Platforms, Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
];

const ETFS: Array<{ symbol: string; name: string }> = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF" },
  { symbol: "EEM", name: "iShares MSCI Emerging Markets ETF" },
  { symbol: "VEA", name: "Vanguard FTSE Developed Markets ETF" },
  { symbol: "GLD", name: "SPDR Gold Shares" },
  { symbol: "SLV", name: "iShares Silver Trust" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF" },
  { symbol: "ARKK", name: "ARK Innovation ETF" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund" },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund" },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund" },
  { symbol: "VNQ", name: "Vanguard Real Estate ETF" },
];

async function fetchListWithQuotes(list: Array<{ symbol: string; name: string }>) {
  const settled = await Promise.allSettled(
    list.map(async (p) => {
      const [quote, profile] = await Promise.all([
        fetchQuote(p.symbol).catch(() => null),
        fetchProfile(p.symbol).catch(() => null),
      ]);
      if (!quote) return null;
      const profileName = profile?.name?.trim();
      const useProfileName =
        profileName && profileName.toUpperCase() !== p.symbol.toUpperCase();
      return {
        symbol: p.symbol,
        name: useProfileName ? profileName : p.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        logo: profile?.logo ?? null,
      };
    }),
  );
  return settled
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Quote
router.get(
  "/quote/:symbol",
  asyncHandler(async (req, res) => {
    const { symbol } = GetStockQuoteParams.parse(req.params);
    try {
      const data = await fetchQuote(symbol);
      const validated = GetStockQuoteResponse.parse(data);
      res.json(validated);
    } catch (err) {
      if (err instanceof FinnhubError && err.status === 404) {
        res.status(404).json({ message: `Sem cotação para ${symbol}` });
        return;
      }
      throw err;
    }
  }),
);

// Profile
router.get(
  "/profile/:symbol",
  asyncHandler(async (req, res) => {
    const { symbol } = GetStockProfileParams.parse(req.params);
    const data = await fetchProfile(symbol);
    const validated = GetStockProfileResponse.parse(data);
    res.json(validated);
  }),
);

// Metrics
router.get(
  "/metrics/:symbol",
  asyncHandler(async (req, res) => {
    const { symbol } = GetStockMetricsParams.parse(req.params);
    try {
      const data = await fetchMetrics(symbol);
      const validated = GetStockMetricsResponse.parse(data);
      res.json(validated);
    } catch (err) {
      if (err instanceof FinnhubError) {
        // Free tier sometimes returns 403 for unknown symbols
        const empty = GetStockMetricsResponse.parse({
          symbol: symbol.toUpperCase(),
        });
        res.json(empty);
        return;
      }
      throw err;
    }
  }),
);

// Candles
router.get(
  "/candles/:symbol",
  asyncHandler(async (req, res) => {
    const { symbol } = GetStockCandlesParams.parse(req.params);
    const { days = 30 } = GetStockCandlesQueryParams.parse(req.query);
    const data = await fetchCandles(symbol, days);
    const validated = GetStockCandlesResponse.parse(data);
    res.json(validated);
  }),
);

// Search
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const { q } = SearchStocksQueryParams.parse(req.query);
    const data = await fetchSearch(q);
    const validated = SearchStocksResponse.parse(data);
    res.json(validated);
  }),
);

// News
router.get(
  "/news/:symbol",
  asyncHandler(async (req, res) => {
    const { symbol } = GetStockNewsParams.parse(req.params);
    const { limit = 8 } = GetStockNewsQueryParams.parse(req.query);
    try {
      const data = await fetchNews(symbol, limit);
      const validated = GetStockNewsResponse.parse(data);
      res.json(validated);
    } catch (err) {
      if (err instanceof FinnhubError) {
        res.json(GetStockNewsResponse.parse({ items: [] }));
        return;
      }
      throw err;
    }
  }),
);

// Movers (homepage)
router.get(
  "/movers",
  asyncHandler(async (_req, res) => {
    const movers = await fetchListWithQuotes(POPULAR);
    const validated = GetMarketMoversResponse.parse({ movers });
    res.json(validated);
  }),
);

// ETFs
router.get(
  "/etfs",
  asyncHandler(async (_req, res) => {
    const movers = await fetchListWithQuotes(ETFS);
    const validated = GetEtfsResponse.parse({ movers });
    res.json(validated);
  }),
);

export default router;
