// <time data-relative datetime="…"> shows how long ago it was ("5 min ago",
// "3 days ago"). Worked out in the browser, as a built page would keep the
// time it was built at; the date stays in the markup for no-script readers.

const UNITS: [number, string, string][] = [
  [60, "min", "min"],
  [24, "hr", "hr"],
  [30.44, "day", "days"],
  [12, "month", "months"],
  [Infinity, "year", "years"],
];

export function ago(date: Date, now = Date.now()): string {
  let n = (now - date.getTime()) / 60_000;
  if (n < 1) return "just now";
  for (const [size, one, many] of UNITS) {
    if (n < size) {
      const v = Math.floor(n);
      return `${v} ${v === 1 ? one : many} ago`;
    }
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
