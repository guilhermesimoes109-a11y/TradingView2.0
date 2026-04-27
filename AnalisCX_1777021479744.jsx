import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   AnalisCX — Stock Analysis App (React)
   ============================================================ */

// ── Stock Database ────────────────────────────────────────────
const STOCK_DB = {
  AAPL: {
    name: "Apple Inc.",
    price: 234.12,
    change: 2.41,
    dividend: 0.96,
    yieldPct: 0.41,
    pe: 32.4,
    vol: "54.2M",
    issues: [
      "Pressão regulatória na App Store (UE)",
      "Vendas do iPhone em desaceleração na China",
      "Cadeia de fornecimento exposta a Taiwan",
    ],
    forecast:
      "Apple deve manter crescimento moderado nos próximos 6 meses, impulsionada pelos serviços e Vision Pro. Resistência técnica em $245.",
  },
  TSLA: {
    name: "Tesla, Inc.",
    price: 248.5,
    change: -1.18,
    dividend: 0,
    yieldPct: 0,
    pe: 71.2,
    vol: "98.4M",
    issues: [
      "Margens em queda devido a guerra de preços",
      "Atrasos no Cybertruck e Robotaxi",
      "Concorrência da BYD na China",
    ],
    forecast:
      "Volatilidade elevada esperada. Modelo de IA prevê suporte forte em $230. Catalisador chave: dia da IA e robotaxi.",
  },
  NVDA: {
    name: "NVIDIA Corporation",
    price: 138.07,
    change: 4.82,
    dividend: 0.04,
    yieldPct: 0.03,
    pe: 64.5,
    vol: "212M",
    issues: [
      "Restrições de exportação para a China",
      "Avaliação considerada esticada",
      "Concorrência crescente de AMD e chips ASIC",
    ],
    forecast:
      "Tendência de alta forte. IA detecta padrão de continuação bullish. Próximo alvo técnico: $158. Suporte em $128.",
  },
  MSFT: {
    name: "Microsoft Corporation",
    price: 421.85,
    change: 0.92,
    dividend: 3.0,
    yieldPct: 0.71,
    pe: 35.1,
    vol: "22.8M",
    issues: [
      "Custos elevados de infraestrutura para IA",
      "Investigações antitrust na UE",
      "Crescimento do Azure desacelera vs concorrentes",
    ],
    forecast:
      "Crescimento estável esperado. Copilot e Azure continuam motores principais. Tendência lateral-alta nos próximos 30 dias.",
  },
  GOOGL: {
    name: "Alphabet Inc.",
    price: 168.32,
    change: 1.55,
    dividend: 0.8,
    yieldPct: 0.48,
    pe: 24.6,
    vol: "28.9M",
    issues: [
      "Processos antitrust nos EUA (busca e ad tech)",
      "Pressão da IA generativa sobre busca",
      "Despesas de capital em IA muito elevadas",
    ],
    forecast:
      "Sentimento misto. Recuperação possível se o Gemini ganhar tração. Modelo IA: alvo conservador $180 em 90 dias.",
  },
  AMZN: {
    name: "Amazon.com, Inc.",
    price: 195.22,
    change: -0.34,
    dividend: 0,
    yieldPct: 0,
    pe: 48.3,
    vol: "36.1M",
    issues: [
      "Margens do varejo sob pressão",
      "Investimentos elevados em logística e IA",
      "Concorrência da Walmart e Shein",
    ],
    forecast:
      "AWS continua a impulsionar lucros. IA prevê movimento lateral até próximo earnings. Suporte chave em $185.",
  },
};

