// Run this script to update assets/cache.json with fresh GitHub API data.
// Usage: node update-cache.js
// Requires Node 18+ (built-in fetch).

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, "assets", "cache.json");

const HEADERS = { "Accept": "application/vnd.github+json" };

async function getStars(repo) {
  const res = await fetch(`https://api.github.com/repos/plexescor/${repo}`, { headers: HEADERS });
  const data = await res.json();
  return data.stargazers_count ?? 0;
}

async function getDownloads(repo) {
  const res = await fetch(`https://api.github.com/repos/plexescor/${repo}/releases`, { headers: HEADERS });
  const releases = await res.json();
  if (!Array.isArray(releases)) return 0;
  return releases.reduce(
    (total, r) => total + r.assets.reduce((s, a) => s + a.download_count, 0),
    0
  );
}

async function main() {
  console.log("Fetching GitHub stats...");

  const [hprStars, hprDownloads, tntStars, tntDownloads] = await Promise.all([
    getStars("HPR"),
    getDownloads("HPR"),
    getStars("tantrums"),
    getDownloads("tantrums"),
  ]);

  const cache = {
    HPR: { stars: hprStars, downloads: hprDownloads },
    tantrums: { stars: tntStars, downloads: tntDownloads },
  };

  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log("cache.json updated:");
  console.log(`  HPR       → ${hprStars} stars, ${hprDownloads} downloads`);
  console.log(`  tantrums  → ${tntStars} stars, ${tntDownloads} downloads`);
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
