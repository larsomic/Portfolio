<script lang="ts">
  // Pullman — a distant town tucked in a hollow of the vast rolling Palouse.
  // The hills are deeply "rolling": big rounded S-curve ridges overlapping
  // band over band with soft fold shadows. The town is tiny, far back, and
  // nestled right where two ridges dip — hemmed in by land on every side.

  const BASE = 250; // town ground line, deep in the background hollow

  interface House { x: number; w: number; h: number }
  const HOUSES: House[] = [
    { x: 528, w: 13, h: 15 }, { x: 545, w: 11, h: 13 }, { x: 560, w: 15, h: 18 },
    { x: 579, w: 12, h: 14 }, { x: 636, w: 14, h: 16 }, { x: 654, w: 11, h: 13 },
    { x: 668, w: 16, h: 19 }, { x: 688, w: 12, h: 14 }, { x: 704, w: 14, h: 17 },
    { x: 486, w: 11, h: 13 }, { x: 499, w: 9, h: 11 }, { x: 738, w: 11, h: 13 },
    { x: 872, w: 10, h: 12 }, { x: 886, w: 9, h: 11 },
  ];
  const WALLS = ['#b85c3a', '#d9c4a6', '#a8553a', '#cbb79c'];
  const ROOFS = ['#54606e', '#6b7885'];

  const CONIF_X = [512, 630, 748];
</script>

