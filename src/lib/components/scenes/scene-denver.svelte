<script lang="ts">
  // The Rockies — Denver's front range: jagged snow-capped peaks and pines.
</script>

<svg
  class="h-full w-full"
  viewBox="0 0 1200 540"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="sky-denver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a90d1" />
      <stop offset="1" stop-color="#cfe6f8" />
    </linearGradient>
  </defs>
  <rect width="1200" height="540" fill="url(#sky-denver)" />
  <!-- birds -->
  <g stroke="#5b7893" stroke-width="2" fill="none" opacity="0.6">
    <path d="M240,110 q8,-8 16,0 q8,-8 16,0" />
    <path d="M330,150 q6,-6 12,0 q6,-6 12,0" />
  </g>
  <!-- far jagged peaks -->
  <polygon
    points="0,430 150,250 260,350 400,190 520,340 650,220 800,370 950,240 1100,360 1200,310 1200,540 0,540"
    fill="#7d97ad"
  />
  <!-- snow caps -->
  <g fill="#eef4f8">
    <polygon points="400,190 372,235 400,226 428,235" />
    <polygon points="650,220 626,258 650,250 674,258" />
    <polygon points="950,240 928,275 950,268 972,275" />
  </g>
  <!-- mid range -->
  <polygon
    points="0,480 180,340 330,440 500,300 680,430 850,330 1050,450 1200,390 1200,540 0,540"
    fill="#6d7f5b"
  />
  <!-- Denver skyline at the foot of the range -->
  <g fill="#9aa7b2">
    <rect x="460" y="455" width="24" height="65" />
    <rect x="580" y="438" width="26" height="82" />
    <rect x="740" y="450" width="28" height="70" />
    <rect x="806" y="468" width="22" height="52" />
  </g>
  <!-- Republic Plaza with its pointed crown -->
  <g fill="#c2ccd6">
    <rect x="516" y="404" width="34" height="116" />
    <polygon points="516,404 533,382 550,404" />
  </g>
  <!-- the blue-glass triangle building -->
  <polygon points="640,520 700,520 700,428" fill="#8fb8d8" />
  <polygon points="640,520 700,428 668,520" fill="#a9cbe4" opacity="0.8" />
  <!-- evergreen treeline -->
  <rect x="0" y="500" width="1200" height="40" fill="#243c29" />
  <g fill="#2d4a33">
    {#each Array.from({ length: 24 }) as _, j (j)}
      <polygon points="{j * 52 + 6},510 {j * 52 + 26},440 {j * 52 + 46},510" />
    {/each}
  </g>
  <!-- elk watching the range -->
  <g fill="#1e3326">
    <ellipse cx="150" cy="502" rx="38" ry="15" />
    <path d="M178,494 L196,462 L206,464 L192,496 Z" />
    <ellipse cx="203" cy="458" rx="9" ry="6" transform="rotate(-20 203 458)" />
    <g stroke="#1e3326" stroke-width="2.5" fill="none">
      <path d="M200,452 L192,430 M192,430 L186,426 M192,430 L194,420 M206,452 L214,432 M214,432 L210,424 M214,432 L220,426" />
    </g>
    <rect x="122" y="510" width="4" height="30" />
    <rect x="138" y="510" width="4" height="30" />
    <rect x="164" y="510" width="4" height="30" />
    <rect x="176" y="510" width="4" height="30" />
  </g>
</svg>
