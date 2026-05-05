import confetti from "canvas-confetti";

export const celebrate = () => {
  const duration = 1200;
  const end = Date.now() + duration;

  // Two side bursts that keep firing for a moment
  const colors = ["#3B82F6", "#22C55E", "#F59E0B", "#EC4899", "#A855F7"];

  // Big initial pop in the center
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.5 },
    colors,
    scalar: 1.1,
    zIndex: 9999,
  });

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 65,
      startVelocity: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      zIndex: 9999,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 65,
      startVelocity: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      zIndex: 9999,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};