function getStock(ticker) {
  const t = ticker.toUpperCase().trim();
  if (STOCK_DB[t]) return { ticker: t, ...STOCK_DB[t] };
  const price = +(Math.random() * 400 + 30).toFixed(2);
  const change = +((Math.random() - 0.45) * 6).toFixed(2);
  return {
    ticker: t,
    name: t + " Corporation",
    price,
    change,
    dividend: +(Math.random() * 3).toFixed(2),
    yieldPct: +(Math.random() * 2).toFixed(2),
    pe: +(Math.random() * 50 + 10).toFixed(1),
    vol: (Math.random() * 100 + 5).toFixed(1) + "M",
    issues: [
      "Dados limitados — análise baseada em modelo genérico",
      "Volatilidade do setor acima da média histórica",
      "Atenção ao próximo relatório trimestral",
    ],
    forecast: `Análise gerada por IA: ${t} apresenta padrão ${
      change >= 0 ? "de continuação positiva" : "de correção de curto prazo"
    }. Volatilidade esperada nas próximas semanas.`,
  };
}

function generateSeries(seed, days = 30) {
  let s = 0;
  for (let c of seed) s += c.charCodeAt(0);
  const data = [];
  let prev = 50 + (s % 30);
  for (let i = 0; i < days; i++) {
    const noise =
      (Math.sin((i + s) * 0.7) + Math.cos((i + s) * 1.3)) * 6 +
      (Math.random() - 0.5) * 8;
    const open = prev;
    const close = Math.max(10, open + noise);
    const high = Math.max(open, close) + Math.random() * 4;
    const low = Math.min(open, close) - Math.random() * 4;
    data.push({ open, close, high, low, vol: 30 + Math.random() * 70 });
    prev = close;
  }
  return data;
}

// ── Particles Background ──────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let w, h;
    let particles = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 0.4,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i],
            b = particles[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255,255,255,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
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
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        opacity: 0.55,
        pointerEvents: "none",
      }}
    />
  );
}

// ── SVG Charts ────────────────────────────────────────────────
function PriceChart({ data, mode }) {
  if (!data || !data.length) return null;
  const W = 800, H = 320, pad = 20;
  const max = Math.max(...data.map((d) => d.high));
  const min = Math.min(...data.map((d) => d.low));
  const range = max - min || 1;
  const slot = (W - pad * 2) / data.length;

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = pad + ((H - pad * 2) / 4) * i;
    return (
      <line
        key={i}
        x1={pad}
        x2={W - pad}
        y1={y}
        y2={y}
        stroke="rgba(255,255,255,0.06)"
        strokeDasharray="4 4"
      />
    );
  });

  const bars = (mode === "bars" || mode === "combo") && data.map((d, i) => {
    const x = pad + slot * i + slot * 0.15;
    const bw = slot * 0.7;
    const yHigh = pad + ((max - d.high) / range) * (H - pad * 2);
    const yLow = pad + ((max - d.low) / range) * (H - pad * 2);
    const yOpen = pad + ((max - d.open) / range) * (H - pad * 2);
    const yClose = pad + ((max - d.close) / range) * (H - pad * 2);
    const up = d.close >= d.open;
    const color = up ? "#22c55e" : "#ef4444";
    const top = Math.min(yOpen, yClose);
    const bh = Math.max(2, Math.abs(yOpen - yClose));
    return (
      <g key={i}>
        <line x1={x + bw / 2} x2={x + bw / 2} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1.4} opacity={0.7} />
        <rect x={x} y={top} width={bw} height={bh} fill={color} rx={2} />
      </g>
    );
  });

  const pts = data.map((d, i) => {
    const x = pad + slot * i + slot / 2;
    const y = pad + ((max - d.close) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  const lastX = pad + slot * (data.length - 1) + slot / 2;
  const firstX = pad + slot / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 320 }}>
      <defs>
        <linearGradient id="grad-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines}
      {bars}
      {(mode === "line" || mode === "combo") && (
        <>
          <polygon
            points={`${firstX},${H - pad} ${pts} ${lastX},${H - pad}`}
            fill="url(#grad-area)"
          />
          <polyline
            points={pts}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function VolumeChart({ data }) {
  if (!data || !data.length) return null;
  const W = 800, H = 140, pad = 10;
  const max = Math.max(...data.map((d) => d.vol));
  const slot = (W - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140 }}>
      {data.map((d, i) => {
        const h = (d.vol / max) * (H - pad * 2);
        const x = pad + slot * i + slot * 0.2;
        const bw = slot * 0.6;
        const y = H - pad - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={bw}
            height={h}
            fill={d.close >= d.open ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)"}
            rx={2}
          />
        );
      })}
    </svg>
  );
}