<svg class="h-full w-full" viewBox="0 0 1200 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky-pullman" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9cb7d2" />
      <stop offset="0.7" stop-color="#e4ecf0" />
      <stop offset="1" stop-color="#eeddca" />
    </linearGradient>
  </defs>

  <!-- sky with a low warm glow -->
  <rect width="1200" height="540" fill="url(#sky-pullman)" />
  <ellipse cx="700" cy="96" rx="380" ry="60" fill="#f8ecd9" opacity="0.35" />

  <!-- soft clouds drifting over the Palouse -->
  <g class="cloud-a" fill="#fdf8ef" opacity="0.55">
    <ellipse cx="200" cy="70" rx="46" ry="14" />
    <ellipse cx="236" cy="63" rx="34" ry="16" />
    <ellipse cx="168" cy="66" rx="30" ry="12" />
  </g>
  <g class="cloud-b" fill="#fdf8ef" opacity="0.4">
    <ellipse cx="880" cy="58" rx="40" ry="12" />
    <ellipse cx="912" cy="52" rx="30" ry="14" />
    <ellipse cx="852" cy="54" rx="26" ry="10" />
  </g>

  <!-- deeply rolling ridges, one dome flowing into the next -->
  <path d="M-40,112 C80,82 200,122 340,96 S560,126 700,90 S940,122 1100,86 L1240,104 L1240,540 L-40,540 Z" fill="#a9b27e" />
  <path d="M-40,170 C100,138 260,180 420,150 S640,184 800,146 S1040,180 1240,150 L1240,540 L-40,540 Z" fill="#c4a86b" />
  <!-- olive ridge with the hollow where the town nestles -->
  <path d="M-40,224 C120,196 240,234 380,212 C470,198 520,246 640,248 C760,250 840,206 1000,226 L1240,214 L1240,540 L-40,540 Z" fill="#8fa653" />
  <!-- hollow floor -->
  <path d="M400,268 C500,254 560,250 640,250 S770,254 860,268 L860,540 L400,540 Z" fill="#7e9a44" />

  <!-- the town: tiny, condensed, deep in the hollow -->
  <g opacity="0.88">
    {#each HOUSES as hse, i (hse.x)}
      {@const wallH = Math.round(hse.h * 0.55)}
      <rect x={hse.x} y={BASE - wallH} width={hse.w} height={wallH} fill={WALLS[i % 4]} />
      <polygon points={`${hse.x - 1.5},${BASE - wallH} ${hse.x + hse.w + 1.5},${BASE - wallH} ${hse.x + hse.w / 2},${BASE - hse.h}`} fill={ROOFS[i % 2]} />
      {#if i % 3 === 0}
        <rect x={hse.x + hse.w * 0.75} y={BASE - hse.h - 2} width="1.6" height={hse.h * 0.38} fill="#4a4038" />
      {/if}
    {/each}

    <!-- clock tower: WSU-style brick campanile — the town's one landmark -->
    <!-- plinth grounds the shaft -->
    <rect x="601" y={BASE - 2} width="12" height="2" fill="#8f4832" />
    <!-- shaft with lit left edge + shadowed right edge for round-tower depth -->
    <rect x="602.5" y={BASE - 36} width="9" height="34" fill="#a8553a" />
    <rect x="602.5" y={BASE - 36} width="2" height="34" fill="#c56a46" opacity="0.5" />
    <rect x="608.5" y={BASE - 36} width="3" height="34" fill="#8f4832" opacity="0.6" />
    <!-- cream cornice between shaft and belfry -->
    <rect x="601" y={BASE - 38} width="12" height="2.6" fill="#ede6da" />
    <!-- belfry with the clock face set into it -->
    <rect x="601.5" y={BASE - 50} width="11" height="11" fill="#b85c3a" />
    <circle cx="607" cy={BASE - 44.5} r="4" fill="#ede6da" stroke="#54606e" stroke-width="0.9" />
    <line x1="607" y1={BASE - 44.5} x2="607" y2={BASE - 48} stroke="#54606e" stroke-width="0.8" stroke-linecap="round" />
    <line x1="607" y1={BASE - 44.5} x2="609.2" y2={BASE - 43.6} stroke="#54606e" stroke-width="0.8" stroke-linecap="round" />
    <!-- flat top: the belfry cornice caps the tower, Bryan Hall is flat-roofed -->
    <rect x="599.5" y={BASE - 52.5} width="15" height="2.8" fill="#ede6da" />

    <!-- a few terrace trees -->
    <g fill="#2f4a22">
      {#each CONIF_X as x (x)}
        <polygon points={`${x - 3},${BASE} ${x},${BASE - 15} ${x + 3},${BASE}`} />
      {/each}
    </g>
  </g>

  <!-- chimney smoke curling up from the town -->
  <g class="smoke" fill="#d8d2c7">
    <circle class="puff" cx="538" cy="231" r="2.2" />
    <circle class="puff puff-b" cx="538" cy="231" r="2.6" />
    <circle class="puff puff-c" cx="538" cy="231" r="2" />
  </g>

  <!-- the next gold ridge rises immediately behind (in front of) the town,
       hemming it in -->
  <path d="M-40,298 C140,270 330,302 470,282 C540,272 590,260 640,258 C720,256 820,288 1000,270 L1240,288 L1240,540 L-40,540 Z" fill="#d2a04c" />

  <!-- foreground giants: green, then gold wheat -->
  <path d="M-40,378 C160,346 400,386 600,352 S900,386 1100,350 L1240,370 L1240,540 L-40,540 Z" fill="#6f8f4a" />
  <path d="M-40,462 C200,434 480,472 700,448 S1040,474 1240,452 L1240,540 L-40,540 Z" fill="#d9a95c" />

  <!-- soft fold shadows that sell the roll -->
  <g fill="#000000">
    <ellipse cx="340" cy="150" rx="260" ry="8" opacity="0.07" />
    <ellipse cx="820" cy="196" rx="300" ry="8" opacity="0.07" />
    <ellipse cx="300" cy="286" rx="280" ry="9" opacity="0.07" />
    <ellipse cx="560" cy="372" rx="380" ry="10" opacity="0.07" />
    <ellipse cx="640" cy="460" rx="420" ry="10" opacity="0.07" />
  </g>

  <!-- wheat furrows + low corner clusters -->
  <g stroke="#c08f47" stroke-width="2.5" fill="none" opacity="0.45">
    <path d="M60,504 C240,496 460,510 700,502 S1030,512 1180,504 M40,528 C260,518 520,532 780,524 S1100,532 1220,526" />
  </g>
  <g fill="#24421f">
    <circle cx="10" cy="530" r="52" />
    <circle cx="96" cy="544" r="44" />
    <circle cx="1180" cy="532" r="48" />
    <circle cx="1096" cy="546" r="40" />
  </g>
</svg>

<style>
  .cloud-a {
    animation: drift-a 60s ease-in-out infinite alternate;
  }
  .cloud-b {
    animation: drift-b 82s ease-in-out infinite alternate;
  }
  @keyframes drift-a {
    from {
      transform: translateX(-30px);
    }
    to {
      transform: translateX(55px);
    }
  }
  @keyframes drift-b {
    from {
      transform: translateX(35px);
    }
    to {
      transform: translateX(-45px);
    }
  }
  .puff {
    transform-box: fill-box;
    transform-origin: center;
    animation: rise 6s linear infinite;
  }
  .puff-b {
    animation-delay: 2s;
  }
  .puff-c {
    animation-delay: 4s;
  }
  @keyframes rise {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.6);
    }
    20% {
      opacity: 0.45;
    }
    100% {
      opacity: 0;
      transform: translate(-7px, -26px) scale(1.7);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cloud-a,
    .cloud-b,
    .puff {
      animation: none;
    }
    .puff {
      opacity: 0;
    }
  }
</style>
