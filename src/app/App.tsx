import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, ShoppingCart, User, ChevronLeft, Plus, Minus,
  X, Eye, EyeOff, LogOut, ClipboardList, Check, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  image: string;
  hasIva: boolean;
  unit: string;
  stock: number;
  discount?: number;
}

interface CartItem { product: Product; quantity: number }

interface Order {
  id: string; date: string; items: CartItem[];
  subtotal: number; iva: number; total: number;
}

interface AppUser {
  cedula: string; name: string; address: string;
  phone: string; email: string; username: string; orders: Order[];
}

type View = "home" | "product" | "cart" | "auth" | "profile" | "payment" | "dashboard" | "dashboard-ventas" | "dashboard-admin";

// ─── Category Data ────────────────────────────────────────────────────────────

const MAIN_CATEGORIES = ["TODOS", "ROPA", "CALZADO", "TACONES", "ACCESORIOS", "OFERTAS"];

const SUBCATEGORIES: Record<string, string[]> = {
  ROPA:       ["CAMISETAS", "PANTALONES", "VESTIDOS"],
  CALZADO:    ["ZAPATOS HOMBRE", "ZAPATOS MUJER", "BOTAS"],
  TACONES:    ["TACONES ALTOS"],
  ACCESORIOS: ["BOLSOS", "BUFANDAS", "GORRAS"],
};

const IVA_RATE = 0.12;

// ─── Product Data (se carga desde API) ─────────────────────────────────────────

const PRODUCTS: Product[] = [];  // Se rellena desde la API

