import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useFavorites } from "@/lib/use-favorites";
import { 
  useGetStockQuote, 
  useGetStockProfile, 
  useGetStockMetrics, 
  useGetMarketMovers,
  useGetStockCandles, 
  useGetStockNews,
  useSearchStocks 
} from "@workspace/api-client-react";
import { 
  Search, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  Bot,
  LineChart,
  BarChart3,
  TrendingUp,
  Sparkles,
  Building2,
  Star
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Typewriter Hook
function useTypewriter(text: string, active: boolean, speed = 16) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active || !text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return displayed;
}

const POPULAR_TICKERS = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "AMD"];

function getTickerFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("ticker");
    return t ? t.toUpperCase() : null;
  } catch {
    return null;
  }
}

export default function AnalysisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(() => getTickerFromQuery() ?? "AAPL");
  const { isFavorite, toggleFavorite } = useFavorites();
  const [days, setDays] = useState(30);
  const [chartMode, setChartMode] = useState<"line" | "candle">("candle");

  // API Hooks
  const { data: quote, isLoading: quoteLoading, error: quoteError } = useGetStockQuote(selectedTicker, {
    query: { enabled: !!selectedTicker, queryKey: ["/api/stocks/quote", selectedTicker] }
  });
  
  const { data: profile, isLoading: profileLoading } = useGetStockProfile(selectedTicker, {
    query: { enabled: !!selectedTicker, queryKey: ["/api/stocks/profile", selectedTicker] }
  });

  const { data: metrics, isLoading: metricsLoading } = useGetStockMetrics(selectedTicker, {
    query: { enabled: !!selectedTicker, queryKey: ["/api/stocks/metrics", selectedTicker] }
  });

  const { data: candlesData, isLoading: candlesLoading } = useGetStockCandles(selectedTicker, { days }, {
    query: { enabled: !!selectedTicker, queryKey: ["/api/stocks/candles", selectedTicker, { days }] }
  });

  const { data: newsData, isLoading: newsLoading } = useGetStockNews(selectedTicker, { limit: 5 }, {
    query: { enabled: !!selectedTicker, queryKey: ["/api/stocks/news", selectedTicker, { limit: 5 }] }
  });

  const { data: searchResults, isFetching: searchFetching } = useSearchStocks({ q: searchQuery }, {
    query: { enabled: searchQuery.length > 1, queryKey: ["/api/stocks/search", { q: searchQuery }] }
  });

  const { data: moversData } = useGetMarketMovers({
    query: { queryKey: ["/api/stocks/movers"], staleTime: 60_000 }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedTicker(searchQuery.trim().toUpperCase());
      setSearchQuery("");
    }
  };

  // Synthesize AI details
  const isUp = quote && quote.change >= 0;
  const recommendation = isUp ? "COMPRA" : (quote && quote.changePercent < -2 ? "VENDA" : "MANTER");
  
  let synthesizedForecast = "";
  if (quote && metrics) {
    synthesizedForecast = `A análise de ${selectedTicker} indica uma tendência ${isUp ? 'de alta' : 'de baixa'} no curto prazo. Com um P/E de ${metrics.peRatio?.toFixed(2) || 'N/A'} e um Beta de ${metrics.beta?.toFixed(2) || 'N/A'}, o ativo apresenta ${metrics.beta && metrics.beta > 1.2 ? 'alta volatilidade' : 'volatilidade controlada'}. Sugere-se acompanhamento rigoroso dos próximos resultados trimestrais.`;
  }
  const forecastText = useTypewriter(synthesizedForecast, !!synthesizedForecast);

  const synthesizedRisks = [];
  if (metrics?.peRatio && metrics.peRatio > 40) synthesizedRisks.push("Valuation elevado (P/E alto)");
  if (metrics?.beta && metrics.beta > 1.5) synthesizedRisks.push("Alta sensibilidade a movimentos de mercado");
  if (quote?.changePercent && quote.changePercent < -3) synthesizedRisks.push("Pressão vendedora intensa recente");
  if (synthesizedRisks.length === 0) synthesizedRisks.push("Risco macroeconómico padrão do setor");

  // Chart Data preparation
  const formattedChartData = candlesData?.candles?.map(c => {
    return {
      date: format(new Date(c.t * 1000), "dd MMM"),
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
      vol: c.v,
      isUp: c.c >= c.o
    };
  }) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl cursor-pointer shrink-0">
            Analis<span className="text-muted-foreground">CX</span>
          </Link>
          
          <div className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  placeholder="Pesquisar ticker ou empresa (ex: AAPL, Apple)..." 
                  className="pl-10 bg-background/50 border-white/10 w-full rounded-full"
                />
                {searchFetching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                )}
              </div>
            </form>

            {searchFocused && (
              <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                {searchQuery.length > 1 ? (
                  <>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50 flex items-center gap-2">
                      <Search className="w-3 h-3" />
                      Resultados da pesquisa
                    </div>
                    {searchResults?.results && searchResults.results.length > 0 ? (
                      searchResults.results.slice(0, 6).map(res => (
                        <button
                          key={res.symbol}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedTicker(res.symbol);
                            setSearchQuery("");
                            setSearchFocused(false);
                          }}
                        >
                          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{res.symbol}</span>
                              {res.type && (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                                  {res.type}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{res.description}</div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {searchFetching ? "A pesquisar..." : "Sem resultados."}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Aconselhados pela AnalisCX
                    </div>
                    {moversData?.movers && moversData.movers.length > 0 ? (
                      moversData.movers.slice(0, 6).map(m => {
                        const up = m.changePercent >= 0;
                        const reco = m.changePercent > 1.5
                          ? "COMPRA"
                          : m.changePercent < -2
                          ? "VENDA"
                          : "MANTER";
                        const recoClass = reco === "COMPRA"
                          ? "bg-[#10B981]/20 text-[#10B981]"
                          : reco === "VENDA"
                          ? "bg-[#E11D48]/20 text-[#E11D48]"
                          : "bg-white/10 text-muted-foreground";
                        return (
                          <button
                            key={m.symbol}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedTicker(m.symbol);
                              setSearchQuery("");
                              setSearchFocused(false);
                            }}
                          >
                            {m.logo ? (
                              <img
                                src={m.logo}
                                alt={m.symbol}
                                className="w-9 h-9 rounded-lg bg-white/5 object-contain p-1 shrink-0"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{m.symbol}</span>
                                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${recoClass}`}>
                                  {reco}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{m.name}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-medium tabular-nums">${m.price.toFixed(2)}</div>
                              <div className={`text-[11px] tabular-nums flex items-center justify-end gap-0.5 ${up ? 'text-[#10B981]' : 'text-[#E11D48]'}`}>
                                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {up ? '+' : ''}{m.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        A carregar sugestões...
                      </div>
                    )}
                    <div className="px-4 py-2 text-[10px] text-muted-foreground/70 border-t border-border/50 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      Sugestões com base em variação intra-diária. Não constituem aconselhamento financeiro.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Link href="/etfs" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-full hover:bg-white/5 transition-colors">
              ETFs
            </Link>
            <Link href="/favoritos" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-full hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              Favoritos
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid lg:grid-cols-[1fr_340px] gap-8">
        
        <div className="flex flex-col gap-6 min-w-0">
          {/* Ticker Header */}
          {quoteError ? (
            <Card className="p-8 flex flex-col items-center justify-center text-center bg-destructive/10 border-destructive/20 text-destructive">
              <AlertTriangle className="w-8 h-8 mb-4" />
              <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
              <p className="text-sm opacity-80 mb-4">Não foi possível encontrar dados para "{selectedTicker}".</p>
              <Button variant="outline" onClick={() => setSelectedTicker("AAPL")}>Tentar AAPL</Button>
            </Card>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-4">
                  {profileLoading ? <Skeleton className="w-14 h-14 rounded-xl" /> : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {profile?.logo ? (
                        <img src={profile.logo} alt={profile.symbol} className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="font-bold text-lg">{selectedTicker.substring(0, 2)}</span>
                      )}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                      {selectedTicker}
                      {quoteLoading ? <Skeleton className="w-16 h-6 rounded-full" /> : (
                        <Badge variant="outline" className={`border-transparent ${isUp ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#E11D48]/20 text-[#E11D48]'}`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                          {quote?.changePercent.toFixed(2)}%
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(selectedTicker)}
                        aria-label={isFavorite(selectedTicker) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        title={isFavorite(selectedTicker) ? "Nos favoritos" : "Adicionar aos favoritos"}
                        className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            isFavorite(selectedTicker)
                              ? "fill-[#F5C46B] text-[#F5C46B]"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        />
                      </button>
                    </h1>
                    <div className="text-muted-foreground">{profileLoading ? <Skeleton className="w-32 h-4 mt-2" /> : profile?.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  {quoteLoading ? <Skeleton className="w-32 h-10 mb-1" /> : (
                    <div className="text-4xl font-light tracking-tight">${quote?.price.toFixed(2)}</div>
                  )}
                  {quoteLoading ? <Skeleton className="w-20 h-4 ml-auto" /> : (
                    <div className={`text-sm ${isUp ? 'text-[#10B981]' : 'text-[#E11D48]'}`}>
                      {quote?.change >= 0 ? '+' : ''}{quote?.change.toFixed(2)} hoje
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "ABERTURA", val: quote?.open.toFixed(2), pre: "$" },
                  { label: "P/E RATIO", val: metrics?.peRatio?.toFixed(2) || "N/A" },
                  { label: "DIVIDEND YIELD", val: metrics?.dividendYieldTTM?.toFixed(2) || "0.00", post: "%" },
                  { label: "BETA", val: metrics?.beta?.toFixed(2) || "N/A" },
                  { label: "52W HIGH", val: metrics?.weekHigh52?.toFixed(2) || "N/A", pre: "$" },
                ].map((m, i) => (
                  <Card key={i} className="p-4 bg-card/40 border-white/5">
                    <div className="text-[10px] text-muted-foreground font-semibold mb-1 tracking-wider">{m.label}</div>
                    <div className="font-mono text-lg">
                      {metricsLoading || quoteLoading ? <Skeleton className="w-16 h-6" /> : (
                        <>{m.pre}{m.val}{m.post}</>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Chart Section */}
              <Card className="p-6 border-white/5 bg-card/20 overflow-hidden flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {[30, 90, 180, 365].map(d => (
                      <Button 
                        key={d} 
                        variant="ghost" 
                        size="sm" 
                        className={`text-xs h-7 px-3 ${days === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setDays(d)}
                      >
                        {d === 30 ? '1M' : d === 90 ? '3M' : d === 180 ? '6M' : '1A'}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className={`h-7 w-7 ${chartMode === 'line' ? 'bg-white/10' : ''}`} onClick={() => setChartMode('line')}>
                      <LineChart className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className={`h-7 w-7 ${chartMode === 'candle' ? 'bg-white/10' : ''}`} onClick={() => setChartMode('candle')}>
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  {candlesLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={formattedChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} minTickGap={30} />
                        <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.2)" fontSize={12} tickFormatter={v => `$${v}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0d14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        {chartMode === 'line' ? (
                          <Line type="monotone" dataKey="close" stroke="#c4a47c" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        ) : (
                          // Simplified candlestick via bar chart with custom shape could be done, 
                          // but for speed we use a Bar for open/close and standard recharts.
                          // Real candlestick requires custom shape, let's use a colored bar for now representing the body
                          <Bar dataKey="close" fill="#10B981" shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            const isUp = payload.close >= payload.open;
                            const fill = isUp ? '#10B981' : '#E11D48';
                            // simple approximation
                            return <rect x={x} y={y} width={width} height={Math.max(2, height)} fill={fill} rx={2} />;
                          }} />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                {/* Volume Chart */}
                <div className="h-[80px] w-full mt-2">
                  {!candlesLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={formattedChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <Bar dataKey="vol" fill="rgba(255,255,255,0.1)" shape={(props: any) => {
                           const { x, y, width, height, payload } = props;
                           const isUp = payload.close >= payload.open;
                           const fill = isUp ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)';
                           return <rect x={x} y={y} width={width} height={height} fill={fill} rx={1} />;
                        }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* AI Sidebar */}
        <div className="flex flex-col gap-6">
          <Card className="p-5 border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-semibold tracking-tight">Assistente AnalisCX</h3>
            </div>
            
            <div className="mb-6">
              <Badge className={`mb-3 ${recommendation === 'COMPRA' ? 'bg-[#10B981] text-black hover:bg-[#10B981]' : recommendation === 'VENDA' ? 'bg-[#E11D48] text-white hover:bg-[#E11D48]' : 'bg-white/20 text-white hover:bg-white/20'}`}>
                {recommendation}
              </Badge>
              <div className="text-sm leading-relaxed min-h-[80px]">
                {(quoteLoading || metricsLoading) ? (
                  <div className="space-y-2">
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-[90%] h-4" />
                    <Skeleton className="w-[60%] h-4" />
                  </div>
                ) : (
                  forecastText || <span className="opacity-50">Gerando análise...</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Riscos Identificados</h4>
              <ul className="space-y-2">
                {quoteLoading || metricsLoading ? (
                  <Skeleton className="w-full h-12" />
                ) : (
                  synthesizedRisks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="opacity-90">{r}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </Card>

          {/* News */}
          <Card className="p-5 border-white/5 flex-1">
            <h3 className="font-semibold tracking-tight mb-4 flex items-center gap-2">
              Notícias Recentes
            </h3>
            <div className="space-y-4">
              {newsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                ))
              ) : newsData?.items?.length ? (
                newsData.items.map(item => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block group">
                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                      {item.headline}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{format(new Date(item.datetime * 1000), "dd MMM HH:mm")}</span>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem notícias recentes.</p>
              )}
            </div>
          </Card>
        </div>

      </main>
    </div>
  );
}
