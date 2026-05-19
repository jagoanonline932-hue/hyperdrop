import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const rows =
      await sql`SELECT setting_key, setting_value FROM site_settings`;
    const settings = rows.reduce((acc, r) => {
      acc[r.setting_key] = r.setting_value;
      return acc;
    }, {});
    return Response.json({ settings });
  } catch (e) {
    console.error("GET /api/settings/public", e);
    return Response.json({ settings: {} });
  }
}
