import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from "@/components/Modal";
import {
  Package,
  Search,
  Crown,
  MapPin,
  Clock,
  Truck,
  X,
  Image as ImageIcon,
  Eye,
  Sparkles,
} from "lucide-react";

function ProductsPage() {
  return (
    <DashboardLayout currentPath="/dashboard/produk">
      {({ profile }) => <Inner profile={profile} />}
    </DashboardLayout>
  );
}

function Inner({ profile }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVip, setFilterVip] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailFull, setDetailFull] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadProducts = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openDetail = async (p) => {
    setDetail(p);
    setDetailFull(null);
    try {
      const r = await fetch(`/api/products/${p.id}`);
      const d = await r.json();
      if (r.ok) setDetailFull(d);
    } catch (e) {}
  };

  const fmt = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

  const filtered = products.filter((p) => {
    if (filterVip === "vip" && !p.is_vip_only) return false;
    if (filterVip === "normal" && p.is_vip_only) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Katalog Produk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pilih produk untuk dijual.{" "}
            {!profile.vip_status && (
              <span className="text-amber-600 font-medium">
                Upgrade VIP untuk akses produk premium.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          {profile.vip_status && (
            <select
              value={filterVip}
              onChange={(e) => setFilterVip(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none"
            >
              <option value="">Semua</option>
              <option value="vip">VIP Only</option>
              <option value="normal">Reguler</option>
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => openDetail(p)}
              isVip={profile.vip_status}
              fmt={fmt}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name}
        size="xl"
      >
        {detail && (
          <ProductDetail
            product={detail}
            full={detailFull}
            fmt={fmt}
            isVip={profile.vip_status}
          />
        )}
      </Modal>
    </div>
  );
}

function ProductCard({ product, onClick, isVip, fmt }) {
  const margin =
    Number(product.recommended_price) - Number(product.supplier_price);
  const marginPct =
    product.supplier_price > 0
      ? Math.round((margin / product.supplier_price) * 100)
      : 0;
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="relative aspect-square bg-slate-100">
        {product.main_image ? (
          <img
            src={product.main_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_vip_only && (
            <span className="text-[10px] inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold px-2 py-0.5 rounded-md shadow">
              <Crown className="w-3 h-3" /> VIP
            </span>
          )}
          {product.is_premium && (
            <span className="text-[10px] inline-flex items-center gap-0.5 bg-purple-500 text-white font-bold px-2 py-0.5 rounded-md shadow">
              <Sparkles className="w-3 h-3" /> Premium
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700">
          Stok: {product.stock}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs text-emerald-600 font-semibold mb-1">
          {product.category_name || "Produk"}
        </p>
        <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 mb-2 min-h-[40px]">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-1.5 mb-1">
          {product.supplier_price_strike && (
            <p className="text-[10px] line-through text-slate-400">
              {fmt(product.supplier_price_strike)}
            </p>
          )}
        </div>
        <p className="text-base font-bold text-slate-900">
          {fmt(product.supplier_price)}
        </p>
        <p className="text-xs text-emerald-600 font-semibold mt-0.5">
          Rekomendasi: {fmt(product.recommended_price)}
        </p>
        {margin > 0 && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            Margin:{" "}
            <span className="font-semibold text-emerald-600">
              {fmt(margin)} ({marginPct}%)
            </span>
          </p>
        )}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />{" "}
            {product.warehouse_name || "—"}
          </span>
          {product.aggregator_logo ? (
            <img src={product.aggregator_logo} alt="" className="h-4" />
          ) : (
            product.aggregator_name && (
              <span className="text-emerald-600 font-semibold">
                {product.aggregator_name}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, full, fmt, isVip }) {
  const [activeImg, setActiveImg] = useState(0);
  const images = [product.main_image, ...(product.images || [])].filter(
    Boolean,
  );
  const variants = full?.variants || [];
  const expeditions = full?.expeditions || [];
  const margin =
    Number(product.recommended_price) - Number(product.supplier_price);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-3">
          {images[activeImg] ? (
            <img
              src={images[activeImg]}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-slate-300" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 ${activeImg === i ? "border-emerald-500" : "border-transparent"}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-emerald-600 uppercase">
            {product.category_name || "Produk"}
          </p>
          {product.is_vip_only && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              <Crown className="w-3 h-3" /> VIP
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          {product.name}
        </h2>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">Harga Supplier</p>
              {product.supplier_price_strike && (
                <p className="text-xs line-through text-slate-400">
                  {fmt(product.supplier_price_strike)}
                </p>
              )}
              <p className="text-lg font-bold text-slate-900">
                {fmt(product.supplier_price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-emerald-700">Rekomendasi Jual</p>
              <p className="text-lg font-bold text-emerald-700">
                {fmt(product.recommended_price)}
              </p>
            </div>
          </div>
          {margin > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">Margin Profit</span>
              <span className="text-sm font-bold text-emerald-700">
                {fmt(margin)}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {product.description || "—"}
        </p>

        <div className="space-y-2 text-sm mb-4">
          <Row label="Gudang">
            <span>{product.warehouse_name || "—"}</span>
          </Row>
          <Row label="Pickup Time">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />{" "}
              {product.warehouse_pickup || "—"}
            </span>
          </Row>
          <Row label="Aggregator">
            {product.aggregator_logo ? (
              <img src={product.aggregator_logo} alt="" className="h-5" />
            ) : (
              <span>{product.aggregator_name || "—"}</span>
            )}
          </Row>
          <Row label="Stok">
            <span>{product.stock}</span>
          </Row>
          <Row label="Berat">
            <span>{product.weight}g</span>
          </Row>
        </div>

        {variants.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Varian Tersedia
            </p>
            <div className="grid grid-cols-2 gap-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-emerald-600 font-bold">{fmt(v.price)}</p>
                  <p className="text-slate-400">Stok: {v.stock}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {expeditions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Ekspedisi Tersedia
            </p>
            <div className="flex flex-wrap gap-2">
              {expeditions.map((e) => (
                <div
                  key={e.id}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1 text-xs"
                >
                  {e.logo ? (
                    <img src={e.logo} alt="" className="h-4" />
                  ) : (
                    <Truck className="w-3 h-3" />
                  )}
                  <span className="font-semibold">{e.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(product.marketing_kit_url || product.landing_page_url) && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {product.marketing_kit_url && (
              <a
                href={product.marketing_kit_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-2 rounded-lg text-center"
              >
                📦 Marketing Kit
              </a>
            )}
            {product.landing_page_url && (
              <a
                href={product.landing_page_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-purple-50 text-purple-700 font-semibold px-3 py-2 rounded-lg text-center"
              >
                🌐 Landing Page
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {product.is_vip_only && isVip && (
            <a
              href={`/dashboard/internal-cod?product_id=${product.id}`}
              className="bg-amber-500 text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-amber-600"
            >
              <Crown className="inline w-4 h-4 mr-1" /> Internal COD
            </a>
          )}
          {!product.is_vip_only && (
            <a
              href={`/dashboard/external?product_id=${product.id}`}
              className="bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-emerald-600"
            >
              📦 Order External
            </a>
          )}
          {isVip && !product.is_vip_only && (
            <a
              href={`/dashboard/internal-cod?product_id=${product.id}`}
              className="bg-slate-900 text-white py-3 rounded-xl font-bold text-sm text-center"
            >
              Internal COD
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="font-semibold text-slate-900 text-xs">{children}</span>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array(8)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="bg-slate-100 rounded-2xl aspect-[3/4]"
            style={{ animation: "pulse 1.5s infinite" }}
          />
        ))}
      <style
        jsx
        global
      >{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="font-semibold text-slate-700 mb-1">Belum ada produk</p>
      <p className="text-sm text-slate-500">
        Hubungi admin untuk menambahkan produk ke katalog.
      </p>
    </div>
  );
}

export default ProductsPage;



