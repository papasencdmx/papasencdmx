import { useState } from "react";

const NAVY = "#1E3A5F";
const COPPER = "#C07040";
const COPPER_LIGHT = "#D4885A";
const CREAM = "#FAFAF8";
const WARM_BG = "#F7F5F2";

const MOCK_POSTS = [
  { title: "Los 10 mejores campamentos de verano en Madrid para 2026", tag: "Guia", date: "24 feb", emoji: "🏕️", read: "8 min", hot: true },
  { title: "Que hacer este finde: almendros en flor en Quinta de los Molinos", tag: "Planes", date: "22 feb", emoji: "🌸", read: "4 min", hot: false },
  { title: "Como elegir colegio en Madrid: la guia definitiva", tag: "Educacion", date: "19 feb", emoji: "🏫", read: "12 min", hot: false },
  { title: "5 clases de robotica para ninos que merece la pena probar", tag: "Extraescolares", date: "15 feb", emoji: "🤖", read: "6 min", hot: false },
];

const MOCK_EVENTS = [
  { title: "Carnaval Infantil en Chamartin", date: "1 Mar", day: "Sab", time: "17:00", zone: "Chamartin", free: true, emoji: "🎭" },
  { title: "Taller de Robotica para Ninos", date: "2 Mar", day: "Dom", time: "10:00", zone: "Sanchinarro", free: false, price: 15, emoji: "🤖" },
  { title: "Cuentacuentos en el Retiro", date: "8 Mar", day: "Sab", time: "11:00", zone: "Retiro", free: true, emoji: "📚" },
  { title: "Jornada de Puertas Abiertas SEK", date: "8 Mar", day: "Sab", time: "10:00", zone: "Villanueva", free: true, emoji: "🏫" },
  { title: "Campus de Padel Junior", date: "9 Mar", day: "Dom", time: "9:00", zone: "Pozuelo", free: false, price: 25, emoji: "🎾" },
  { title: "Festival de Ciencia Familiar", date: "15 Mar", day: "Sab", time: "10:00", zone: "Centro", free: true, emoji: "🔬" },
];

const CATEGORIES = [
  { name: "Campamentos", desc: "Verano, Semana Santa, Navidad", count: 142, emoji: "☀️", color: "#F59E0B" },
  { name: "Colegios", desc: "Publicos, concertados, privados", count: 318, emoji: "🎓", color: "#3B82F6" },
  { name: "Extraescolares", desc: "Idiomas, musica, robotica, arte", count: 205, emoji: "🎨", color: "#8B5CF6" },
  { name: "Ocio Familiar", desc: "Planes, parques, restaurantes", count: 167, emoji: "🎡", color: "#EC4899" },
  { name: "Deportes", desc: "Clubs, academias, piscinas", count: 189, emoji: "⚽", color: "#10B981" },
  { name: "Salud", desc: "Pediatras, logopedas, nutricion", count: 134, emoji: "💚", color: "#14B8A6" },
];

const FEATURED = [
  { name: "Club Las Encinas", zone: "Pozuelo", cat: "Campamentos", rating: 4.7, reviews: 89, verified: true, emoji: "🏕️" },
  { name: "SEK El Castillo", zone: "Villanueva", cat: "Colegios", rating: 4.5, reviews: 134, verified: true, emoji: "🏫" },
  { name: "David Lloyd Aravaca", zone: "Aravaca", cat: "Deportes", rating: 4.6, reviews: 212, verified: true, emoji: "🎾" },
  { name: "Kitchen Club", zone: "Chamartin", cat: "Extraescolares", rating: 4.8, reviews: 67, verified: true, emoji: "👨‍🍳" },
];

const ZONES = [
  "Sanchinarro", "Las Tablas", "Chamartin", "Pozuelo", "Aravaca", "Salamanca", "Chamberi", "Majadahonda", "Las Rozas", "La Moraleja", "Tres Cantos", "Retiro"
];

const StarIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const ArrowIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const CalIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const MapIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const FireIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;

