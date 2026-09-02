<script lang="ts">
  // Puget Sound — Seattle rain, the Space Needle, and (looking ahead)
  // Pikes Peak rising in the distance: a hint of the move to come.
</script>

<svg
  class="h-full w-full"
  viewBox="0 0 1200 540"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="sky-seattle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5c738a" />
      <stop offset="1" stop-color="#a7bacb" />
    </linearGradient>
  </defs>
  <rect width="1200" height="540" fill="url(#sky-seattle)" />
  <!-- Pikes Peak (double granite summit), snow-streaked -->
  <path d="M180,410 L520,70 L600,150 L700,410 Z" fill="#8ca0b3" />
  <path d="M600,410 L780,190 L960,410 Z" fill="#7f95aa" opacity="0.9" />
  <g fill="#eef4f8">
    <path d="M520,70 L480,140 L505,132 L530,165 L555,130 L578,148 L600,150 Z" />
    <path
      d="M780,190 L750,245 L768,238 L785,260 L802,236 L816,250 L830,240 Z"
    />
  </g>
  <!-- rock fissures -->
  <g stroke="#6a7f93" stroke-width="2" fill="none" opacity="0.5">
    <path d="M500,220 L470,330 M560,210 L575,330 M770,280 L755,360" />
  </g>
  <!-- Olympic range -->
  <path
    d="M0,410 C150,370 320,400 520,390 S920,368 1200,400 L1200,430 L0,430 Z"
    fill="#5c7286"
  />
  <!-- rain hint -->
  <g stroke="#dbe4ec" stroke-width="1.5" opacity="0.18">
    <path
      d="M120,60 L108,110 M320,40 L308,90 M900,70 L888,120 M1080,50 L1068,100 M220,150 L208,200 M1050,180 L1038,230"
    />
  </g>
  <!-- water -->
  <rect x="0" y="430" width="1200" height="110" fill="#3d5a72" />
  <g stroke="#dbe4ec" stroke-width="2" fill="none" opacity="0.25">
    <path d="M60,470 q20,-8 40,0 t40,0 M420,490 q20,-8 40,0 t40,0 M860,475 q20,-8 40,0 t40,0" />
  </g>
  <!-- ferry -->
  <g fill="#2f4457">
    <path d="M140,480 h130 l-18,22 h-96 Z" />
    <rect x="168" y="462" width="52" height="18" rx="2" />
  </g>
  <!-- downtown skyline behind the Needle -->
  <g fill="#4b6076" opacity="0.95">
    <rect x="1030" y="368" width="22" height="62" />
    <rect x="1064" y="280" width="38" height="150" />
    <rect x="1072" y="266" width="22" height="16" />
    <rect x="1110" y="340" width="20" height="90" />
    <polygon points="1110,340 1120,318 1130,340" />
    <rect x="1138" y="372" width="18" height="58" />
    <rect x="1166" y="390" width="22" height="40" />
  </g>
  <g fill="#dbe4ec" opacity="0.35">
    <rect x="1070" y="292" width="4" height="126" />
    <rect x="1082" y="292" width="4" height="126" />
    <rect x="1114" y="352" width="4" height="70" />
  </g>
  <!-- Space Needle -->
  <g fill="#42566b">
    <path d="M963,430 L977,315 L983,315 L997,430 Z" />
    <rect x="974" y="255" width="12" height="60" />
    <ellipse cx="980" cy="313" rx="46" ry="10" />
    <rect x="978.5" y="228" width="3" height="30" />
  </g>
  <!-- Great Wheel on the pier -->
  <g stroke="#2f4457" stroke-width="3" fill="none">
    <circle cx="300" cy="440" r="30" />
    <path d="M300,410 L300,470 M270,440 L330,440 M279,419 L321,461 M279,461 L321,419" />
    <path d="M288,468 L300,440 L312,468 M282,480 L288,468 M318,480 L312,468" />
  </g>
  <circle cx="300" cy="440" r="4" fill="#2f4457" />
</svg>
