import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetMarketMovers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  Bot, 
  Gem, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star
} from "lucide-react";

// Particle Background Component
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let w: number, h: number;
    const particles: any[] = [];

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(255,255,255,0.4)";
        ctx!.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `rgba(255,255,255,${0.1 * (1 - d / 100)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 opacity-40 pointer-events-none"
    />
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number, suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start: number | null = null;
      const dur = 1500;
      function step(t: number) {
        if (!start) start = t;
        const p = Math.min((t - start) / dur, 1);
        setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const { data: moversData, isLoading: isLoadingMovers } = useGetMarketMovers({
    query: {
      queryKey: ["/api/stocks/movers"],
      refetchInterval: 10000,
    }
  });

  const movers = moversData?.movers?.slice(0, 3) || [];

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden bg-background text-foreground">
      <ParticleCanvas />

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Gem className="w-5 h-5 text-primary" />
          <span>Analis<span className="text-muted-foreground">CX</span></span>
        </div>
        <div className="flex gap-1 items-center">
          <Link href="/analise" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-full hover:bg-white/5 transition-colors">
            Ações
          </Link>
          <Link href="/etfs" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-full hover:bg-white/5 transition-colors">
            ETFs
          </Link>
          <Link href="/favoritos" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-full hover:bg-white/5 transition-colors">
            <Star className="w-3.5 h-3.5" />
            Favoritos
          </Link>
          <Link href="/analise" className="ml-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
            Entrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-20 grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs tracking-wide mb-6">
            <Bot className="w-3.5 h-3.5" />
            <span>Powered by AI</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
            A próxima geração de{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white/80 to-white/40">
              análise financeira
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
            Decifre o mercado com inteligência artificial. Previsões em tempo real, 
            análise técnica avançada e insights personalizados para cada ação.
          </p>

          <div className="flex flex-wrap gap-4 mb-14">
            <Link href="/analise" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors">
              Analisar uma ação
            </Link>
            <a href="#features" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors">
              Saber mais
            </a>
          </div>

          <div className="flex flex-wrap gap-12">
            {[
              { count: 12500, label: "Ações monitoradas" },
              { count: 98, label: "% precisão IA" },
              { count: 24, label: "Mercados globais" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-3xl font-bold">
                  <AnimatedCounter target={s.count} />
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Floating Cards - Real Movers Data */}
        <div className="relative h-[500px] hidden lg:block">
          <div className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl -top-10 -right-10" />
          <div className="absolute w-64 h-64 rounded-full bg-[#10B981]/10 blur-3xl -bottom-10 left-10" />
          
          {isLoadingMovers ? (
            <div className="absolute top-10 left-10 w-64 p-4 rounded-2xl bg-card border border-white/10 shadow-2xl">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {movers[0] && (
                <motion.div 
                  animate={{ y: [0, -15, 0] }} 
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 left-10 w-64 p-5 rounded-2xl bg-card border border-white/10 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex justify-between items-center font-semibold mb-2">
                    <span className="flex items-center gap-2">
                      {movers[0].logo ? <img src={movers[0].logo} alt="" className="w-5 h-5 rounded-sm" /> : null}
                      {movers[0].symbol}
                    </span>
                    <span className={movers[0].change >= 0 ? "text-[#10B981]" : "text-[#E11D48]"}>
                      {movers[0].change >= 0 ? "+" : ""}{movers[0].changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-2xl font-light">${movers[0].price.toFixed(2)}</div>
                </motion.div>
              )}
              
              {movers[1] && (
                <motion.div 
                  animate={{ y: [-15, 0, -15] }} 
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-48 right-0 w-64 p-5 rounded-2xl bg-card border border-white/10 shadow-2xl backdrop-blur-md z-10"
                >
                  <div className="flex justify-between items-center font-semibold mb-2">
                    <span className="flex items-center gap-2">
                      {movers[1].logo ? <img src={movers[1].logo} alt="" className="w-5 h-5 rounded-sm" /> : null}
                      {movers[1].symbol}
                    </span>
                    <span className={movers[1].change >= 0 ? "text-[#10B981]" : "text-[#E11D48]"}>
                      {movers[1].change >= 0 ? "+" : ""}{movers[1].changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-2xl font-light">${movers[1].price.toFixed(2)}</div>
                </motion.div>
              )}
            </>
          )}

          <motion.div 
            animate={{ y: [-5, 10, -5] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-20 w-72 p-5 rounded-2xl bg-card border border-white/10 shadow-2xl backdrop-blur-md"
          >
            <div className="flex justify-between items-center font-semibold mb-3">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Bot className="w-4 h-4" /> IA Insight
              </span>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <p className="text-sm leading-snug">
              Sinal de {movers[0] && movers[0].change >= 0 ? "compra" : "venda"} detectado em <b className="text-white">{movers[0]?.symbol || "AAPL"}</b> devido a volume anormal.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 w-full">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 tracking-tight">
          Tudo o que precisas, num só lugar
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: BarChart3, title: "Gráficos em tempo real", desc: "Velas, barras e linhas com indicadores técnicos avançados." },
            { icon: Bot, title: "IA preditiva", desc: "Modelos treinados em milhões de pontos de dados financeiros." },
            { icon: Gem, title: "Dividendos & valor", desc: "Acompanha pagamentos, yields e valor justo de cada ativo." },
            { icon: AlertTriangle, title: "Alerta de riscos", desc: "Detecta problemas operacionais e financeiros antes do mercado." },
          ].map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300"
            >
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-white/5">
        © 2026 AnalisCX — Inteligência de mercado de nova geração.
      </footer>
    </div>
  );
}
