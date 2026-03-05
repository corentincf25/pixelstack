export function fireConfetti() {
  if (typeof window === "undefined") return;
  import("canvas-confetti").then(({ default: confetti }) => {
    const count = 120;
    const defaults = { origin: { y: 0.75 }, zIndex: 9999 };
    confetti({ ...defaults, particleCount: count, spread: 80 });
    confetti({ ...defaults, particleCount: count / 2, angle: 60, spread: 55 });
    confetti({ ...defaults, particleCount: count / 2, angle: 120, spread: 55 });
  });
}
