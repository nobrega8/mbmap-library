// Modbench's motion (src/lib/motion.ts and DigitRoll.svelte) without Svelte:
// a pill that slides under the selected option, numbers that roll like an
// odometer, and content that rises into view. Same easing and durations as
// the app, and nothing moves when the system asks for reduced motion.

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Slides a pill under the selected child (class `on`, or aria-current) of a
 * segmented control or a navigation bar. The first placement jumps; later
 * ones slide.
 */
export function slidePill(node: HTMLElement) {
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.setAttribute("aria-hidden", "true");
  node.prepend(pill);
  node.classList.add("sliding");
  let placed = false;

  const place = () => {
    const on = node.querySelector<HTMLElement>(':scope > .on, :scope > [aria-current="page"]');
    if (!on || !on.offsetWidth) {
      pill.style.opacity = "0";
      return;
    }
    if (!placed) pill.style.transition = "none";
    pill.style.opacity = "1";
    pill.style.width = `${on.offsetWidth}px`;
    pill.style.height = `${on.offsetHeight}px`;
    pill.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
    if (!placed) {
      void pill.offsetWidth;
      pill.style.transition = "";
      placed = true;
    }
  };

  new MutationObserver(place).observe(node, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "aria-current"],
  });
  new ResizeObserver(place).observe(node);
  place();
}

/** A number drawn as columns of digits that roll to their value. */
export function digitRoll(el: HTMLElement, value: string) {
  el.classList.add("roll");
  el.setAttribute("aria-label", value);
  el.innerHTML = [...value]
    .map((c) =>
      c >= "0" && c <= "9"
        ? `<span class="col" aria-hidden="true"><span class="strip" style="transform:translateY(0)">${Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join("")}</span></span>`
        : `<span aria-hidden="true">${c}</span>`,
    )
    .join("");
  const strips = [...el.querySelectorAll<HTMLElement>(".strip")];
  const digits = [...value].filter((c) => c >= "0" && c <= "9").map(Number);
  const roll = () =>
    strips.forEach((s, i) => {
      // Columns further right start a little later, as an odometer settles
      s.style.transitionDelay = `${i * 40}ms`;
      s.style.transform = `translateY(${-digits[i]! * 10}%)`;
    });
  if (reduced()) roll();
  else requestAnimationFrame(() => requestAnimationFrame(roll));
}

/** Rolls every [data-roll] number once it scrolls into view. */
export function rollNumbers(root: ParentNode = document) {
  const els = [...root.querySelectorAll<HTMLElement>("[data-roll]")];
  if (!els.length) return;
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        seen.unobserve(e.target);
        const el = e.target as HTMLElement;
        digitRoll(el, el.dataset.roll!);
      }
    },
    { threshold: 0.4 },
  );
  els.forEach((el) => seen.observe(el));
}

/** Content that rises into view as it scrolls in (revealIn in the app). */
export function revealOnScroll(root: ParentNode = document) {
  const els = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
  if (reduced() || !("IntersectionObserver" in window)) return;
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        seen.unobserve(e.target);
        (e.target as HTMLElement).classList.add("shown");
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (const el of els) {
    // Already on screen at load: no animation, so nothing shifts or flashes
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.92) continue;
    el.classList.add("reveal");
    seen.observe(el);
  }
}

/** Rows that were just drawn (a new page of results) fade in, a few at a time. */
export function staggerRows(body: HTMLElement, max = 12) {
  if (reduced()) return;
  [...body.children].slice(0, max).forEach((row, i) => {
    (row as HTMLElement).animate(
      [
        { opacity: 0, transform: "translateY(4px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 220, delay: i * 14, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "backwards" },
    );
  });
}
