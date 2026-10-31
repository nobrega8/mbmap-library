// JSON with keys, strings, numbers and literals marked for colour (.json .k
// .s .n .b .p in site.css). Used for the raw file of a map and for excerpts.

import { escapeHtml } from "../scripts/search-core.ts";

export function highlightJson(src: string): string {
  const re = /("(?:[^"\\\n]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],])/g;
  let out = "";
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    out += escapeHtml(src.slice(last, m.index));
    if (m[1]) out += m[2] ? `<span class="k">${escapeHtml(m[1])}</span>${m[2]}` : `<span class="s">${escapeHtml(m[1])}</span>`;
    else if (m[3]) out += `<span class="n">${m[3]}</span>`;
    else if (m[4]) out += `<span class="b">${m[4]}</span>`;
    else out += `<span class="p">${m[5]}</span>`;
    last = re.lastIndex;
  }
  return out + escapeHtml(src.slice(last));
}
