import { useEffect } from "react";

// Midtrans has been replaced by Duitku. Redirect to the new page.
function RedirectMidtrans() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/admin/duitku");
    }
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">
        Mengalihkan ke Duitku Payment Gateway...
      </p>
    </div>
  );
}

export default RedirectMidtrans;
