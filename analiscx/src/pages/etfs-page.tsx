import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Loader2,
  PieChart,
  TrendingUp,
  Search,
  Layers,
} from "lucide-react";
import { useGetEtfs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/use-favorites";

const HERO_STATS = [
  { label: "ETFs Acompanhados", value: "16" },
  { label: "Atualização", value: "Tempo real" },
  { label: "Cobertura", value: "Global" },
];

export default function EtfsPage() {
  const [, setLocation] = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data, isLoading, error } = useGetEtfs({
    query: { queryKey: ["/api/stocks/etfs"], staleTime: 60_000 },
  });

  const etfs = data?.movers ?? [];

  const goAnalyze = (symbol: string) => {
    setLocation(`/analise?ticker=${symbol}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              className="px-4 py-2 rounded-full bg-white/10 text-foreground transition-colors"
            >
              ETFs
            </Link>
            <Link
              href="/favoritos"
              className="px-4 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" />
              Favoritos
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground mb-4">
              <Layers className="w-3 h-3" />
              Exchange Traded Funds
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              ETFs em <span className="text-muted-foreground">tempo real</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Diversifica a tua carteira com fundos cotados em bolsa.
              Acompanha índices, setores e matérias-primas com dados atualizados.
            </p>
          </div>
          <div className="flex gap-6">
            {HERO_STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-light tracking-tight">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        {error ? (
          <Card className="p-12 text-center bg-destructive/5 border-destructive/20">
            <p className="text-destructive">Erro ao carregar dados de ETFs.</p>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : etfs.length === 0 ? (
          <Card className="p-12 text-center">
            <PieChart className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Sem dados disponíveis.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {etfs.map((e, idx) => {
              const up = e.changePercent >= 0;
              const fav = isFavorite(e.symbol);
              return (
                <motion.div
                  key={e.symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                >
                  <Card
                    className="group relative p-5 hover:bg-white/5 transition-colors cursor-pointer h-full flex flex-col"
                    onClick={() => goAnalyze(e.symbol)}
                  >
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        toggleFavorite(e.symbol);
                      }}
                      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/10 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          fav
                            ? "fill-[#F5C46B] text-[#F5C46B]"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                    </button>

                    <div className="flex items-center gap-3 mb-4 pr-8">
                      {e.logo ? (
                        <img
                          src={e.logo}
                          alt={e.symbol}
                          className="w-10 h-10 rounded-lg bg-white/5 object-contain p-1.5 shrink-0"
                          onError={(ev) => {
                            (ev.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <PieChart className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-base">{e.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">{e.name}</div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-light tabular-nums tracking-tight">
                          ${e.price.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs tabular-nums flex items-center gap-1 mt-1 ${
                            up ? "text-[#10B981]" : "text-[#E11D48]"
                          }`}
                        >
                          {up ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {up ? "+" : ""}
                          {e.change.toFixed(2)} ({e.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          goAnalyze(e.symbol);
                        }}
                      >
                        <Search className="w-3 h-3 mr-1" />
                        Analisar
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-xs text-muted-foreground/70 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          Dados em tempo real fornecidos por Finnhub. Não constituem aconselhamento financeiro.
        </div>
      </main>
    </div>
  );
}