// ── Mini Chart for hero cards ─────────────────────────────────
function MiniChart({ points, color }) {
  return (
    <svg viewBox="0 0 200 60" style={{ width: "100%", height: 50 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

// ── Typewriter hook ───────────────────────────────────────────
function useTypewriter(text, active, speed = 16) {
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

// ── Counter animation ─────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = null;
      const dur = 1600;
      function step(t) {
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

// ── Styles object ─────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "#060606",
    color: "#fff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif',
    overflowX: "hidden",
    position: "relative",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 48px",
    background: "rgba(6,6,6,0.75)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    flexWrap: "wrap",
    gap: 12,
  },
  logo: { display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 20 },
  logoMark: { display: "inline-block", animation: "spin 8s linear infinite" },
  accent: { color: "#9aa0a6" },
  navLinks: { display: "flex", gap: 28 },
  navLink: { color: "#9aa0a6", textDecoration: "none", fontSize: 14, transition: "color .3s" },
  navLinkActive: { color: "#fff" },
  btn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "10px 20px", borderRadius: 999, fontWeight: 600, fontSize: 14,
    border: "1px solid transparent", cursor: "pointer", textDecoration: "none",
    transition: "all .25s", fontFamily: "inherit",
  },
  btnPrimary: { background: "#fff", color: "#000" },
  btnGhost: { background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.2)" },
  btnLg: { padding: "14px 28px", fontSize: 15 },
};

// ── Homepage ──────────────────────────────────────────────────
function HomePage({ onNavigate }) {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: "80px 48px 100px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-block", padding: "6px 14px", borderRadius: 999,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)",
              fontSize: 12, letterSpacing: ".5px", marginBottom: 24,
            }}>
              ⚡ Powered by AI
            </div>
            <h1 style={{ fontSize: "clamp(40px,6vw,72px)", lineHeight: 1.05, fontWeight: 800, letterSpacing: "-.03em", marginBottom: 24 }}>
              A próxima geração de{" "}
              <span style={{ background: "linear-gradient(135deg,#fff 0%,#b6b6b6 60%,#6b6b6b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                análise financeira
              </span>
            </h1>
            <p style={{ fontSize: 18, color: "#9aa0a6", maxWidth: 520, marginBottom: 36 }}>
              Decifre o mercado com inteligência artificial. Previsões em tempo real,
              análise técnica avançada e insights personalizados para cada ação.
            </p>
            <div style={{ display: "flex", gap: 14, marginBottom: 56 }}>
              <button onClick={() => onNavigate("analysis")} style={{ ...S.btn, ...S.btnPrimary, ...S.btnLg }}>
                Analisar uma ação
              </button>
              <a href="#features" style={{ ...S.btn, ...S.btnGhost, ...S.btnLg }}>Saber mais</a>
            </div>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              {[
                { count: 12500, label: "Ações monitoradas" },
                { count: 98, label: "% precisão IA" },
                { count: 24, label: "Mercados globais" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 32, fontWeight: 800 }}>
                    <AnimatedCounter target={s.count} />
                  </span>
                  <span style={{ fontSize: 12, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: 1 }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating cards */}
          <div style={{ position: "relative", height: 480 }}>
            <style>{`
              @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
              @keyframes float1 { 0%,100%{transform:translateY(-18px)} 50%{transform:translateY(0)} }
              @keyframes float2 { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(10px)} }
              @keyframes spin { to{transform:rotate(360deg)} }
              @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 70%{box-shadow:0 0 0 12px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
              @keyframes dotPulse { 0%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} 100%{opacity:1;transform:scale(1)} }
              @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
              @keyframes typeIn { from{opacity:0} to{opacity:1} }
            `}</style>
            {[
              {
                style: { top: 20, left: 30, animation: "float0 6s ease-in-out infinite" },
                ticker: "AAPL", change: "+2.41%", up: true,
                pts: "0,40 20,38 40,30 60,32 80,22 100,28 120,15 140,18 160,10 180,14 200,5",
              },
              {
                style: { top: 180, right: 20, animation: "float1 6s ease-in-out infinite" },
                ticker: "TSLA", change: "-1.18%", up: false,
                pts: "0,15 20,18 40,22 60,20 80,28 100,32 120,30 140,38 160,42 180,40 200,48",
              },
            ].map((card) => (
              <div key={card.ticker} style={{
                position: "absolute", ...card.style,
                background: "#111114", border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 18, padding: 18, minWidth: 220,
                boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  <span>{card.ticker}</span>
                  <span style={{ color: card.up ? "#22c55e" : "#ef4444" }}>{card.change}</span>
                </div>
                <MiniChart points={card.pts} color={card.up ? "#22c55e" : "#ef4444"} />
              </div>
            ))}
            <div style={{
              position: "absolute", bottom: 40, left: 60,
              animation: "float2 8s ease-in-out infinite",
              background: "#111114", border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 18, padding: 18, minWidth: 260,
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                <span>IA Insight</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "dotPulse 1.6s infinite" }} />
              </div>
              <p style={{ color: "#9aa0a6", fontSize: 13 }}>Sinal de compra detectado em <b style={{ color: "#fff" }}>NVDA</b>.</p>
            </div>
            {/* Orbs */}
            <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.08)", filter: "blur(60px)", top: -40, right: -40, zIndex: -1 }} />
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "rgba(34,197,94,0.12)", filter: "blur(60px)", bottom: -30, left: 0, zIndex: -1 }} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 48px", maxWidth: 1300, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, letterSpacing: "-.02em", textAlign: "center", marginBottom: 56 }}>
          Tudo o que precisas, num só lugar
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 20 }}>
          {[
            { icon: "📊", title: "Gráficos em tempo real", desc: "Velas, barras e linhas com indicadores técnicos avançados." },
            { icon: "🤖", title: "IA preditiva", desc: "Modelos treinados em milhões de pontos de dados financeiros." },
            { icon: "💎", title: "Dividendos & valor", desc: "Acompanha pagamentos, yields e valor justo de cada ativo." },
            { icon: "⚠️", title: "Alerta de riscos", desc: "Detecta problemas operacionais e financeiros antes do mercado." },
          ].map((f) => (
            <div key={f.title} style={{
              background: "#111114", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: 28,
              transition: "transform .35s, border-color .35s",
              cursor: "default",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "#9aa0a6", fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "40px 24px", color: "#6b6f76", fontSize: 13, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        © 2026 AnalisCX — Inteligência de mercado de nova geração.
      </footer>
    </div>
  );
}

// ── Analysis Page ─────────────────────────────────────────────
function AnalysisPage() {
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartMode, setChartMode] = useState("bars");
  const [analyzing, setAnalyzing] = useState(false);
  const [forecastActive, setForecastActive] = useState(false);
  const [issuesVisible, setIssuesVisible] = useState([]);

  const forecastText = useTypewriter(stock?.forecast || "", forecastActive);

  const handleSearch = useCallback(() => {
    const v = query.trim();
    if (!v) return;
    setAnalyzing(true);
    setForecastActive(false);
    setIssuesVisible([]);
    setTimeout(() => {
      const s = getStock(v);
      const d = generateSeries(s.ticker);
      setStock(s);
      setChartData(d);
      setAnalyzing(false);
      // Stagger issue reveals
      s.issues.forEach((_, i) => {
        setTimeout(() => setIssuesVisible((prev) => [...prev, i]), 600 + i * 200);
      });
      setTimeout(() => setForecastActive(true), 400);
    }, 600);
  }, [query]);

  const SUGGESTIONS = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN"];

  let rec = null;
  if (stock) {
    if (stock.change > 2) rec = { text: "🟢 COMPRA — momentum positivo", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
    else if (stock.change < -1) rec = { text: "🔴 VENDA — sinais de fraqueza", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    else rec = { text: "⚪ MANTER — aguardar confirmação", color: "#fff", bg: "rgba(255,255,255,0.05)" };
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "60px 48px 100px" }}>
      {/* Search hero */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, letterSpacing: "-.03em", marginBottom: 12 }}>
          Examina qualquer <span style={{ background: "linear-gradient(135deg,#fff,#9aa0a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ação</span>
        </h1>
        <p style={{ color: "#9aa0a6", fontSize: 17, marginBottom: 36 }}>
          Escreve o ticker ou nome da empresa e a IA fará o resto.
        </p>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, maxWidth: 640, margin: "0 auto 18px",
          background: "#111114", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999,
          padding: "6px 6px 6px 22px", transition: "border-color .3s",
        }}>
          <span style={{ color: "#9aa0a6", fontSize: 20 }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ex: AAPL, TSLA, NVDA, MSFT, GOOGL…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fff", fontSize: 16, padding: "14px 4px", fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={analyzing}
            style={{ ...S.btn, ...S.btnPrimary, opacity: analyzing ? 0.7 : 1 }}
          >
            {analyzing ? "A analisar…" : "Analisar"}
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", alignItems: "center", color: "#9aa0a6", fontSize: 13 }}>
          <span>Sugestões:</span>
          {SUGGESTIONS.map((t) => (
            <button key={t} onClick={() => { setQuery(t); setTimeout(handleSearch, 50); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fff"; }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", borderRadius: 999, padding: "6px 14px", fontSize: 13, cursor: "pointer", transition: "all .25s", fontFamily: "inherit" }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!stock && !analyzing && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#9aa0a6" }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.6 }}>📈</div>
          <p>Pesquisa uma ação para ver gráficos e análise da IA.</p>
        </div>
      )}

      {/* Loading */}
      {analyzing && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#9aa0a6" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p>A processar dados com IA…</p>
        </div>
      )}

      {/* Results */}
      {stock && !analyzing && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 28 }}>
          {/* AI Panel */}
          <aside style={{
            background: "linear-gradient(180deg,#111114 0%,#0a0a0c 100%)",
            border: "1px solid rgba(255,255,255,0.18)", borderRadius: 24, padding: 26,
            position: "sticky", top: 100, height: "fit-content",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#000", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, position: "relative" }}>
                IA
                <span style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", animation: "ring 2.5s ease-out infinite" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, marginBottom: 2 }}>Assistente AnalisCX</h3>
                <p style={{ fontSize: 12, color: "#9aa0a6", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "dotPulse 1.6s infinite" }} />
                  a analisar dados…
                </p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, paddingBottom: 16 }}>
              <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#9aa0a6", marginBottom: 10 }}>🔮 Previsão</h4>
              <p style={{ fontSize: 14, color: "#e8e8e8", lineHeight: 1.6 }}>
                {forecastText}
                {forecastText.length < (stock?.forecast?.length || 0) && <span style={{ animation: "dotPulse 1s infinite" }}>▍</span>}
              </p>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, paddingBottom: 16 }}>
              <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#9aa0a6", marginBottom: 10 }}>⚠️ Problemas atuais</h4>
              <ul style={{ listStyle: "none" }}>
                {stock.issues.map((iss, i) => (
                  <li key={i} style={{
                    padding: "8px 0 8px 18px", position: "relative", fontSize: 14, color: "#e8e8e8",
                    borderBottom: i < stock.issues.length - 1 ? "1px dashed rgba(255,255,255,0.08)" : "none",
                    opacity: issuesVisible.includes(i) ? 1 : 0,
                    transform: issuesVisible.includes(i) ? "translateX(0)" : "translateX(-10px)",
                    transition: "all .4s",
                  }}>
                    <span style={{ position: "absolute", left: 0, color: "#ef4444" }}>▸</span>
                    {iss}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
              <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#9aa0a6", marginBottom: 10 }}>💡 Recomendação</h4>
              {rec && (
                <div style={{ padding: 14, borderRadius: 12, background: rec.bg, border: `1px solid ${rec.color}`, fontWeight: 600, textAlign: "center", color: rec.color, fontSize: 14 }}>
                  {rec.text}
                </div>
              )}
            </div>
          </aside>

          {/* Chart area */}
          <div>
            {/* Ticker header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
              background: "#111114", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 28px", marginBottom: 18,
            }}>
              <div>
                <h2 style={{ fontSize: 36, letterSpacing: "-.02em" }}>{stock.ticker}</h2>
                <p style={{ color: "#9aa0a6", fontSize: 14 }}>{stock.name}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>${stock.price.toFixed(2)}</span>
                <span style={{
                  fontSize: 14, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                  background: stock.change >= 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: stock.change >= 0 ? "#22c55e" : "#ef4444",
                }}>
                  {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 18 }}>
              {[
                { label: "Valor", val: `$${stock.price.toFixed(2)}` },
                { label: "Dividendo", val: `$${stock.dividend.toFixed(2)}` },
                { label: "Yield", val: `${stock.yieldPct.toFixed(2)}%` },
                { label: "P/E", val: stock.pe.toFixed(1) },
                { label: "Volume", val: stock.vol },
              ].map((m) => (
                <div key={m.label} style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Price chart */}
            <div style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <h3 style={{ fontSize: 16 }}>Histórico de preço (30 dias)</h3>
                <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 999 }}>
                  {["bars", "line", "combo"].map((m) => (
                    <button key={m} onClick={() => setChartMode(m)}
                      style={{
                        background: chartMode === m ? "#fff" : "transparent",
                        color: chartMode === m ? "#000" : "#9aa0a6",
                        border: "none", padding: "6px 14px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .25s",
                      }}>
                      {m === "bars" ? "Barras" : m === "line" ? "Linha" : "Combo"}
                    </button>
                  ))}
                </div>
              </div>
              <PriceChart data={chartData} mode={chartMode} />
              <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 12, color: "#9aa0a6", alignItems: "center" }}>
                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#22c55e", borderRadius: 3, marginRight: 6, verticalAlign: "middle" }} />Alta</span>
                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#ef4444", borderRadius: 3, marginRight: 6, verticalAlign: "middle" }} />Baixa</span>
                <span><span style={{ display: "inline-block", width: 18, height: 2, background: "#fff", marginRight: 6, verticalAlign: "middle" }} />Tendência</span>
              </div>
            </div>

            {/* Volume chart */}
            <div style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Volume por dia</h3>
              <VolumeChart data={chartData} />
            </div>
          </div>
        </div>
      )}

      {/* Global keyframes */}
      <style>{`
        @keyframes ring { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.4);opacity:0} }
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={S.app}>
      <ParticleCanvas />

      {/* Navbar */}
      <nav style={S.nav}>
        <div style={S.logo}>
          <span style={S.logoMark}>◆</span>
          <span>Analis<span style={S.accent}>CX</span></span>
        </div>
        <div style={S.navLinks}>
          {["home", "analysis"].map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ ...S.btn, background: "transparent", border: "none", color: page === p ? "#fff" : "#9aa0a6", fontSize: 14, padding: "4px 0", cursor: "pointer" }}>
              {p === "home" ? "Início" : "Análise"}
            </button>
          ))}
        </div>
        {page === "home" ? (
          <button onClick={() => setPage("analysis")} style={{ ...S.btn, ...S.btnPrimary }}>Começar →</button>
        ) : (
          <button onClick={() => setPage("home")} style={{ ...S.btn, ...S.btnGhost }}>← Voltar</button>
        )}
      </nav>

      {page === "home" ? <HomePage onNavigate={setPage} /> : <AnalysisPage />}
    </div>
  );
}
