// Lista e baixa as fotos do SEU usuário no Supabase Storage.
//
// Uso (na raiz do projeto):
//   node scripts/minhas-fotos.mjs seu@email.com suasenha
//
// As fotos são salvas em ./minhas-fotos/
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Uso: node scripts/minhas-fotos.mjs <email> <senha>");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 1. Login
const loginRes = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!loginRes.ok) {
  console.error("Login falhou:", loginRes.status, await loginRes.text());
  process.exit(1);
}
const { access_token, user } = await loginRes.json();
const auth = { apikey: KEY, Authorization: `Bearer ${access_token}` };
console.log(`Logado como ${user.email} (${user.id})\n`);

// 2. Minhas amostras
const samples = await (
  await fetch(
    `${URL}/rest/v1/samples?select=id,city,state,created_at&user_id=eq.${user.id}&order=created_at.desc`,
    { headers: auth },
  )
).json();
console.log(`Amostras: ${samples.length}`);

if (!samples.length) process.exit(0);

// 3. Fotos das minhas amostras (tabela photos)
const ids = samples.map((s) => `"${s.id}"`).join(",");
const photos = await (
  await fetch(`${URL}/rest/v1/photos?select=*&sample_id=in.(${ids})`, {
    headers: auth,
  })
).json();
if (!Array.isArray(photos)) {
  console.error("Erro ao ler tabela photos:", JSON.stringify(photos));
  process.exit(1);
}

mkdirSync("minhas-fotos", { recursive: true });
let ok = 0,
  broken = 0;

for (const s of samples) {
  const mine = photos.filter((p) => p.sample_id === s.id);
  console.log(
    `\n━━━ amostra ${s.id.slice(0, 8)}… (${s.city ?? "?"}/${s.state ?? "?"}, ${s.created_at.slice(0, 16)}) — ${mine.length} foto(s)`,
  );
  for (const p of mine) {
    // 4. Verifica se o arquivo realmente existe no object store
    const r = await fetch(p.photo);
    if (r.ok) {
      const bytes = new Uint8Array(await r.arrayBuffer());
      const file = `minhas-fotos/${s.id.slice(0, 8)}_${p.direction}_${p.id}.jpg`;
      writeFileSync(file, bytes);
      console.log(
        `  ✓ ${p.direction.padEnd(6)} ${(bytes.length / 1024).toFixed(0).padStart(5)} KB  → ${file}`,
      );
      console.log(`    link: ${p.photo}`);
      ok++;
    } else {
      console.log(`  ✗ ${p.direction.padEnd(6)} ${r.status} — arquivo NÃO está no store: ${p.photo}`);
      broken++;
    }
  }
}

console.log(`\nResultado: ${ok} foto(s) no store e baixada(s), ${broken} quebrada(s).`);
if (ok) console.log("Abra a pasta ./minhas-fotos para ver as imagens.");
