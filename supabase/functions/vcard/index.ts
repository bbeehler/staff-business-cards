// Serves a staff member's contact as a real .vcf file so iPhones open
// "Create new contact" directly. Deploy with:
//   supabase functions deploy vcard --no-verify-jwt
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const BRANDS: Record<string, { name: string; web: string }> = {
  aia: { name: "AIA Canada", web: "https://aiacanada.com" },
  icar: { name: "I-CAR Canada", web: "https://i-car.ca" },
};
// Mailing address, the same for every AIA Canada and I-CAR Canada card (matches shared.js).
const ADDRESS = { street: "PO Box 11356 STN H", city: "Nepean", region: "ON", postal: "K2H 7V1", country: "Canada" };
const SITE_URL = (Deno.env.get("CARD_SITE_URL") ?? "https://card.aiacanada.com").replace(/\/$/, "");

const esc = (v: string) =>
  String(v).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const digits = (v: string) => String(v ?? "").replace(/[^\d+]/g, "");
const withScheme = (u: string) => (/^https?:\/\//i.test(u) ? u : "https://" + u);
function fold(line: string) {
  if (line.length <= 74) return line;
  const out = [line.slice(0, 74)];
  for (let i = 74; i < line.length; i += 73) out.push(" " + line.slice(i, i + 73));
  return out.join("\r\n");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("u") ?? "").toLowerCase();
  const lang = url.searchParams.get("lang") === "fr" ? "fr" : "en";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return new Response("Not found", { status: 404 });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: p } = await sb.from("profiles").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (!p) return new Response("Not found", { status: 404 });

  const b = BRANDS[p.org] ?? BRANDS.aia;
  const title = (lang === "fr" ? p.title_fr || p.title_en : p.title_en || p.title_fr) ?? "";
  const L = ["BEGIN:VCARD", "VERSION:3.0",
    `N:${esc(p.last_name)};${esc(p.first_name)};;;`,
    `FN:${esc(p.first_name + " " + p.last_name)}`,
    `ORG:${esc(b.name)}`];
  if (title) L.push(`TITLE:${esc(title)}`);
  L.push(`EMAIL;TYPE=INTERNET,WORK:${p.email}`);
  if (p.work_phone) L.push(`TEL;TYPE=WORK,VOICE:${digits(p.work_phone)}${p.work_ext ? "," + String(p.work_ext).replace(/\D/g, "") : ""}`);
  if (p.show_mobile && p.mobile) L.push(`TEL;TYPE=CELL:${digits(p.mobile)}`);
  L.push(`ADR;TYPE=WORK,POSTAL:;;${esc(ADDRESS.street)};${esc(ADDRESS.city)};${esc(ADDRESS.region)};${esc(ADDRESS.postal)};${esc(ADDRESS.country)}`);
  L.push(`URL;TYPE=WORK:${b.web}`);
  if (p.linkedin) L.push(`X-SOCIALPROFILE;TYPE=linkedin:${withScheme(p.linkedin)}`);
  L.push(`NOTE:${esc(SITE_URL + "/" + p.slug)}`);
  if (p.photo_path) {
    const { data: pub } = sb.storage.from("photos").getPublicUrl(p.photo_path);
    const img = await fetch(pub.publicUrl);
    if (img.ok) L.push(`PHOTO;ENCODING=b;TYPE=JPEG:${encodeBase64(new Uint8Array(await img.arrayBuffer()))}`);
  }
  L.push("END:VCARD");

  return new Response(L.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/vcard; charset=utf-8",
      "content-disposition": `inline; filename="${p.slug}.vcf"`,
      "cache-control": "public, max-age=300",
    },
  });
});
