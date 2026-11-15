// <time data-relative datetime="…"> shows how long ago it was ("5 min. ago",
// "3 days ago"). Worked out in the browser, as a built page would keep the
// time it was built at; the date stays in the markup for no-script readers.
// The wording comes from Intl, in the language of the page.

import { locale } from "./i18n.ts";
import { LOCALE_TAG } from "../i18n/locales.ts";

const UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "minute"],
  [24, "hour"],
  [30.44, "day"],
  [12, "month"],
  [Infinity, "year"],
];

const rtf = new Intl.RelativeTimeFormat(LOCALE_TAG[locale], { numeric: "auto", style: "short" });

export function ago(date: Date, now = Date.now()): string {
  let n = (now - date.getTime()) / 60_000;
  if (n < 1) return rtf.format(0, "minute");
  for (const [size, unit] of UNITS) {
    if (n < size) return rtf.format(-Math.floor(n), unit);
    n /= size;
  }
  return "";
}

function update() {
  document.querySelectorAll<HTMLTimeElement>("time[data-relative]").forEach((t) => {
    const d = new Date(t.dateTime);
    if (!Number.isNaN(d.getTime())) t.textContent = ago(d);
  });
}

update();
setInterval(update, 60_000);