const DEMO_USER: AppUser = {
  cedula: "0912345678", name: "María García López",
  address: "Av. Amazonas N24-196, Quito", phone: "0987654321",
  email: "maria.garcia@email.com", username: "mariagarcia",
  orders: [
    {
      id: "FAC-2024-001", date: "2024-11-15",
      items: [{ product: PRODUCTS[0], quantity: 1 }, { product: PRODUCTS[11], quantity: 1 }],
      subtotal: 151.52, iva: 18.18, total: 169.70,
    },
    {
      id: "FAC-2024-002", date: "2025-01-22",
      items: [{ product: PRODUCTS[5], quantity: 1 }, { product: PRODUCTS[15], quantity: 1 }],
      subtotal: 340.25, iva: 40.83, total: 381.08,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function finalPrice(p: Product) {
  return p.discount ? p.price * (1 - p.discount / 100) : p.price;
}
function fmt(n: number) { return `$${n.toFixed(2)}`; }
const serif: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };
const sans: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({
  cartCount, user, activeCategory, activeSubcategory,
  setActiveCategory, setActiveSubcategory,
  onCart, onAuth, onProfile, onHome, onSearchOpen, onDashboard,
}: {
  cartCount: number; user: AppUser | null;
  activeCategory: string; activeSubcategory: string | null;
  setActiveCategory: (c: string) => void;
  setActiveSubcategory: (s: string | null) => void;
  onCart: () => void; onAuth: () => void;
  onProfile: () => void; onHome: () => void;
  onSearchOpen: () => void; onDashboard: () => void;
}) {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setHoveredCat(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const subcats = hoveredCat ? (SUBCATEGORIES[hoveredCat] ?? []) : [];

  return (
    <nav ref={navRef} className="sticky top-0 z-50 bg-white border-b border-border">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-3 items-center">
        <button onClick={onHome}>
          <span className="text-lg font-black tracking-[0.18em] uppercase" style={sans}>
            NOIRE STUDIO
          </span>
        </button>
        <div />
        <div className="justify-self-end flex items-center gap-0.5">
          <button onClick={onSearchOpen} className="p-2.5 hover:bg-muted rounded-lg transition-colors" aria-label="Buscar">
            <Search size={18} strokeWidth={1.75} />
          </button>
          <button onClick={onCart} className="relative p-2.5 hover:bg-muted rounded-lg transition-colors" aria-label="Carrito">
            <ShoppingCart size={18} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-foreground text-background text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
          <button onClick={onDashboard} className="p-2.5 hover:bg-muted rounded-lg transition-colors text-[10px] font-bold tracking-wider" aria-label="Dashboard">
            📊
          </button>
          <button onClick={user ? onProfile : onAuth} className="p-2.5 hover:bg-muted rounded-lg transition-colors" aria-label="Cuenta">
            <User size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Category bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {MAIN_CATEGORIES.map(cat => (
              <button
                key={cat}
                onMouseEnter={() => SUBCATEGORIES[cat] ? setHoveredCat(cat) : setHoveredCat(null)}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveSubcategory(null);
                  if (!SUBCATEGORIES[cat]) setHoveredCat(null);
                }}
                className={`relative flex-shrink-0 flex items-center gap-1 px-4 py-3 text-[11px] tracking-[0.2em] font-semibold transition-colors ${
                  activeCategory === cat ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
                {SUBCATEGORIES[cat] && <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform ${hoveredCat === cat ? "rotate-180" : ""}`} />}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subcategory dropdown */}
      {hoveredCat && subcats.length > 0 && (
        <div
          className="border-t border-border bg-white shadow-md"
          onMouseLeave={() => setHoveredCat(null)}
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-1 flex-wrap">
            <button
              onClick={() => { setActiveCategory(hoveredCat); setActiveSubcategory(null); setHoveredCat(null); }}
              className={`px-3 py-1.5 text-[10px] tracking-widest font-bold uppercase transition-colors ${
                activeCategory === hoveredCat && !activeSubcategory
                  ? "text-foreground underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              TODOS
            </button>
            {subcats.map(sub => (
              <button
                key={sub}
                onClick={() => { setActiveCategory(hoveredCat); setActiveSubcategory(sub); setHoveredCat(null); }}
                className={`px-3 py-1.5 text-[10px] tracking-widest font-semibold uppercase transition-colors ${
                  activeSubcategory === sub && activeCategory === hoveredCat
                    ? "text-foreground underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Search Overlay ───────────────────────────────────────────────────────────

function SearchOverlay({ open, onClose, onSelect, products }: {
  open: boolean; onClose: () => void; onSelect: (p: Product) => void; products: Product[];
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setQuery("");
  }, [open]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const results = query.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl bg-white shadow-2xl">
        <div className="flex items-center px-5 h-14 border-b border-border gap-3">
          <Search size={16} className="text-muted-foreground" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            placeholder="BUSCAR EN NOIRE STUDIO..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-xs font-semibold tracking-[0.2em] uppercase outline-none bg-transparent placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={17} />
          </button>
        </div>
        {results.length > 0 && (
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {results.map(p => (
              <li key={p.id}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted transition-colors text-left"
                  onClick={() => { onSelect(p); onClose(); }}
                >
                  <img src={p.image} alt={p.name} className="w-12 h-14 object-cover bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{p.category} · {p.subcategory}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black">{fmt(finalPrice(p))}</p>
                    {p.discount && <p className="text-[10px] text-muted-foreground line-through">{fmt(p.price)}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.length > 1 && results.length === 0 && (
          <div className="px-5 py-8 text-center text-xs text-muted-foreground tracking-widest uppercase">
            Sin resultados para &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────

function HeroBanner({ onShop }: { onShop: () => void }) {
  return (
    <section className="relative w-full h-[88vh] min-h-[520px] overflow-hidden bg-gray-900">
      <img
        src="https://images.unsplash.com/photo-1735480222193-3fe22ffd70b6?w=1800&h=1000&fit=crop&auto=format&q=85"
        alt="Noire Studio — Nueva Colección"
        className="absolute inset-0 w-full h-full object-cover object-top opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
      <div className="relative z-10 h-full flex items-end pb-20 px-8 sm:px-16 max-w-7xl mx-auto">
        <div className="max-w-xl">
          <p className="text-white/55 text-[10px] tracking-[0.5em] uppercase mb-4" style={sans}>
            Nueva Temporada 2025
          </p>
          <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-[1.05] mb-5" style={serif}>
            MODA QUE<br />DEFINE TU<br />ESENCIA.
          </h1>
          <p className="text-white/65 text-sm mb-8 leading-relaxed max-w-xs" style={sans}>
            Colecciones exclusivas para mujer, hombre y niños. Diseño atemporal, calidad excepcional.
          </p>
          <button
            onClick={onShop}
            className="inline-flex items-center gap-3 border border-white text-white text-[10px] tracking-[0.3em] uppercase font-bold px-8 py-4 hover:bg-white hover:text-black transition-all duration-300"
          >
            EXPLORAR COLECCIÓN
            <ChevronDown size={12} className="-rotate-90" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, onView, onAdd }: {
  product: Product; onView: () => void; onAdd: (e: React.MouseEvent) => void;
}) {
  const fp = finalPrice(product);
  return (
    <div className="group cursor-pointer" onClick={onView}>
      <div className="relative overflow-hidden bg-muted mb-3 aspect-[3/4]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.discount && (
          <span className="absolute top-3 left-3 bg-white text-foreground text-[9px] tracking-widest font-black px-2 py-1 uppercase">
            -{product.discount}%
          </span>
        )}
        <button
          onClick={onAdd}
          className="absolute bottom-3 right-3 bg-white text-foreground w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:bg-foreground hover:text-white"
          aria-label="Agregar al carrito"
        >
          <Plus size={15} strokeWidth={2} />
        </button>
        {product.stock <= 8 && (
          <span className="absolute top-3 right-3 bg-black/60 text-white text-[9px] tracking-wider uppercase px-2 py-1">
            Últimas {product.stock}
          </span>
        )}
      </div>
      <p className="text-[9px] text-muted-foreground tracking-[0.3em] uppercase mb-1">{product.subcategory}</p>
      <h3 className="text-sm font-semibold leading-tight mb-1.5">{product.name}</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">{fmt(fp)}</span>
        {product.discount && <span className="text-xs text-muted-foreground line-through">{fmt(product.price)}</span>}
      </div>
    </div>
  );
}

// ─── #LoNuevo Section ─────────────────────────────────────────────────────────

const LO_NUEVO_CARDS = [
  {
    category: "CALZADO",
    subcategory: "ZAPATOS MUJER",
    categoryLabel: "MUJER",
    label: "Nueva colección femenina",
    image: "https://images.unsplash.com/photo-1616847220575-31b062a4cd05?w=700&h=900&fit=crop&auto=format",
  },
  {
    category: "ACCESORIOS",
    subcategory: null,
    categoryLabel: "ACCESORIOS",
    label: "Bolsos & complementos",
    image: "https://images.unsplash.com/photo-1731589803020-998441ed4e3a?w=700&h=900&fit=crop&auto=format",
  },
  {
    category: "CALZADO",
    subcategory: null,
    categoryLabel: "CALZADO",
    label: "Calzado de temporada",
    image: "https://images.unsplash.com/photo-1692180142575-c31fcd106b5b?w=700&h=900&fit=crop&auto=format",
  },
];

function LoNuevoSection({ onCategory, onSubcategory }: { onCategory: (cat: string) => void; onSubcategory: (cat: string, sub: string) => void; }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid lg:grid-cols-5 gap-10 items-center">
        {/* Left — text */}
        <div className="lg:col-span-1 flex flex-col justify-center">
          <h2
            className="text-5xl lg:text-6xl font-black leading-none text-foreground mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            #Lo<br />Nuevo
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Las últimas incorporaciones a nuestra colección. Piezas seleccionadas con cuidado para esta temporada.
          </p>
        </div>

        {/* Right — 3 cards */}
        <div className="lg:col-span-4 grid grid-cols-3 gap-4">
          {LO_NUEVO_CARDS.map(card => (
            <div key={card.categoryLabel} className="relative overflow-hidden rounded-xl aspect-[3/4] bg-muted group cursor-pointer" onClick={() => card.subcategory ? onSubcategory(card.category, card.subcategory) : onCategory(card.category)}>
              {/* Image */}
              <img
                src={card.image}
                alt={card.category}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Dark gradient at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Bottom-left: category name */}
              <div className="absolute bottom-4 left-4 right-12">
                <p
                  className="text-white text-xs tracking-[0.25em] uppercase font-black leading-tight"
                  style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
                >
                  {card.categoryLabel}
                </p>
                <p
                  className="text-white/75 text-[10px] mt-0.5 leading-tight"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                >
                  {card.label}
                </p>
              </div>

              {/* Bottom-right: + circle */}
              <button
                onClick={e => { e.stopPropagation(); card.subcategory ? onSubcategory(card.category, card.subcategory) : onCategory(card.category); }}
                className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-md"
                aria-label={`Ver ${card.categoryLabel}`}
              >
                <Plus size={14} strokeWidth={2.5} className="text-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────

function HomeView({ products, activeCategory, activeSubcategory, showHero, onView, onAdd, onCategory, onSubcategory }: {
  products: Product[]; activeCategory: string; activeSubcategory: string | null;
  showHero: boolean; onView: (p: Product) => void; onAdd: (p: Product) => void;
  onCategory: (cat: string) => void; onSubcategory: (cat: string, sub: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  const sectionTitle =
    activeCategory === "TODOS" ? "COLECCIÓN COMPLETA" :
    activeSubcategory ? activeSubcategory.toUpperCase() :
    activeCategory;

  return (
    <div>
      {showHero && <HeroBanner onShop={() => gridRef.current?.scrollIntoView({ behavior: "smooth" })} />}

      {showHero && (
        <div className="bg-foreground text-background py-2.5 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase font-semibold">
            Envío gratuito en compras +$120 &nbsp;·&nbsp; Devoluciones en 30 días &nbsp;·&nbsp; Hasta 30% OFF en seleccionados
          </p>
        </div>
      )}

      {showHero && <LoNuevoSection onCategory={onCategory} onSubcategory={onSubcategory} />}

      <div className="max-w-7xl mx-auto px-6 py-14" ref={gridRef}>
        <div className="flex items-end justify-between mb-10 border-b border-border pb-6">
          <div>
            {activeCategory !== "TODOS" && (
              <p className="text-[9px] tracking-[0.45em] uppercase text-muted-foreground mb-2">{activeCategory}</p>
            )}
            <h2 className="text-3xl font-black uppercase tracking-tight" style={serif}>{sectionTitle}</h2>
          </div>
          <span className="text-xs text-muted-foreground pb-1 tracking-wider">{products.length} prendas</span>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <p className="text-xs font-semibold uppercase tracking-widest">Sin prendas disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {products.map(p => (
              <ProductCard key={p.id} product={p} onView={() => onView(p)} onAdd={e => { e.stopPropagation(); onAdd(p); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Detail ───────────────────────────────────────────────────────────

function ProductDetailView({ product, onBack, onAddToCart, user, onAuth }: {
  product: Product; onBack: () => void; onAddToCart: (p: Product, qty: number) => void;
  user: AppUser | null; onAuth: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [stockLocal, setStockLocal] = useState(product.stock);
  const [loading, setLoading] = useState(false);
  const fp = finalPrice(product);
  const priceWithIva = product.hasIva ? fp * (1 + IVA_RATE) : null;

  useEffect(() => {
    fetch(`http://localhost:5000/api/productos/tallas-disponibles/${product.id}`)
      .then(r => r.json())
      .then(tallas => setSizes(tallas.map(t => t.talla)))
      .catch(() => setSizes([]));
  }, [product.id]);

  async function handleComprarAhora() {
    if (!user) { onAuth(); return; }
    if (stockLocal < qty) { alert('Stock insuficiente'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/compra/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          cedula: user.cedula,
          codigoProducto: product.id,
          cantidad: qty,
          numeroTarjeta: '4111111111111111',
          mesVencimiento: '12',
          anioVencimiento: '25'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStockLocal(data.nuevoStock);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        alert(`✅ Compra exitosa!\nFactura: ${data.numeroFactura}\nTotal: $${data.total.toFixed(2)}`);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    onAddToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-[10px] tracking-widest uppercase font-semibold mb-10 transition-colors"
      >
        <ChevronLeft size={14} strokeWidth={2} /> Volver
      </button>

      <div className="grid md:grid-cols-2 gap-16">
        <div className="relative overflow-hidden bg-muted aspect-[3/4]">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          {product.discount && (
            <span className="absolute top-5 left-5 bg-white text-foreground text-[10px] tracking-widest font-black px-3 py-1.5 uppercase">
              -{product.discount}% OFF
            </span>
          )}
        </div>

        <div className="flex flex-col py-2">
          <p className="text-[9px] tracking-[0.45em] uppercase text-muted-foreground mb-1">{product.category} / {product.subcategory}</p>
          <h1 className="text-4xl font-black uppercase leading-tight mb-4" style={serif}>{product.name}</h1>
          <div className="w-10 h-px bg-border mb-6" />
          <p className="text-muted-foreground text-sm leading-relaxed mb-7">{product.description}</p>

          {/* Price */}
          <div className="mb-7">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-black">{fmt(fp)}</span>
              {product.discount && <span className="text-muted-foreground line-through text-lg pb-0.5">{fmt(product.price)}</span>}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="border border-border px-3 py-1 tracking-widest uppercase text-muted-foreground font-semibold">
                {product.hasIva ? "GRAVA IVA 12%" : "EXENTO DE IVA"}
              </span>
              {priceWithIva && (
                <span className="border border-border px-3 py-1 tracking-widest uppercase text-muted-foreground font-semibold">
                  CON IVA: {fmt(priceWithIva)}
                </span>
              )}
            </div>
          </div>

          {/* Size selector */}
          <div className="mb-7">
            <p className="text-[10px] tracking-widest uppercase font-bold mb-3">TALLA</p>
            <div className="flex gap-2 flex-wrap">
              {sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`w-11 h-11 text-xs font-bold border transition-all ${
                    selectedSize === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground hover:border-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            <div className="border border-border p-4">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Unidad</p>
              <p className="font-bold text-sm uppercase">{product.unit}</p>
            </div>
            <div className="border border-border p-4">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Stock</p>
              <p className={`font-bold text-sm ${stockLocal <= 8 ? "text-amber-600" : ""}`}>{stockLocal} disponibles</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-auto">
            <div className="flex items-center border border-border">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3.5 hover:bg-muted transition-colors">
                <Minus size={13} strokeWidth={2} />
              </button>
              <span className="w-10 text-center font-bold text-sm">{qty}</span>
              <button onClick={() => setQty(q => Math.min(stockLocal, q + 1))} className="px-4 py-3.5 hover:bg-muted transition-colors">
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>
            <button
              onClick={handleComprarAhora}
              disabled={loading || stockLocal === 0}
              className={`flex-1 py-4 border font-bold text-[10px] tracking-[0.3em] uppercase flex items-center justify-center gap-2 transition-all ${
                added ? "bg-foreground text-background border-foreground"
                      : stockLocal === 0 ? "border-border text-muted-foreground cursor-not-allowed"
                      : "border-foreground text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              {added ? <><Check size={13} strokeWidth={3} />COMPRADO</> : stockLocal === 0 ? <>SIN STOCK</> : <><ShoppingCart size={13} strokeWidth={1.75} />COMPRAR AHORA</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart View ────────────────────────────────────────────────────────────────

function CartView({ cart, user, onBack, onUpdate, onRemove, onConfirm, onAuth }: {
  cart: CartItem[]; user: AppUser | null; onBack: () => void;
  onUpdate: (id: number, qty: number) => void; onRemove: (id: number) => void;
  onConfirm: () => void; onAuth: () => void;
}) {
  const subtotal = cart.reduce((s, i) => s + finalPrice(i.product) * i.quantity, 0);
  const iva = cart.reduce((s, i) => i.product.hasIva ? s + finalPrice(i.product) * i.quantity * IVA_RATE : s, 0);
  const total = subtotal + iva;
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-[10px] tracking-widest uppercase font-semibold mb-10 transition-colors">
        <ChevronLeft size={14} strokeWidth={2} /> Continuar comprando
      </button>
      <h1 className="text-4xl font-black uppercase mb-10" style={serif}>
        CARRITO
        {count > 0 && <span className="text-muted-foreground font-normal text-xl ml-3 tracking-normal" style={sans}>({count})</span>}
      </h1>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground border border-border">
          <ShoppingCart size={40} className="opacity-20 mb-5" strokeWidth={1} />
          <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-1">Carrito vacío</p>
          <p className="text-xs mb-6">Descubre nuestras colecciones</p>
          <button onClick={onBack} className="border border-foreground text-foreground text-[10px] tracking-widest uppercase font-bold px-8 py-3 hover:bg-foreground hover:text-background transition-all">
            VER COLECCIÓN
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 divide-y divide-border border-t border-b border-border">
            {cart.map(item => {
              const fp = finalPrice(item.product);
              return (
                <div key={item.product.id} className="flex gap-5 py-6">
                  <img src={item.product.image} alt={item.product.name} className="w-20 h-24 object-cover bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-[9px] tracking-widest uppercase text-muted-foreground">{item.product.subcategory}</p>
                        <p className="font-semibold text-sm mt-0.5">{item.product.name}</p>
                      </div>
                      <button onClick={() => onRemove(item.product.id)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                        <X size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                    <p className="text-sm font-black mt-2">{fmt(fp * item.quantity)}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-border">
                        <button onClick={() => onUpdate(item.product.id, item.quantity - 1)} className="px-3 py-1.5 hover:bg-muted transition-colors">
                          <Minus size={11} strokeWidth={2} />
                        </button>
                        <span className="px-3 text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => onUpdate(item.product.id, Math.min(item.product.stock, item.quantity + 1))} className="px-3 py-1.5 hover:bg-muted transition-colors">
                          <Plus size={11} strokeWidth={2} />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">{fmt(fp)} / {item.product.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            <div className="border border-border p-7">
              <p className="text-[10px] tracking-[0.3em] uppercase font-black mb-6">RESUMEN DEL PEDIDO</p>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (12%)</span>
                  <span className="font-semibold">{fmt(iva)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="font-black text-[10px] tracking-widest uppercase">TOTAL</span>
                  <span className="font-black text-xl">{fmt(total)}</span>
                </div>
              </div>
              <button onClick={onConfirm} className="w-full border border-foreground bg-foreground text-background py-4 text-[10px] tracking-[0.3em] uppercase font-black hover:bg-transparent hover:text-foreground transition-all">
                CONFIRMAR PEDIDO
              </button>
              {!user && (
                <p className="text-[10px] text-muted-foreground text-center mt-4 tracking-wide">
                  Debes <button onClick={onAuth} className="underline font-semibold hover:text-foreground">iniciar sesión</button> para confirmar
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Auth View ────────────────────────────────────────────────────────────────

function AuthView({ mode, setMode, onLogin, onRegister, error, setError }: {
  mode: "login" | "register"; setMode: (m: "login" | "register") => void;
  onLogin: (u: string, p: string) => void;
  onRegister: (d: { cedula: string; name: string; address: string; phone: string; email: string; username: string; password: string }) => void;
  error: string; setError: (e: string) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [reg, setReg] = useState({ cedula: "", name: "", address: "", phone: "", email: "", username: "", password: "" });

  const regFields: { key: keyof typeof reg; label: string; placeholder: string; type?: string }[] = [
    { key: "cedula", label: "CÉDULA / RUC", placeholder: "0912345678" },
    { key: "name", label: "NOMBRE COMPLETO", placeholder: "María García López" },
    { key: "address", label: "DIRECCIÓN", placeholder: "Av. Principal 123" },
    { key: "phone", label: "TELÉFONO", placeholder: "0987654321" },
    { key: "email", label: "CORREO", placeholder: "tu@email.com", type: "email" },
    { key: "username", label: "USUARIO", placeholder: "usuario123" },
    { key: "password", label: "CONTRASEÑA", placeholder: "Mínimo 6 caracteres", type: "password" },
  ];

  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="text-[9px] tracking-[0.5em] uppercase text-muted-foreground mb-3">
          {mode === "login" ? "Cuenta existente" : "Nueva cuenta"}
        </p>
        <h1 className="text-4xl font-black uppercase mb-8" style={serif}>
          {mode === "login" ? "BIENVENIDA" : "REGISTRARSE"}
        </h1>

        {error && (
          <div className="border border-destructive/30 bg-destructive/5 text-destructive text-xs tracking-wide px-4 py-3 mb-6 font-semibold">
            {error}
          </div>
        )}

        {mode === "login" ? (
          <div className="space-y-5">
            {([
              { key: "username" as const, label: "USUARIO", type: "text", placeholder: "Tu usuario" },
              { key: "password" as const, label: "CONTRASEÑA", type: "password", placeholder: "Tu contraseña" },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="text-[10px] tracking-widest uppercase font-bold block mb-2">{f.label}</label>
                <div className="relative">
                  <input
                    type={f.type === "password" ? (showPw ? "text" : "password") : f.type}
                    placeholder={f.placeholder}
                    value={login[f.key]}
                    onChange={e => setLogin(d => ({ ...d, [f.key]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && onLogin(login.username, login.password)}
                    className="w-full border border-border bg-transparent px-4 py-3.5 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
                  />
                  {f.type === "password" && (
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={() => onLogin(login.username, login.password)} className="w-full bg-foreground text-background py-4 text-[10px] tracking-[0.3em] uppercase font-black hover:bg-transparent hover:text-foreground border border-foreground transition-all mt-2">
              INGRESAR
            </button>
            <div className="border border-border p-3 text-[10px] text-center text-muted-foreground tracking-wider">
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {regFields.map(f => (
              <div key={f.key}>
                <label className="text-[10px] tracking-widest uppercase font-bold block mb-1.5">{f.label}</label>
                <div className="relative">
                  <input
                    type={f.type === "password" ? (showPw ? "text" : "password") : (f.type || "text")}
                    placeholder={f.placeholder}
                    value={reg[f.key]}
                    onChange={e => setReg(d => ({ ...d, [f.key]: e.target.value }))}
                    className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
                  />
                  {f.type === "password" && (
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={() => onRegister(reg)} className="w-full bg-foreground text-background py-4 text-[10px] tracking-[0.3em] uppercase font-black hover:bg-transparent hover:text-foreground border border-foreground transition-all mt-2">
              CREAR CUENTA
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border text-[10px] text-muted-foreground text-center tracking-wider">
          {mode === "login" ? (
            <>¿No tienes cuenta? <button onClick={() => { setMode("register"); setError(""); }} className="font-black text-foreground hover:underline">REGÍSTRATE</button></>
          ) : (
            <>¿Ya tienes cuenta? <button onClick={() => { setMode("login"); setError(""); }} className="font-black text-foreground hover:underline">INICIA SESIÓN</button></>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView({ user, onLogout, onShop, onLoadOrders }: {
  user: AppUser | null; onLogout: () => void; onShop: () => void; onLoadOrders: () => void;
}) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (user) onLoadOrders();
  }, [user?.cedula]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground px-6">
      <p className="text-[10px] tracking-[0.35em] uppercase font-black text-foreground mb-3">ACCESO REQUERIDO</p>
      <p className="text-sm mb-8">Inicia sesión para ver tu perfil</p>
      <button onClick={onShop} className="border border-foreground text-foreground text-[10px] tracking-widest uppercase font-bold px-8 py-3 hover:bg-foreground hover:text-background transition-all">IR A LA TIENDA</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[9px] tracking-[0.45em] uppercase text-muted-foreground mb-2">Mi cuenta</p>
          <h1 className="text-4xl font-black uppercase" style={serif}>PERFIL</h1>
        </div>
        <button onClick={onLogout} className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground hover:text-foreground transition-colors pb-1">
          <LogOut size={13} strokeWidth={1.75} /> CERRAR SESIÓN
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2 border border-border p-6">
          <p className="text-[10px] tracking-widest uppercase font-black mb-5">DATOS PERSONALES</p>
          <div className="space-y-5">
            {[
              { label: "NOMBRE", value: user.name },
              { label: "CÉDULA / RUC", value: user.cedula },
              { label: "CORREO", value: user.email || "—" },
              { label: "TELÉFONO", value: user.phone || "—" },
              { label: "DIRECCIÓN", value: user.address || "—" },
            ].map(row => (
              <div key={row.label}>
                <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-0.5">{row.label}</p>
                <p className="text-sm font-semibold">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[10px] tracking-widest uppercase font-black">HISTORIAL DE FACTURAS</p>
            <span className="border border-border text-[10px] font-black px-2 py-0.5 tracking-wider">{user.orders.length}</span>
          </div>

          {user.orders.length === 0 ? (
            <div className="border border-border p-10 text-center text-muted-foreground">
              <ClipboardList size={32} className="mx-auto opacity-20 mb-3" strokeWidth={1} />
              <p className="text-[10px] tracking-widest uppercase font-semibold">Sin facturas aún</p>
              <button onClick={onShop} className="text-[10px] font-black underline mt-3 hover:text-foreground tracking-widest uppercase">Realizar primera compra</button>
            </div>
          ) : (
            <div className="divide-y divide-border border-t border-b border-border">
              {[...user.orders].reverse().map(order => (
                <div key={order.id}>
                  <button
                    className="w-full flex items-center justify-between py-5 hover:bg-muted/40 transition-colors px-1"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="text-left">
                      <p className="text-xs font-black tracking-wider">{order.id}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{order.date} · {order.items.length} prenda(s)</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-sm">{fmt(order.total)}</p>
                        <p className="text-[10px] text-muted-foreground">sin IVA: {fmt(order.subtotal)}</p>
                      </div>
                      <ChevronDown size={13} className={`text-muted-foreground transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} strokeWidth={2} />
                    </div>
                  </button>
                  {expandedOrder === order.id && (
                    <div className="pb-5 px-1 space-y-3 bg-muted/20">
                      {order.items.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between pt-3">
                          <div className="flex items-center gap-3">
                            <img src={item.product.image} alt={item.product.name} className="w-12 h-14 object-cover bg-muted flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold">{item.product.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">× {item.quantity} · {item.product.subcategory}</p>
                            </div>
                          </div>
                          <span className="font-black text-xs">{fmt(finalPrice(item.product) * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs pt-3 border-t border-border">
                        <span className="text-muted-foreground">IVA incluido</span>
                        <span className="font-black">{fmt(order.iva)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_COLS = [
  {
    title: "CONTACTO",
    links: ["Servicio al Cliente", "Encuentra tu tienda"],
  },
  {
    title: "TUS PEDIDOS",
    links: ["Pedidos", "Envíos a Domicilio", "Devoluciones y Cambios"],
  },
  {
    title: "INFORMACIÓN DEL PRODUCTO",
    links: ["Guía de tallas"],
  },
  {
    title: "ACERCA DE NOIRE STUDIO",
    links: ["Términos y Condiciones", "Política de privacidad", "Políticas de cookies"],
  },
];

const PAYMENT_METHODS = [
  {
    name: "VISA",
    content: (
      <span className="text-[#1A1F71] font-black text-sm tracking-tight italic">VISA</span>
    ),
  },
  {
    name: "Mastercard",
    content: (
      <span className="flex items-center gap-0.5">
        <span className="w-5 h-5 rounded-full bg-[#EB001B] opacity-90" />
        <span className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90 -ml-2.5" />
      </span>
    ),
  },
  {
    name: "American Express",
    content: (
      <span className="text-[#007BC1] font-black text-[9px] tracking-tight leading-none text-center">
        AMERICAN<br />EXPRESS
      </span>
    ),
  },
  {
    name: "Diners",
    content: (
      <span className="text-[#004B87] font-black text-[10px] tracking-tight leading-none text-center">
        DINERS<br />CLUB
      </span>
    ),
  },
  {
    name: "Discover",
    content: (
      <span className="flex flex-col items-center leading-none">
        <span className="text-[#231F20] font-black text-[9px] tracking-tight">DISCOVER</span>
        <span className="w-3 h-1 rounded-full bg-[#F76F20] mt-0.5" />
      </span>
    ),
  },
];

function Footer() {
  return (
    <footer className="bg-[#F5F5F5] mt-16" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Dark blue top border */}
      <div className="h-1 bg-[#1B2D5B]" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <p
                className="text-[11px] font-black uppercase tracking-widest text-foreground mb-4"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <button className="text-[#1B4FAD] text-sm hover:underline underline-offset-2 text-left transition-colors hover:text-[#0F3580]">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-8" />

        {/* Payment methods */}
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground mr-2">
            ACEPTAMOS:
          </p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map(method => (
              <div
                key={method.name}
                className="bg-white border border-border rounded px-3 h-9 flex items-center justify-center shadow-sm min-w-[56px]"
                title={method.name}
              >
                {method.content}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-foreground">
            NOIRE STUDIO
          </span>
          <p className="text-[10px] text-muted-foreground tracking-wider">
            © {new Date().getFullYear()} Noire Studio. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [activeCategory, setActiveCategory] = useState("TODOS");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ cardNum: '', month: '', year: '', cvv: '' });
  const [selectedProductForPayment, setSelectedProductForPayment] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [purchaseConfirmation, setPurchaseConfirmation] = useState<any>(null);

  // Cargar productos desde la API
  useEffect(() => {
    fetch("http://localhost:5000/api/productos")
      .then(res => res.json())
      .then(data => {
        const mapped = data.productos.map((p: any) => ({
          id: p.codigoProducto,
          name: p.nombre,
          description: p.descripcion || "Producto NOIRE Studio",
          price: parseFloat(p.precio),
          category: p.categoria,
          subcategory: p.subcategoria,
          image: p.imagenUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=800&fit=crop",
          hasIva: p.tieneIva === 1,
          unit: p.unidad,
          stock: p.stockActual,
          discount: p.descuento || 0,
        }));
        setProducts(mapped);
      })
      .catch(err => console.error("Error cargando productos:", err));
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "OFERTAS") return products.filter(p => !!p.discount);
    return products.filter(p => {
      const matchCat = activeCategory === "TODOS" || p.category === activeCategory;
      const matchSub = !activeSubcategory || p.subcategory === activeSubcategory;
      return matchCat && matchSub;
    });
  }, [activeCategory, activeSubcategory, products]);

  async function addToCart(product: Product, qty = 1) {
    if (!user) { setAuthMode("login"); setView("auth"); return; }
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/carrito/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cedula: user.cedula, codigoProducto: product.id, cantidad: qty, talla: null })
      });
      setCart(prev => {
        const found = prev.find(i => i.product.id === product.id);
        if (found) return prev.map(i => i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) } : i);
        return [...prev, { product, quantity: qty }];
      });
    } catch (err) {
      console.error('Error agregando al carrito:', err);
    }
  }

  async function handleLogin(username: string, password: string) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Error de login');
        return;
      }
      localStorage.setItem('token', data.token);
      setUser({
        cedula: data.usuario.cedula,
        name: data.usuario.nombre || 'Usuario',
        address: data.usuario.direccion || '',
        phone: data.usuario.telefono || '',
        email: data.usuario.email || '',
        username: username,
        orders: []
      });
      setAuthError("");
      setView("home");
    } catch (err) {
      setAuthError('Error de conexión: ' + (err as Error).message);
    }
  }

  async function handleRegister(data: { cedula: string; name: string; address: string; phone: string; email: string; username: string; password: string }) {
    if (!data.cedula || !data.name || !data.username || !data.password) {
      setAuthError("Completa todos los campos requeridos"); return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: data.cedula, nombre: data.name, email: data.email, telefono: data.phone, direccion: data.address, ciudad: 'QUITO', usuario: data.username, password: data.password })
      });
      const result = await response.json();
      if (!response.ok) {
        setAuthError(result.error || 'Error en registro');
        return;
      }
      setAuthError("Registro exitoso. Ingresa para continuar.");
      setAuthMode("login");
    } catch (err) {
      setAuthError('Error de conexión: ' + (err as Error).message);
    }
  }

  async function handleConfirmOrder() {
    if (!user || cart.length === 0) { alert('Carrito vacío'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/pedidos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cedula: user.cedula })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setCurrentOrder({ numeroFactura: data.numeroFactura, subtotal: data.subtotal, iva: data.iva, total: data.total });
      setView("payment");
      setCart([]);
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  }

  function abrirModalPago(product: Product, qty: number, stock: number) {
    setSelectedProductForPayment({ product, qty, stockLocal: stock });
    setShowPaymentModal(true);
  }

  function DashboardMenu() {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black mb-10" style={serif}>DASHBOARDS</h1>
        <div className="grid grid-cols-2 gap-6">
          <button onClick={() => setView("dashboard-ventas")} className="border-2 border-foreground p-12 hover:bg-foreground hover:text-background transition-all">
            <p className="text-2xl font-black mb-2">📈</p>
            <p className="font-bold">DASHBOARD VENTAS</p>
            <p className="text-xs text-muted-foreground">Ingresos, pedidos, productos</p>
          </button>
          <button onClick={() => setView("dashboard-admin")} className="border-2 border-foreground p-12 hover:bg-foreground hover:text-background transition-all">
            <p className="text-2xl font-black mb-2">⚙️</p>
            <p className="font-bold">DASHBOARD ADMIN</p>
            <p className="text-xs text-muted-foreground">Clientes, pedidos, stock</p>
          </button>
        </div>
        <button onClick={() => setView("home")} className="mt-6 border border-foreground px-6 py-2 font-bold text-xs tracking-widest uppercase">VOLVER</button>
      </div>
    );
  }

  function DashboardVentas() {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState("");
    useEffect(() => {
      fetch('http://localhost:5000/api/dashboard/ventas')
        .then(r => r.json())
        .then(data => { console.log('Ventas data:', data); setStats(data); })
        .catch(err => { console.error('Error:', err); setError(err.message); });
    }, []);
    if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;
    if (!stats) return <div className="p-10 text-center">Cargando...</div>;
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black mb-10" style={serif}>DASHBOARD VENTAS</h1>
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="border border-border p-6"><p className="text-muted-foreground">TOTAL VENDIDO</p><p className="text-3xl font-black">${stats.totalVendido?.toFixed(2) || '0.00'}</p></div>
          <div className="border border-border p-6"><p className="text-muted-foreground">PEDIDOS</p><p className="text-3xl font-black">{stats.totalPedidos || 0}</p></div>
        </div>
        <div className="border border-border p-6 mb-6">
          <p className="font-black mb-4">TOP 5 PRODUCTOS</p>
          {stats.productosMasVendidos && stats.productosMasVendidos.length > 0 ? (
            <div className="space-y-2">
              {stats.productosMasVendidos.map((p: any) => (
                <div key={p.codigo} className="flex justify-between text-sm border-b pb-2">
                  <span>{p.nombre}</span><span>{p.cantidad} vendidas</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground">Sin datos</p>}
        </div>
        <button onClick={() => setView("home")} className="border border-foreground px-6 py-2 font-bold text-xs tracking-widest uppercase">VOLVER</button>
      </div>
    );
  }

  function DashboardAdmin() {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState("");
    useEffect(() => {
      fetch('http://localhost:5000/api/dashboard/admin')
        .then(r => r.json())
        .then(data => { console.log('Admin data:', data); setStats(data); })
        .catch(err => { console.error('Error:', err); setError(err.message); });
    }, []);
    if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;
    if (!stats) return <div className="p-10 text-center">Cargando...</div>;
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black mb-10" style={serif}>DASHBOARD ADMIN</h1>
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="border border-border p-6"><p className="text-muted-foreground">CLIENTES</p><p className="text-3xl font-black">{stats.totalClientes || 0}</p></div>
          <div className="border border-border p-6"><p className="text-muted-foreground">PEDIDOS</p><p className="text-3xl font-black">{stats.totalPedidos || 0}</p></div>
          <div className="border border-border p-6"><p className="text-muted-foreground">STOCK</p><p className="text-3xl font-black">{stats.totalStock || 0}</p></div>
        </div>
        <div className="border border-border p-6">
          <p className="font-black mb-4">ÚLTIMOS PEDIDOS</p>
          {stats.pedidos && stats.pedidos.length > 0 ? (
            <div className="divide-y max-h-96 overflow-y-auto">
              {stats.pedidos.map((p: any) => (
                <div key={p.numeroFactura} className="py-3 text-sm">
                  <div className="flex justify-between"><span className="font-bold">{p.numeroFactura}</span><span>${p.total?.toFixed(2) || '0.00'}</span></div>
                  <div className="text-muted-foreground text-xs">{p.cliente} • {p.items} items • {p.estado}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground">Sin pedidos</p>}
        </div>
        <button onClick={() => setView("home")} className="border border-foreground px-6 py-2 font-bold text-xs tracking-widest uppercase mt-6">VOLVER</button>
      </div>
    );
  }

  async function cargarPedidosUsuario() {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/pedidos/${user.cedula}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.pedidos) {
        const ordersFormateadas = data.pedidos.map((p: any) => ({
          id: p.numeroFactura,
          date: new Date(p.fechaPedido).toLocaleDateString('es-ES'),
          items: [],
          subtotal: p.subtotal,
          iva: p.iva,
          total: p.total
        }));
        setUser({...user, orders: ordersFormateadas});
      }
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    }
  }

  async function procesarPagoCompleto(cardNum: string, month: string, year: string) {
    if (!user || !selectedProductForPayment) return;
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { product, qty } = selectedProductForPayment;

      // 1. Agregar al carrito
      await fetch('http://localhost:5000/api/carrito/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cedula: user.cedula, codigoProducto: product.id, cantidad: qty, talla: null })
      });

      // 2. Crear pedido
      const pedidoRes = await fetch('http://localhost:5000/api/pedidos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cedula: user.cedula })
      });
      const pedidoData = await pedidoRes.json();
      if (!pedidoRes.ok) { alert(pedidoData.error); setPaymentLoading(false); return; }

      // 3. Procesar pago
      const pagoRes = await fetch('http://localhost:5000/api/pagos/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          numeroFactura: pedidoData.numeroFactura,
          cedula: user.cedula,
          monto: pedidoData.total,
          tipoPago: 'TARJETA_CREDITO',
          numeroTarjeta: cardNum,
          banco: 'BANCO_GENERAL',
          mesVencimiento: month,
          anioVencimiento: year
        })
      });
      const pagoData = await pagoRes.json();
      if (!pagoRes.ok) { alert(pagoData.error); setPaymentLoading(false); return; }

      // Mostrar confirmación
      setPurchaseConfirmation({
        numeroFactura: pedidoData.numeroFactura,
        producto: product.name,
        cantidad: qty,
        precio: product.price,
        subtotal: pedidoData.subtotal,
        iva: pedidoData.iva,
        total: pedidoData.total,
        tarjeta: '****' + cardNum.slice(-4),
        estado: 'PAGADO'
      });

      setShowPaymentModal(false);
      setPaymentData({ cardNum: '', month: '', year: '', cvv: '' });
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function procesarPago(cardNum: string, month: string, year: string) {
    if (!user || !currentOrder) return;
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/pagos/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ numeroFactura: currentOrder.numeroFactura, cedula: user.cedula, monto: currentOrder.total, tipoPago: 'TARJETA_CREDITO', numeroTarjeta: cardNum, banco: 'BANCO', mesVencimiento: month, anioVencimiento: year })
    });
    const data = await res.json();
    if (res.ok) { alert('Pago exitoso'); setView("profile"); setCurrentOrder(null); } else { alert(data.error); }
  }

  return (
    <div className="min-h-screen bg-background" style={sans}>
      <Navbar
        cartCount={cartCount} user={user}
        activeCategory={activeCategory} activeSubcategory={activeSubcategory}
        setActiveCategory={c => { setActiveCategory(c); setActiveSubcategory(null); setView("home"); }}
        setActiveSubcategory={s => { setActiveSubcategory(s); setView("home"); }}
        onCart={() => setView("cart")}
        onAuth={() => { setAuthMode("login"); setView("auth"); }}
        onProfile={() => setView("profile")}
        onHome={() => { setView("home"); setActiveCategory("TODOS"); setActiveSubcategory(null); }}
        onSearchOpen={() => setSearchOpen(true)}
        onDashboard={() => setView("dashboard")}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={p => { setSelectedProduct(p); setView("product"); }}
        products={products}
      />

      {orderSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-8 py-4 text-[10px] tracking-[0.3em] uppercase font-black shadow-2xl flex items-center gap-3">
          <Check size={13} strokeWidth={3} /> PEDIDO CONFIRMADO
        </div>
      )}

      <main>
        {view === "home" && (
          <HomeView
            products={filteredProducts}
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            showHero={activeCategory === "TODOS"}
            onView={p => { setSelectedProduct(p); setView("product"); }}
            onAdd={addToCart}
            onCategory={cat => { setActiveCategory(cat); setActiveSubcategory(null); }}
            onSubcategory={(cat, sub) => { setActiveCategory(cat); setActiveSubcategory(sub); }}
          />
        )}
        {view === "product" && selectedProduct && (
          <ProductDetailView product={selectedProduct} onBack={() => setView("home")} onAddToCart={addToCart} user={user} onAuth={() => { setAuthMode("login"); setView("auth"); }} />
        )}
        {view === "cart" && (
          <CartView cart={cart} user={user} onBack={() => setView("home")}
            onUpdate={(id, qty) => { if (qty <= 0) setCart(prev => prev.filter(i => i.product.id !== id)); else setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i)); }}
            onRemove={id => setCart(prev => prev.filter(i => i.product.id !== id))}
            onConfirm={handleConfirmOrder}
            onAuth={() => { setAuthMode("login"); setView("auth"); }}
          />
        )}
        {view === "auth" && (
          <AuthView mode={authMode} setMode={setAuthMode} onLogin={handleLogin} onRegister={handleRegister} error={authError} setError={setAuthError} />
        )}
        {view === "profile" && (
          <ProfileView user={user} onLogout={() => { setUser(null); setView("home"); }} onShop={() => setView("home")} onLoadOrders={cargarPedidosUsuario} />
        )}
        {view === "dashboard" && <DashboardMenu />}
        {view === "dashboard-ventas" && <DashboardVentas />}
        {view === "dashboard-admin" && <DashboardAdmin />}
        {view === "payment" && currentOrder && user && (
          <div className="max-w-2xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-black mb-8">CONFIRMAR PAGO</h1>
            <div className="border border-border p-6 mb-8">
              <p className="mb-2"><strong>Factura:</strong> {currentOrder.numeroFactura}</p>
              <p className="mb-2"><strong>Subtotal:</strong> ${currentOrder.subtotal.toFixed(2)}</p>
              <p className="mb-2"><strong>IVA:</strong> ${currentOrder.iva.toFixed(2)}</p>
              <p className="text-lg font-bold"><strong>Total:</strong> ${currentOrder.total.toFixed(2)}</p>
            </div>
            <div className="border border-border p-6">
              <h2 className="font-bold mb-4">DATOS DE TARJETA</h2>
              <input type="text" placeholder="Número de tarjeta" className="w-full border border-border p-2 mb-4" id="cardNum" />
              <input type="text" placeholder="Mes (MM)" className="w-1/3 border border-border p-2 mb-4 mr-2" id="month" />
              <input type="text" placeholder="Año (YYYY)" className="w-1/3 border border-border p-2 mb-4 mr-2" id="year" />
              <input type="text" placeholder="CVV" className="w-1/3 border border-border p-2 mb-4" id="cvv" />
              <button onClick={() => {
                const cardNum = (document.getElementById("cardNum") as HTMLInputElement).value;
                const month = (document.getElementById("month") as HTMLInputElement).value;
                const year = (document.getElementById("year") as HTMLInputElement).value;
                procesarPago(cardNum, month, year);
              }} className="w-full bg-foreground text-background p-3 font-bold text-sm tracking-widest uppercase">PAGAR</button>
              <button onClick={() => setView("cart")} className="w-full border border-border p-3 mt-2 font-bold text-sm tracking-widest uppercase">CANCELAR</button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
