// Cookie consent and Google Tag Manager (GA4). Analytics is loaded only after the
// visitor accepts; the choice is kept in localStorage and can be changed from
// the "Cookie settings" link in the footer.

type Choice = "granted" | "denied";
const KEY = "consent";
const id = (window as unknown as { __GTM_ID?: string }).__GTM_ID;
const banner = document.getElementById("consent");

function stored(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function clearAnalyticsCookies() {
  const host = location.hostname;
  for (const name of document.cookie.split(";").map((c) => c.split("=")[0]!.trim())) {
    if (name === "_ga" || name.startsWith("_ga_") || name === "_gid") {
      for (const domain of ["", `; domain=${host}`, `; domain=.${host}`]) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  }
}

let loaded = false;
function loadAnalytics() {
  if (loaded || !id) return;
  loaded = true;
  const w = window as unknown as { dataLayer: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

function apply(choice: Choice | null) {
  if (banner) banner.hidden = choice !== null;
  if (choice === "granted") loadAnalytics();
}

function choose(choice: Choice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {}
  if (choice === "denied") {
    clearAnalyticsCookies();
    // Already-loaded tags stop on the next page; no reload is needed
  }
  apply(choice);
}

banner?.querySelectorAll<HTMLButtonElement>("[data-consent]").forEach((b) =>
  b.addEventListener("click", () => choose(b.dataset.consent as Choice)),
);
document.querySelectorAll("[data-consent-open]").forEach((b) =>
  b.addEventListener("click", () => {
    if (banner) {
      banner.hidden = false;
      banner.querySelector<HTMLButtonElement>("[data-consent]")?.focus();
    }
  }),
);

apply(stored());
