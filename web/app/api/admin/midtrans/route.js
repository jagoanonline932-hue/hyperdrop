import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/helpers";

export async function GET() {
  const r = await requireAdmin();
  if (r.error) return Response.json({ error: r.error }, { status: r.status });
  const rows = await sql`SELECT * FROM midtrans_settings WHERE id = 1 LIMIT 1`;
  return Response.json({ midtrans: rows[0] || null });
}

export async function PUT(request) {
  const r = await requireAdmin();
  if (r.error) return Response.json({ error: r.error }, { status: r.status });
  try {
    const b = await request.json();
    const exists =
      await sql`SELECT id FROM midtrans_settings WHERE id = 1 LIMIT 1`;
    if (!exists[0]) {
      await sql`INSERT INTO midtrans_settings (id, mode, merchant_id, client_key, server_key, is_active) VALUES (1, ${b.mode || "production"}, ${b.merchant_id || null}, ${b.client_key || null}, ${b.server_key || null}, ${b.is_active !== false})`;
    } else {
      const allowed = [
        "mode",
        "merchant_id",
        "client_key",
        "server_key",
        "is_active",
      ];
      const sets = [],
        vals = [];
      for (const k of allowed)
        if (b[k] !== undefined) {
          sets.push(`${k} = $${vals.length + 1}`);
          vals.push(b[k]);
        }
      sets.push("updated_at = NOW()");
      const q = `UPDATE midtrans_settings SET ${sets.join(", ")} WHERE id = 1`;
      if (sets.length > 1) await sql(q, vals);
    }
    const rows =
      await sql`SELECT * FROM midtrans_settings WHERE id = 1 LIMIT 1`;
    return Response.json({ midtrans: rows[0] });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal" }, { status: 500 });
  }
}



