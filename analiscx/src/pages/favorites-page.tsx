import { Link, useLocation } from "wouter";
import { useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Loader2,
  Search,
  Trash2,
  Building2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/use-favorites";
import { getStockQuote, getStockProfile } from "@workspace/api-client-react";

interface FavRow {
  symbol: string;
  name: string;
  logo: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  isLoading: boolean;
  isError: boolean;
}

export default function FavoritesPage() {
  const [, setLocation] = useLocation();
  const { favorites, removeFavorite } = useFavorites();

  // Fetch quote + profile for each favorite in parallel
  const queries = useQueries({
    queries: favorites.flatMap((symbol) => [
      {
        queryKey: ["/api/stocks/quote", symbol],
        queryFn: () => getStockQuote(symbol),
        staleTime: 60_000,
      },
      {
        queryKey: ["/api/stocks/profile", symbol],
        queryFn: () => getStockProfile(symbol),
        staleTime: 5 * 60_000,
      },
    ]),
  });

  const rows: FavRow[] = favorites.map((symbol, i) => {
    const quoteQ = queries[i * 2];
    const profileQ = queries[i * 2 + 1];
    const quote = quoteQ?.data;
    const profile = profileQ?.data;
    return {
      symbol,
      name: profile?.name ?? symbol,
      logo: profile?.logo ?? null,
      price: quote?.price ?? null,
      change: quote?.change ?? null,
      changePercent: quote?.changePercent ?? null,
      isLoading: !!(quoteQ?.isLoading || profileQ?.isLoading),
      isError: !!(quoteQ?.isError || profileQ?.isError),
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl cursor-pointer">
            Analis<span className="text-muted-foreground">CX</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/analise"
              className="px-4 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Ações
            </Link>
            <Link
              href="/etfs"
              className="px-4 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              ETFs
            </Link>
            <Link
              href="/favoritos"
              className="px-4 py-2 rounded-full bg-white/10 text-foreground transition-colors flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" />
              Favoritos
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground mb-4">
              <Sparkles className="w-3 h-3" />
              A tua carteira de acompanhamento
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Favoritos
            </h1>
            <p className="text-muted-foreground mt-2">
              {favorites.length === 0
                ? "Ainda não tens favoritos. Adiciona ações e ETFs com a estrela."
                : `${favorites.length} ${favorites.length === 1 ? "ativo" : "ativos"} acompanhados.`}
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <Card className="p-16 text-center">
            <Star className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sem favoritos</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Marca ações e ETFs com a estrela para os teres sempre à mão.
              Os favoritos ficam guardados neste dispositivo.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setLocation("/analise")}>
                Explorar ações
              </Button>
              <Button variant="outline" onClick={() => setLocation("/etfs")}>
                Explorar ETFs
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_120px_140px_60px] md:grid-cols-[1fr_140px_180px_80px] gap-4 px-5 py-3 border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <div>Ativo</div>
              <div className="text-right">Preço</div>
              <div className="text-right">Variação</div>
              <div></div>
            </div>
            {rows.map((row, idx) => {
              const up = row.changePercent != null && row.changePercent >= 0;
              return (
                <motion.div
                  key={row.symbol}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="grid grid-cols-[1fr_120px_140px_60px] md:grid-cols-[1fr_140px_180px_80px] gap-4 items-center px-5 py-4 border-b border-border/30 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/analise?ticker=${row.symbol}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {row.logo ? (
                      <img
                        src={row.logo}
                        alt={row.symbol}
                        className="w-10 h-10 rounded-lg bg-white/5 object-contain p-1.5 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold">{row.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {row.isLoading ? "A carregar..." : row.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    {row.isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin inline" />
                    ) : row.price != null ? (
                      <span className="text-base">${row.price.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                  <div className="text-right tabular-nums">
                    {row.changePercent != null ? (
                      <span
                        className={`inline-flex items-center justify-end gap-1 text-sm ${
                          up ? "text-[#10B981]" : "text-[#E11D48]"
                        }`}
                      >
                        {up ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {up ? "+" : ""}
                        {row.changePercent.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(row.symbol);
                      }}
                      aria-label="Remover dos favoritos"
                      className="p-2 rounded-md text-muted-foreground hover:text-[#E11D48] hover:bg-white/5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </Card>
        )}

        {favorites.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground/70">
            <div>Os favoritos ficam guardados neste dispositivo (localStorage).</div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/analise")}>
              <Search className="w-3 h-3 mr-1.5" />
              Adicionar mais
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
