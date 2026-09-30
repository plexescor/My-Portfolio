document.addEventListener("DOMContentLoaded", () => {

  // ── Scroll fade-in ──────────────────────────────────────────────────────────
  const faders = document.querySelectorAll(".fade-in");
  if (faders.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    faders.forEach((el) => observer.observe(el));
  }

  // ── Project card click → GitHub ─────────────────────────────────────────────
  document.querySelectorAll(".project-card[data-href]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest("a")) {
        window.open(card.dataset.href, "_blank", "noopener");
      }
    });
  });

  // ── Age calculation (hardcoded dates, no API) ───────────────────────────────
  function calcAge(isoDate) {
    const created = new Date(isoDate);
    const now = new Date();

    let months =
      (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth());
    if (now.getDate() < created.getDate()) months--;

    const anchor = new Date(created);
    anchor.setMonth(anchor.getMonth() + months);
    const days = Math.floor((now - anchor) / (1000 * 60 * 60 * 24));

    const mLabel = months === 1 ? "Month" : "Months";
    const dLabel = days === 1 ? "Day" : "Days";

    if (months === 0) return `${days} ${dLabel}`;
    if (days === 0) return `${months} ${mLabel}`;
    return `${months} ${mLabel} ${days} ${dLabel}`;
  }

  document.getElementById("hpr-age").textContent = calcAge("2026-05-01");
  document.getElementById("tnt-age").textContent = calcAge("2026-07-18");

  // ── Format number ───────────────────────────────────────────────────────────
  function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }

  // ── Fetch from GitHub API, fall back to assets/cache.json ──────────────────
  async function fetchRepo(repo) {
    const res = await fetch(`https://api.github.com/repos/plexescor/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  async function fetchDownloads(repo) {
    const res = await fetch(
      `https://api.github.com/repos/plexescor/${repo}/releases`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) throw new Error(res.status);
    const releases = await res.json();
    return releases.reduce(
      (total, r) => total + r.assets.reduce((s, a) => s + a.download_count, 0),
      0
    );
  }

  async function fetchCache() {
    const res = await fetch("assets/cache.json");
    if (!res.ok) throw new Error("no cache");
    return res.json();
  }

  // HPR stats
  (async () => {
    const starsEl = document.getElementById("hpr-stars");
    const dlEl = document.getElementById("hpr-downloads");
    try {
      const [data, downloads] = await Promise.all([
        fetchRepo("HPR"),
        fetchDownloads("HPR"),
      ]);
      starsEl.textContent = fmt(data.stargazers_count);
      dlEl.textContent = fmt(downloads);
    } catch {
      // Live API failed — use cached values
      try {
        const cache = await fetchCache();
        starsEl.textContent = fmt(cache.HPR.stars);
        dlEl.textContent = fmt(cache.HPR.downloads);
      } catch {
        starsEl.textContent = "—";
        dlEl.textContent = "—";
      }
    }
  })();

  // tantrums stats
  (async () => {
    const starsEl = document.getElementById("tnt-stars");
    try {
      const data = await fetchRepo("tantrums");
      starsEl.textContent = fmt(data.stargazers_count);
    } catch {
      try {
        const cache = await fetchCache();
        starsEl.textContent = fmt(cache.tantrums.stars);
      } catch {
        starsEl.textContent = "—";
      }
    }
  })();

});
