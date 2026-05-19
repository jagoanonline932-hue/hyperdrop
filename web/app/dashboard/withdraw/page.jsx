import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowUpFromLine,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function WithdrawPage() {
  return (
    <DashboardLayout currentPath="/dashboard/withdraw">
      {({ profile, settings }) => (
        <Inner profile={profile} settings={settings} />
      )}
    </DashboardLayout>
  );
}

function Inner({ profile, settings }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetch("/api/withdraw")
      .then((r) => r.json())
      .then((d) => setWithdrawals(d.withdrawals || []));
  }, [success]);

  const fee = Number(settings.withdraw_fee || 2500);
  const min = Number(settings.min_withdraw || 50000);
  const net = Math.max(0, Number(amount || 0) - fee);
  const profileIncomplete =
    !profile.bank_name ||
    !profile.bank_account_number ||
    !profile.bank_account_holder;

  const submit = async () => {
    setError(null);
    if (profileIncomplete) {
      setError("Lengkapi data rekening di Pengaturan terlebih dahulu");
      return;
    }
    if (Number(amount) < min) {
      setError(`Minimal withdraw Rp ${min.toLocaleString("id-ID")}`);
      return;
    }
    if (Number(amount) > Number(profile.balance)) {
      setError("Saldo tidak cukup");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal");
      setSuccess(d.withdraw);
      setAmount("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <ArrowUpFromLine className="w-7 h-7 text-rose-500" /> Withdraw Saldo
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tarik saldo aktif ke rekening bank Anda.
        </p>
      </div>

      {profileIncomplete && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              Data Rekening Belum Lengkap
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Mohon lengkapi data rekening bank di menu{" "}
              <a href="/dashboard/pengaturan" className="underline font-bold">
                Pengaturan
              </a>{" "}
              untuk dapat melakukan withdraw.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Ajukan Withdraw</h3>
          <div className="bg-emerald-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-emerald-700">Saldo Aktif</p>
            <p className="text-2xl font-bold text-emerald-700">
              {fmt(profile.balance)}
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nominal
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={min.toString()}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimal: {fmt(min)} • Fee: {fmt(fee)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Withdraw</span>
                <span className="font-semibold">{fmt(amount)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Fee</span>
                <span className="font-semibold">- {fmt(fee)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-bold">Diterima</span>
                <span className="font-bold text-emerald-600">{fmt(net)}</span>
              </div>
            </div>
            {!profileIncomplete && (
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Tujuan Rekening</p>
                <p>
                  {profile.bank_name} • {profile.bank_account_number}
                </p>
                <p>a/n {profile.bank_account_holder}</p>
              </div>
            )}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              onClick={submit}
              disabled={loading || profileIncomplete}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
                "Ajukan Withdraw"
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold">Riwayat Withdraw</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {withdrawals.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">
                Belum ada withdraw
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-4 hover:bg-slate-50">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="font-mono text-xs">{w.withdraw_number}</p>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md ${
                          w.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : w.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <p className="text-base font-bold">{fmt(w.amount)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(w.created_at).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {w.bank_name} • {w.bank_account_number}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white border-2 border-emerald-300 rounded-2xl shadow-2xl p-6 max-w-sm w-[90%] z-50 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold">Withdraw Berhasil Diajukan</p>
          <p className="text-sm text-slate-500 mt-1">
            {success.withdraw_number}
          </p>
          <button
            onClick={() => setSuccess(null)}
            className="mt-3 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            OK
          </button>
        </div>
      )}
      <style
        jsx
        global
      >{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default WithdrawPage;



