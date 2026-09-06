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
      <polygon points={`{hse.x - 1.5},${BASE - wallH} {hse.x + hse.w + 1.5},${BASE - wallH} {hse.x + hse.w / 2},${BASE - hse.h}`} fill={ROOFS[i % 2]} />
      {#if i % 3 === 0}
        <rect x={hse.x + hse.w * 0.75} y={BASE - hse.h - 2} width="1.6" height={hse.h * 0.38} fill="#4a4038" />
      {/if}
    {/each}

    <!-- clock tower: simple clean campanile silhouette, no muddy detail -->
    <rect x="603.5" y={BASE - 36} width="7" height="36" fill="#a8553a" />
    <rect x="600" y={BASE - 44} width="14" height="8" fill="#ede6da" />
    <polygon points={`599,${BASE - 44} 607,${BASE - 58} 615,${BASE - 44}`} fill="#54606e" />

    <!-- a few terrace trees -->
    <g fill="#2f4a22">
      {#each CONIF_X as x (x)}
        <polygon points={`{x - 3},${BASE} {x},${BASE - 15} {x + 3},${BASE}`} />
      {/each}
    </g>
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