const H = "'Plus Jakarta Sans', system-ui, sans-serif";
const B = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function App() {
  const [email, setEmail] = useState("");

  return (
    <div style={{ fontFamily: B, background: CREAM, minHeight: "100vh", color: "#1C1917" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ─── HEADER ─── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: H, fontWeight: 800, color: "white", fontSize: 17 }}>P</span>
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <span style={{ fontFamily: H, fontSize: 15, fontWeight: 600, color: NAVY }}>Padres en </span>
              <span style={{ fontFamily: H, fontSize: 15, fontWeight: 800, color: COPPER }}>Madrid</span>
            </div>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: 2 }} className="hidden-mobile">
            {["Directorio", "Eventos", "Blog", "Zonas"].map((n) => (
              <button key={n} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#57534E", background: "none", border: "none", cursor: "pointer", fontFamily: B }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F4"; e.currentTarget.style.color = NAVY; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#57534E"; }}>
                {n}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ padding: 8, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "#78716C" }}><SearchIcon /></button>
            <button style={{ padding: "7px 16px", borderRadius: 10, background: COPPER, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: B }}
              onMouseEnter={e => e.currentTarget.style.background = COPPER_LIGHT}
              onMouseLeave={e => e.currentTarget.style.background = COPPER}>
              Anunciate
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2A4A6E 50%, #1E3A5F 100%)`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "52px 20px 56px", position: "relative" }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: 100, padding: "6px 14px 6px 8px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
              {["😊","👶","👨‍👩‍👧","🧡"].map((e,i) => (
                <span key={i} style={{ fontSize: 14, marginLeft: i > 0 ? -4 : 0 }}>{e}</span>
              ))}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>40.000+ familias ya suscritas</span>
            </div>

            <h1 style={{ fontFamily: H, fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: "-0.03em", margin: 0 }}>
              Tu guia familiar<br />para vivir en <span style={{ color: COPPER_LIGHT }}>Madrid</span>
            </h1>

            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginTop: 16, maxWidth: 460, fontWeight: 400 }}>
              Cada semana: los mejores planes, recursos y recomendaciones para familias. Directorio verificado de +1.000 servicios.
            </p>

            <div style={{ marginTop: 28, display: "flex", gap: 8, maxWidth: 420 }}>
              <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ flex: 1, padding: "13px 16px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, outline: "none", fontFamily: B }} />
              <button style={{ padding: "13px 24px", borderRadius: 12, background: COPPER, border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: B }}
                onMouseEnter={e => e.currentTarget.style.background = COPPER_LIGHT}
                onMouseLeave={e => e.currentTarget.style.background = COPPER}>
                Suscribete
              </button>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 10, fontWeight: 400 }}>
              Gratis. Cada viernes. Sin spam. 49% tasa de apertura.
            </p>
          </div>

          <div style={{ display: "flex", gap: 28, marginTop: 36, flexWrap: "wrap" }}>
            {[
              { n: "40K", l: "suscriptores", icon: "👥" },
              { n: "49%", l: "apertura", icon: "📧" },
              { n: "1.000+", l: "servicios verificados", icon: "✅" },
            ].map(s => (
              <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: H, fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOG POSTS ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: H, fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.02em" }}>Lo ultimo en la newsletter</h2>
            <p style={{ fontSize: 14, color: "#78716C", marginTop: 4, fontWeight: 400 }}>Cada viernes, directo a tu bandeja</p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: COPPER, fontFamily: B }}>
            Ver archivo <ArrowIcon />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
          {MOCK_POSTS.map((post, i) => (
            <article key={i} style={{ background: "white", borderRadius: 16, border: "1px solid #E7E5E4", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor = "#D6D3D1"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E7E5E4"; }}>
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: COPPER, background: "rgba(192,112,64,0.08)", padding: "3px 8px", borderRadius: 6 }}>{post.tag}</span>
                  {post.hot && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#EF4444", fontWeight: 700 }}><FireIcon /> Popular</span>}
                </div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{post.emoji}</div>
                <h3 style={{ fontFamily: H, fontSize: 16, fontWeight: 700, color: NAVY, lineHeight: 1.35, margin: 0, letterSpacing: "-0.01em" }}>{post.title}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>
                  <span>{post.date}</span>
                  <span style={{ color: "#D6D3D1" }}>·</span>
                  <span>{post.read} lectura</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── DIRECTORY ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: H, fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.02em" }}>Directorio familiar</h2>
            <p style={{ fontSize: 14, color: "#78716C", marginTop: 4, fontWeight: 400 }}>1.155 servicios verificados en Madrid y alrededores</p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: COPPER, fontFamily: B }}>
            Ver todo <ArrowIcon />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.name} style={{ background: "white", borderRadius: 14, border: "1px solid #E7E5E4", padding: "20px 16px", textAlign: "left", cursor: "pointer", transition: "all 0.2s", fontFamily: B }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = cat.color + "40"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E7E5E4"; }}>
              <span style={{ fontSize: 28 }}>{cat.emoji}</span>
              <h3 style={{ fontFamily: H, fontSize: 15, fontWeight: 700, color: NAVY, margin: "10px 0 2px", letterSpacing: "-0.01em" }}>{cat.name}</h3>
              <p style={{ fontSize: 12, color: "#A8A29E", margin: 0, lineHeight: 1.4, fontWeight: 400 }}>{cat.desc}</p>
              <p style={{ fontSize: 12, color: cat.color, fontWeight: 700, margin: "8px 0 0" }}>{cat.count}+ listados</p>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 13, color: "#78716C", marginBottom: 8, fontWeight: 600 }}>Zonas populares:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ZONES.map(z => (
              <button key={z} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500, border: "1px solid #E7E5E4", background: "white", color: "#57534E", cursor: "pointer", transition: "all 0.15s", fontFamily: B }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; e.currentTarget.style.background = "#F0F4FA"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.color = "#57534E"; e.currentTarget.style.background = "white"; }}>
                {z}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EVENTS + FEATURED ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          
          {/* Events */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: H, fontSize: 20, fontWeight: 800, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.02em" }}>
                <span style={{ color: COPPER }}><CalIcon /></span> Proximos eventos
              </h2>
              <button style={{ fontSize: 13, fontWeight: 700, color: COPPER, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: B }}>
                Ver todos <ArrowIcon />
              </button>
            </div>

            <div style={{ background: "white", borderRadius: 16, border: "1px solid #E7E5E4", overflow: "hidden" }}>
              {MOCK_EVENTS.map((ev, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < MOCK_EVENTS.length - 1 ? "1px solid #F5F5F4" : "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFAF9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: `${NAVY}06`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: COPPER, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ev.day}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{ev.date.split(" ")[0]}</span>
                    <span style={{ fontSize: 9, color: "#A8A29E", textTransform: "uppercase", fontWeight: 600 }}>{ev.date.split(" ")[1]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: "#292524", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>
                      <span>{ev.time}</span>
                      <span style={{ color: "#D6D3D1" }}>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapIcon />{ev.zone}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {ev.free ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "#ECFDF5", padding: "3px 8px", borderRadius: 6 }}>Gratis</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#57534E", background: "#F5F5F4", padding: "3px 8px", borderRadius: 6 }}>{ev.price}€</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: H, fontSize: 20, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.02em" }}>
                ⭐ Recomendados
              </h2>
              <button style={{ fontSize: 13, fontWeight: 700, color: COPPER, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: B }}>
                Ver directorio <ArrowIcon />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {FEATURED.map((f) => (
                <div key={f.name} style={{ background: "white", borderRadius: 14, border: "1px solid #E7E5E4", padding: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${CREAM}, #EAE6E1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                    {f.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <h4 style={{ fontFamily: H, fontSize: 14, fontWeight: 700, color: "#292524", margin: 0 }}>{f.name}</h4>
                      {f.verified && <span style={{ color: "#10B981" }}><CheckIcon /></span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>
                      <span style={{ color: "#F59E0B", display: "flex", alignItems: "center", gap: 2 }}><StarIcon /> {f.rating}</span>
                      <span>({f.reviews})</span>
                      <span style={{ color: "#D6D3D1" }}>·</span>
                      <span>{f.zone}</span>
                    </div>
                    <span style={{ fontSize: 11, color: COPPER, fontWeight: 600 }}>{f.cat}</span>
                  </div>
                  <span style={{ color: "#D6D3D1", flexShrink: 0 }}><ArrowIcon /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MID-PAGE CTA ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 20px 0" }}>
        <div style={{ background: WARM_BG, borderRadius: 20, border: "1px solid #E7E5E4", padding: "40px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 400 }}>
            <h2 style={{ fontFamily: H, fontSize: 21, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.02em" }}>
              La newsletter que leen 40.000 familias en Madrid
            </h2>
            <p style={{ fontSize: 14, color: "#78716C", marginTop: 8, lineHeight: 1.6, fontWeight: 400 }}>
              Planes de fin de semana, campamentos, colegios, recomendaciones honestas. Cada viernes a las 8:00.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <input type="email" placeholder="tu@email.com"
              style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #D6D3D1", background: "white", fontSize: 14, width: 220, outline: "none", fontFamily: B }} />
            <button style={{ padding: "12px 20px", borderRadius: 10, background: COPPER, border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: B }}>
              Suscribete
            </button>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 20px 0", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 16 }}>Confian en nosotros</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap", opacity: 0.4 }}>
          {["Fundacion Real Madrid", "British Council School", "International College Spain", "Club de Campo", "Hospital Nino Jesus"].map(name => (
            <span key={name} style={{ fontFamily: H, fontSize: 14, fontWeight: 700, color: NAVY }}>{name}</span>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ marginTop: 56, borderTop: "1px solid #E7E5E4", background: NAVY }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 20px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: H, fontWeight: 800, color: "white", fontSize: 15 }}>P</span>
                </div>
                <span style={{ fontFamily: H, fontSize: 14, fontWeight: 700, color: "white" }}>Padres en Madrid</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 240 }}>
                Tu guia familiar para vivir en Madrid. Newsletter + directorio verificado.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Directorio</h4>
              {CATEGORIES.map(c => <p key={c.name} style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 8px", cursor: "pointer" }}>{c.name}</p>)}
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Mas</h4>
              {["Eventos", "Blog", "Quienes somos", "Contacto", "Anunciate"].map(l => <p key={l} style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 8px", cursor: "pointer" }}>{l}</p>)}
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Newsletter</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, marginBottom: 12 }}>Cada viernes. Los mejores planes para familias.</p>
              <button style={{ padding: "8px 16px", borderRadius: 8, background: COPPER, border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: B }}>Suscribete gratis</button>
            </div>
          </div>
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            © 2026 Padres en Madrid. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      <style>{`@media(max-width:768px){.hidden-mobile{display:none!important}}`}</style>
    </div>
  );
}
