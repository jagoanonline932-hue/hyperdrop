import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from "@/components/Modal";
import {
  Network,
  Package,
  User,
  Truck,
  Wallet,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Calculator,
} from "lucide-react";

function ExternalPage() {
  return (
    <DashboardLayout currentPath="/dashboard/external">
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
  const [expeditions, setExpeditions] = useState([]);
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    // External: hide VIP-only products from non-VIP, otherwise show all
    Promise.all([
      fetch("/api/products?order_type=external").then((r) => r.json()),
      fetch("/api/orders?type=external_aggregator").then((r) => r.json()),
      fetch("/api/settings/public").then((r) => r.json()),
      fetch("/api/homepage").then((r) => r.json()), // for expeditions list (non-VIP)
    ])
      .then(([p, o, s, h]) => {
        setProducts(p.products || []);
        setOrders(o.orders || []);
        setSettings(s.settings || {});
        // hide SPX (VIP-only) from expedition options
        setExpeditions((h.expeditions || []).filter((e) => !e.is_vip_only));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-7 h-7 text-blue-500" /> External Aggregator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Order melalui partner aggregator pihak ketiga. Pembayaran via saldo
            HyperDrop.
          </p>
        </div>
        <button
          onClick={() => setOpenOrder(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Buat Order External
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-0.5">Pembayaran via Saldo</p>
          <p>
            Pembelian produk + ongkir akan dipotong dari saldo HyperDrop Anda.
            Pastikan saldo cukup sebelum order.{" "}
            <a href="/dashboard/topup" className="font-bold underline">
              Topup Saldo
            </a>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Riwayat Order External</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">No. Order</th>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Produk</th>
                <th className="text-left px-4 py-3">Penerima</th>
                <th className="text-left px-4 py-3">Resi</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Belum ada order external
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
                      <p className="font-semibold text-xs">
                        {o.recipient_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {o.recipient_phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {o.tracking_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      Rp {Number(o.total_cod).toLocaleString("id-ID")}
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
        title="Order External Aggregator"
        size="xl"
      >
        <ExternalForm
          products={products.filter(
            (p) => !p.is_vip_only || profile.vip_status,
          )}
          expeditions={expeditions}
          settings={settings}
          profile={profile}
          onSuccess={(o) => {
            setSuccessOrder(o);
            setOpenOrder(false);
            fetch("/api/orders?type=external_aggregator")
              .then((r) => r.json())
              .then((d) => setOrders(d.orders || []));
          }}
        />
      </Modal>

      <Modal
        open={!!successOrder}
        onClose={() => setSuccessOrder(null)}
        title="Order External Berhasil!"
      >
        {successOrder && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Order Berhasil Dibuat
            </h3>
            <p className="text-slate-600 mb-4">
              No. Order:{" "}
              <span className="font-mono font-bold">
                {successOrder.order_number}
              </span>
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Saldo Rp {Number(successOrder.total_cod).toLocaleString("id-ID")}{" "}
              telah dipotong & masuk HOLD.
            </p>
            <button
              onClick={() => setSuccessOrder(null)}
              className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold"
            >
              OK
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ExternalForm({ products, expeditions, settings, profile, onSuccess }) {
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [productDetail, setProductDetail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingCost, setShippingCost] = useState("");
  const [recipientName, setRecipientName] = useState(profile.full_name || "");
  const [recipientPhone, setRecipientPhone] = useState(profile.phone || "");
  const [recipientEmail, setRecipientEmail] = useState(profile.email || "");
  const [recipientAddress, setRecipientAddress] = useState(
    profile.address || "",
  );
  const [recipientDistrict, setRecipientDistrict] = useState(
    profile.district || "",
  );
  const [recipientCity, setRecipientCity] = useState(profile.city || "");
  const [recipientProvince, setRecipientProvince] = useState(
    profile.province || "",
  );
  const [recipientPostal, setRecipientPostal] = useState(
    profile.postal_code || "",
  );
  const [expeditionId, setExpeditionId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [resiPdf, setResiPdf] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const packingFee = Number(settings.packing_fee || 2500);

  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then((r) => r.json())
        .then((d) => setProductDetail(d));
    } else setProductDetail(null);
  }, [productId]);

  const product = productDetail?.product;
  const variants = productDetail?.variants || [];
  const variant = variants.find((v) => v.id === Number(variantId));
  const productPrice = variant
    ? Number(variant.price)
    : Number(product?.supplier_price || 0);
  const qty = Number(quantity) || 1;
  const ship = Number(shippingCost) || 0;
  const total = productPrice * qty + ship + packingFee;
  const insufficient = Number(profile.balance) < total;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        const r = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, file_name: file.name }),
        });
        const d = await r.json();
        if (r.ok) setResiPdf(d.url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!productId || !recipientName || !recipientPhone || !recipientAddress) {
      setError("Lengkapi data produk & penerima");
      return;
    }
    if (insufficient) {
      setError("Saldo tidak cukup. Mohon topup terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_type: "external_aggregator",
          product_id: Number(productId),
          variant_id: variantId ? Number(variantId) : null,
          quantity: qty,
          shipping_cost: ship,
          expedition_id: expeditionId ? Number(expeditionId) : null,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_email: recipientEmail,
          recipient_address: recipientAddress,
          recipient_district: recipientDistrict,
          recipient_city: recipientCity,
          recipient_province: recipientProvince,
          recipient_postal_code: recipientPostal,
          tracking_number: trackingNumber || null,
          resi_pdf_url: resiPdf || null,
          payment_method: "balance",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Gagal");
      onSuccess(data.order);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
                {p.name}
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
                  {v.name} • Rp {Number(v.price).toLocaleString("id-ID")} (Stok:{" "}
                  {v.stock})
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
              label="Ongkir"
              type="number"
              value={shippingCost}
              onChange={setShippingCost}
            />
          </div>
          <div className="mt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ekspedisi
            </label>
            <select
              value={expeditionId}
              onChange={(e) => setExpeditionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">— Pilih Ekspedisi —</option>
              {expeditions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="Data Penerima (Profil)" icon={User}>
          <Input
            label="Nama"
            value={recipientName}
            onChange={setRecipientName}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="No HP"
              value={recipientPhone}
              onChange={setRecipientPhone}
            />
            <Input
              label="Email"
              value={recipientEmail}
              onChange={setRecipientEmail}
            />
          </div>
          <Input
            label="Alamat Lengkap"
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

        <Section title="Upload Resi Aggregator" icon={Truck}>
          <Input
            label="No Resi (opsional saat order)"
            value={trackingNumber}
            onChange={setTrackingNumber}
            placeholder="JNE12345678"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload PDF Resi (opsional)
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFile}
              className="w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
            />
            {uploading && (
              <p className="text-xs text-blue-500 mt-1">Mengupload...</p>
            )}
            {resiPdf && (
              <p className="text-xs text-emerald-600 mt-1">✓ File uploaded</p>
            )}
          </div>
        </Section>
      </div>

      <div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-5 sticky top-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Rincian Pembayaran
          </h3>
          <div className="space-y-2 text-sm">
            <Row
              label="Harga Produk"
              value={`Rp ${(productPrice * qty).toLocaleString("id-ID")}`}
            />
            <Row label="Ongkir" value={`Rp ${ship.toLocaleString("id-ID")}`} />
            <Row
              label="Packing Fee (flat)"
              value={`Rp ${packingFee.toLocaleString("id-ID")}`}
            />
            <div className="border-t border-white/20 my-3" />
            <div className="flex items-center justify-between">
              <span className="text-blue-100">Total Dibayar</span>
              <span className="font-bold text-lg">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mt-2">
              <p className="text-xs text-blue-100 mb-1">Metode Pembayaran</p>
              <div className="inline-flex items-center gap-2 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Wallet className="w-3.5 h-3.5" /> Saldo HyperDrop
              </div>
              <p className="text-[10px] mt-2">
                Saldo Anda: Rp {Number(profile.balance).toLocaleString("id-ID")}
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
            className="w-full mt-4 bg-white text-blue-700 py-3 rounded-xl font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
              "Buat Order External"
            )}
          </button>
          <style
            jsx
            global
          >{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
      <h4 className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5 mb-1">
        <Icon className="w-4 h-4 text-blue-500" /> {title}
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
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          rows={2}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          {...rest}
        />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-blue-100">{label}</span>
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

export default ExternalPage;
