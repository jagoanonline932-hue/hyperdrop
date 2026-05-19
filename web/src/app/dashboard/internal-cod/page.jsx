import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import { ToastProvider, useToast } from "@/components/Toast";
import {
  ShieldCheck,
  Crown,
  Calculator,
  Package,
  User,
  MapPin,
  ShoppingBag,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function InternalCODPage() {
  return (
    <DashboardLayout currentPath="/dashboard/internal-cod">
      {({ profile }) => <Inner profile={profile} />}
    </DashboardLayout>
  );
}

function Inner({ profile }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openOrder, setOpenOrder] = useState(false);
  const [settings, setSettings] = useState({});
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/orders?type=internal_cod").then((r) => r.json()),
      fetch("/api/settings/public").then((r) => r.json()),
    ])
      .then(([p, o, s]) => {
        setProducts(p.products || []);
        setOrders(o.orders || []);
        setSettings(s.settings || {});
      })
      .finally(() => setLoading(false));
  }, []);

  if (!profile.vip_status) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-3xl p-10 text-center max-w-2xl mx-auto">
        <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Internal COD Khusus VIP
        </h2>
        <p className="text-slate-600 mb-6">
          Fitur Internal COD VIP hanya untuk member VIP. Upgrade akun Anda untuk
          membuka semua benefit premium.
        </p>
        <a
          href="/dashboard/upgrade-vip"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-amber-500/30"
        >
          <Crown className="w-4 h-4" /> Upgrade VIP Sekarang
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-500" /> Internal COD
            VIP
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Order COD eksklusif untuk VIP Member. Profit langsung dihitung
            otomatis.
          </p>
        </div>
        <button
          onClick={() => setOpenOrder(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Buat Order COD
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">
            Riwayat Order Internal COD
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">No. Order</th>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Produk</th>
                <th className="text-left px-4 py-3">Penerima</th>
                <th className="text-right px-4 py-3">Total COD</th>
                <th className="text-right px-4 py-3">Profit</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Belum ada order COD
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(o.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">{o.product_name}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{o.recipient_name}</p>
                      <p className="text-xs text-slate-500">
                        {o.recipient_phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      Rp {Number(o.total_cod).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">
                      Rp {Number(o.member_profit).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={openOrder}
        onClose={() => setOpenOrder(false)}
        title="Buat Order Internal COD"
        size="xl"
      >
        <OrderForm
          products={products.filter((p) => p.is_active)}
          settings={settings}
          profile={profile}
          onClose={() => setOpenOrder(false)}
          onSuccess={(o) => {
            setSuccessOrder(o);
            setOpenOrder(false);
            fetch("/api/orders?type=internal_cod")
              .then((r) => r.json())
              .then((d) => setOrders(d.orders || []));
          }}
        />
      </Modal>

      <Modal
        open={!!successOrder}
        onClose={() => setSuccessOrder(null)}
        title="Order Berhasil!"
      >
        {successOrder && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Order COD Berhasil Dibuat
            </h3>
            <p className="text-slate-600 mb-4">
              No. Order:{" "}
              <span className="font-mono font-bold">
                {successOrder.order_number}
              </span>
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left text-sm space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Total COD</span>
                <span className="font-bold">
                  Rp {Number(successOrder.total_cod).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Profit Anda</span>
                <span className="font-bold">
                  Rp{" "}
                  {Number(successOrder.member_profit).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSuccessOrder(null)}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold"
            >
              OK
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function OrderForm({ products, settings, profile, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [productDetail, setProductDetail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientDistrict, setRecipientDistrict] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [recipientProvince, setRecipientProvince] = useState("");
  const [recipientPostal, setRecipientPostal] = useState("");
  const [expeditionId, setExpeditionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const codFeePercent = Number(settings.cod_fee_percent || 3);
  const packingFee = Number(settings.packing_fee || 2500);

  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then((r) => r.json())
        .then((d) => {
          setProductDetail(d);
          if (!d?.product) return;
          setSellPrice(d.product.recommended_price || "");
        });
    } else {
      setProductDetail(null);
    }
  }, [productId]);

  const product = productDetail?.product;
  const variants = productDetail?.variants || [];
  const variant = variants.find((v) => v.id === Number(variantId));
  const productPrice = variant
    ? Number(variant.price)
    : Number(product?.supplier_price || 0);
  const sell = Number(sellPrice) || 0;
  const ship = Number(shippingCost) || 0;
  const qty = Number(quantity) || 1;
  const totalCod = sell * qty;
  const codFee = Math.round((totalCod * codFeePercent) / 100);
  const profit = totalCod - ship - codFee - packingFee - productPrice * qty;
  const holdAmount = productPrice * qty + ship + packingFee;
  const insufficient = Number(profile.balance) < holdAmount;

  const submit = async () => {
    setError(null);
    if (!productId || !recipientName || !recipientPhone || !recipientAddress) {
      setError("Mohon lengkapi semua data wajib");
      return;
    }
    if (insufficient) {
      setError(
        `Saldo tidak cukup untuk HOLD. Butuh Rp ${holdAmount.toLocaleString("id-ID")}, saldo Anda Rp ${Number(profile.balance).toLocaleString("id-ID")}.`,
      );
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_type: "internal_cod",
          product_id: Number(productId),
          variant_id: variantId ? Number(variantId) : null,
          quantity: qty,
          sell_price: sell,
          shipping_cost: ship,
          expedition_id: expeditionId ? Number(expeditionId) : null,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_email: profile.email,
          recipient_address: recipientAddress,
          recipient_district: recipientDistrict,
          recipient_city: recipientCity,
          recipient_province: recipientProvince,
          recipient_postal_code: recipientPostal,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Gagal membuat order");
      onSuccess(data.order);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Section title="Pilih Produk" icon={Package}>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">— Pilih Produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_vip_only ? " [VIP]" : ""}
                </option>
              ))}
            </select>
            {variants.length > 0 && (
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm mt-2"
              >
                <option value="">— Pilih Varian —</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} • Rp {Number(v.price).toLocaleString("id-ID")}{" "}
                    (Stok: {v.stock})
                  </option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                label="Quantity"
                type="number"
                value={quantity}
                onChange={setQuantity}
                min={1}
              />
              <Input
                label="Harga Jual (per pc)"
                type="number"
                value={sellPrice}
                onChange={setSellPrice}
              />
            </div>
            <Input
              label="Ongkir"
              type="number"
              value={shippingCost}
              onChange={setShippingCost}
            />
            {productDetail?.expeditions?.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 mt-2">
                  Ekspedisi
                </label>
                <select
                  value={expeditionId}
                  onChange={(e) => setExpeditionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">— Pilih Ekspedisi —</option>
                  {productDetail.expeditions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Section>

          <Section title="Data Penerima" icon={User}>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Nama Penerima *"
                value={recipientName}
                onChange={setRecipientName}
              />
              <Input
                label="No HP *"
                value={recipientPhone}
                onChange={setRecipientPhone}
              />
            </div>
            <Input
              label="Alamat Lengkap *"
              value={recipientAddress}
              onChange={setRecipientAddress}
              textarea
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Kecamatan"
                value={recipientDistrict}
                onChange={setRecipientDistrict}
              />
              <Input
                label="Kota/Kab"
                value={recipientCity}
                onChange={setRecipientCity}
              />
              <Input
                label="Provinsi"
                value={recipientProvince}
                onChange={setRecipientProvince}
              />
              <Input
                label="Kode Pos"
                value={recipientPostal}
                onChange={setRecipientPostal}
              />
            </div>
          </Section>
        </div>

        <div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-5 sticky top-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Rincian Order
            </h3>
            <div className="space-y-2 text-sm">
              <Row
                label="Harga Produk"
                value={`Rp ${(productPrice * qty).toLocaleString("id-ID")}`}
              />
              <Row
                label="Harga Jual"
                value={`Rp ${totalCod.toLocaleString("id-ID")}`}
              />
              <Row
                label="Ongkir"
                value={`Rp ${ship.toLocaleString("id-ID")}`}
              />
              <Row
                label={`COD Fee (${codFeePercent}%)`}
                value={`Rp ${codFee.toLocaleString("id-ID")}`}
              />
              <Row
                label="Packing Fee (flat)"
                value={`Rp ${packingFee.toLocaleString("id-ID")}`}
              />
              <div className="border-t border-white/20 my-3" />
              <div className="flex items-center justify-between">
                <span className="text-emerald-100">Total COD</span>
                <span className="font-bold text-lg">
                  Rp {totalCod.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mt-2">
                <p className="text-xs text-emerald-100 mb-1">Profit Anda</p>
                <p className="text-2xl font-bold tabular-nums">
                  Rp {profit.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-amber-400 text-slate-900 rounded-xl p-3 mt-2">
                <p className="text-xs font-semibold">HOLD Saldo</p>
                <p className="text-lg font-bold tabular-nums">
                  Rp {holdAmount.toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] mt-1">
                  Saat ini saldo Anda: Rp{" "}
                  {Number(profile.balance).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
            {insufficient && (
              <div className="mt-3 bg-rose-500/20 border border-rose-300 rounded-lg p-2 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Saldo tidak cukup.{" "}
                  <a href="/dashboard/topup" className="underline font-bold">
                    Topup dulu
                  </a>
                </span>
              </div>
            )}
            {error && (
              <div className="mt-3 bg-rose-500 text-white rounded-lg p-2 text-xs">
                {error}
              </div>
            )}
            <button
              onClick={submit}
              disabled={loading || insufficient}
              className="w-full mt-4 bg-white text-emerald-700 py-3 rounded-xl font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2
                    className="w-4 h-4"
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Memproses...
                </>
              ) : (
                "Buat Order COD"
              )}
            </button>
            <style
              jsx
              global
            >{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
      <h4 className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5 mb-1">
        <Icon className="w-4 h-4 text-emerald-500" /> {title}
      </h4>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
  ...rest
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          rows={2}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          {...rest}
        />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-emerald-100">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-slate-100 text-slate-600",
    hold: "bg-amber-100 text-amber-700",
    shipping: "bg-blue-100 text-blue-700",
    delivered: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    returned: "bg-rose-100 text-rose-700",
    refund: "bg-purple-100 text-purple-700",
    cancelled: "bg-slate-200 text-slate-500",
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md ${map[status] || "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

export default InternalCODPage;
