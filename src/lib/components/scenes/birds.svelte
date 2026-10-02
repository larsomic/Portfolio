<script lang="ts">
  // A few distant birds drifting across the sky to give the fixed scenes a
  // sense of depth and life. Pure CSS — each bird loops across the viewport
  // with a gentle vertical arc and a wing flap. Honors reduced-motion.
  const BIRDS = [
    { top: 16, size: 24, delay: 0, dur: 46, flap: 0.5, opacity: 0.5 },
    { top: 24, size: 17, delay: 9, dur: 58, flap: 0.62, opacity: 0.4 },
    { top: 12, size: 19, delay: 22, dur: 50, flap: 0.46, opacity: 0.45 },
    { top: 29, size: 14, delay: 34, dur: 64, flap: 0.56, opacity: 0.32 },
    { top: 20, size: 15, delay: 48, dur: 72, flap: 0.6, opacity: 0.3 },
  ];
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
  {#each BIRDS as b, i (i)}
    <div
      class="bird"
      style="top: {b.top}%; --dur: {b.dur}s; --delay: {b.delay}s; opacity: {b.opacity};"
    >
      <svg
        width={b.size}
        height={b.size * 0.5}
        viewBox="0 0 20 10"
        fill="none"
        stroke="#243039"
        stroke-width="1.6"
        stroke-linecap="round"
        style="--flap: {b.flap}s;"
      >
        <path class="wing" d="M1,7 Q5,1 10,6 Q15,1 19,7" />
      </svg>
    </div>
  {/each}
</div>

<style>
  .bird {
    position: absolute;
    left: 0;
    will-change: transform;
    animation: fly var(--dur) linear var(--delay) infinite;
  }
  .bird svg {
    display: block;
  }
  .wing {
    transform-origin: center;
    transform-box: fill-box;
    animation: flap var(--flap) ease-in-out infinite;
  }
  @keyframes fly {
    from {
      transform: translateX(-10vw) translateY(0);
    }
    50% {
      transform: translateX(50vw) translateY(-22px);
    }
    to {
      transform: translateX(112vw) translateY(0);
    }
  }
  @keyframes flap {
    0%,
    100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.5);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bird {
      animation: none;
      transform: translateX(42vw);
    }
    .wing {
      animation: none;
    }
  }
</style>
