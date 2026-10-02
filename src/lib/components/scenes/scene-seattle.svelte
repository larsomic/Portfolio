<script lang="ts">
  // Seattle — golden-hour Elliott Bay, from the sunset photo.
  // ONE single-summit massif (Rainier) with its apex at left (x=380) so it
  // clears the Needle, ridge teeth descending to both edges — no saddle, no
  // second peak.
  // Layers: sky → snow massif → foothills →
  // forest ridge → amber skyline + Needle → glowing pier → teal water → ferry.
</script>

<svg class="h-full w-full" viewBox="0 0 1200 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky-seattle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9cdb2" />
      <stop offset="0.55" stop-color="#e1a17b" />
      <stop offset="1" stop-color="#d98f74" />
    </linearGradient>
    <linearGradient id="water-seattle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5e7f8e" />
      <stop offset="1" stop-color="#4c6c7d" />
    </linearGradient>
    <radialGradient id="sun-glow-seattle">
      <stop offset="0" stop-color="#fff2d6" stop-opacity="0.85" />
      <stop offset="0.45" stop-color="#ffd9a1" stop-opacity="0.45" />
      <stop offset="1" stop-color="#ffd9a1" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- warm cloudless sunset sky -->
  <rect width="1200" height="540" fill="url(#sky-seattle)" />

  <!-- low golden-hour sun with a soft halo (centered so it survives the
       mobile slice-crop) -->
  <circle cx="700" cy="120" r="58" fill="url(#sun-glow-seattle)" />
  <circle cx="700" cy="120" r="17" fill="#ffe9c6" opacity="0.95" />

  <!-- ONE snow massif: single summit shifted left to x=380 so it clears the
       Needle (x=600); jagged ridge teeth descend monotonically to both edges,
       never a second peak -->
  <path d="M-220,430 L-150,418 L-70,404 L10,390 L80,372 L140,344 L190,306 L230,262 L250,244 L270,250 L290,226 L315,232 L335,198 L355,206 L380,150 L405,190 L420,180 L445,225 L470,216 L500,262 L540,254 L580,286 L630,302 L700,332 L780,358 L870,386 L980,406 L1090,414 L1200,420 L1200,432 L-220,432 Z" fill="#a99bae" />
  <!-- one continuous snowfield cap over the single summit, blush from the low sun -->
  <path d="M315,232 L335,198 L355,206 L380,150 L405,190 L420,180 L445,225 L430,262 L410,240 L390,268 L375,245 L358,270 L340,242 L325,262 Z" fill="#e0b4a8" />
  <!-- cool shadow streaks flanking the summit -->
  <g fill="#ac9fb0" opacity="0.75">
    <path d="M380,150 L398,192 L386,188 L394,214 L377,198 Z" />
    <path d="M380,150 L363,196 L370,204 L357,210 Z" />
  </g>

  <!-- purple-brown foothills below the snow line -->
  <path d="M0,380 C120,360 260,392 420,378 C560,366 700,388 860,372 C1000,360 1120,384 1200,370 L1200,434 L0,434 Z" fill="#7a646e" />
  <!-- forested ridge (dark olive) -->
  <path d="M0,412 C140,398 300,420 460,408 C620,398 780,418 940,406 C1080,398 1150,412 1200,406 L1200,462 L0,462 Z" fill="#4b504a" />

  <!-- downtown skyline, faces lit amber by the setting sun -->
  <g>
    <!-- small warm mid-rises, left -->
    <rect x="90" y="372" width="34" height="86" fill="#b8764f" />
    <rect x="140" y="345" width="44" height="113" fill="#c18152" />
    <rect x="200" y="380" width="30" height="78" fill="#b06f4a" />
    <!-- tall glowing slab tower, left-center -->
    <rect x="370" y="268" width="52" height="190" fill="#e8a75d" />
    <rect x="386" y="258" width="20" height="10" fill="#d9975f" />
    <!-- mid-blocks around the Needle's base -->
    <rect x="440" y="340" width="40" height="118" fill="#dd9a5c" />
    <rect x="490" y="370" width="30" height="88" fill="#c9885a" />
    <rect x="520" y="382" width="34" height="76" fill="#d18e57" />
    <rect x="640" y="372" width="36" height="86" fill="#d9975f" />
    <rect x="684" y="352" width="28" height="106" fill="#c88253" />
    <!-- tall tower right, with rooftop structure -->
    <rect x="840" y="285" width="46" height="173" fill="#e3a05f" />
    <rect x="852" y="272" width="22" height="13" fill="#d08f55" />
    <!-- stepped shadowed cluster, far right: mauve facades + lit ochre edges -->
    <rect x="980" y="330" width="40" height="128" fill="#9c8a94" />
    <rect x="980" y="330" width="4" height="128" fill="#e0a458" />
    <rect x="1030" y="300" width="50" height="158" fill="#9c8a94" />
    <rect x="1030" y="300" width="4" height="158" fill="#e0a458" />
    <rect x="1092" y="350" width="44" height="108" fill="#8f7d87" />
    <rect x="1092" y="350" width="4" height="108" fill="#d99c55" />
    <rect x="1146" y="385" width="36" height="73" fill="#8f7d87" />
    <rect x="1146" y="385" width="4" height="73" fill="#d99c55" />
  </g>

  <!-- Space Needle, centered; saucer just below the frame's midline; Rainier sits clear to the left -->
  <g>
    <rect x="598.2" y="270" width="3.6" height="170" fill="#6e6b66" />
    <rect x="599" y="196" width="2" height="40" fill="#e5ddd0" />
    <circle class="beacon" cx="600" cy="193" r="2.4" fill="#fff4d6" />
    <path d="M594,262 L597.5,238 L602.5,238 L606,262 Z" fill="#efe9de" />
    <ellipse cx="600" cy="270" rx="34" ry="10" fill="#f2ece1" />
    <ellipse cx="600" cy="270" rx="28" ry="4" fill="#3a4250" />
    <!-- fringe of fins under the saucer rim -->
    <g stroke="#e5ddd0" stroke-width="2">
      <path d="M570,276 L570,282 M580,279 L580,285 M590,280.7 L590,286.7 M600,281 L600,287 M610,280.7 L610,286.7 M620,279 L620,285 M630,276 L630,282" />
    </g>
    <!-- concave legs sweeping to the waist, flaring at the base -->
    <g stroke="#efe9de" stroke-width="3.5" fill="none" stroke-linecap="round">
      <path d="M580,278 C591,325 595,360 595,395 C595,415 590,430 578,442" />
      <path d="M620,278 C609,325 605,360 605,395 C605,415 610,430 622,442" />
    </g>
    <ellipse cx="600" cy="395" rx="12" ry="3" fill="#efe9de" />
    <!-- V cross-braces -->
    <g stroke="#e5ddd0" stroke-width="1.5" fill="none">
      <path d="M600,292 L589,335 M600,292 L611,335" />
      <path d="M600,415 L585,437 M600,415 L615,437" />
    </g>
  </g>

  <!-- long low pier/warehouse line with warm glowing lights along the water's edge -->
  <rect x="60" y="448" width="1080" height="7" fill="#3e3a38" />
  <path class="pier" d="M66,451 L1134,451" stroke="#f7c87e" stroke-width="3" stroke-dasharray="3 37" opacity="0.9" />

  <!-- bay water -->
  <rect x="0" y="460" width="1200" height="80" fill="url(#water-seattle)" />
  <g class="shimmer" stroke="#dbe4ec" stroke-width="1.5" fill="none" opacity="0.15">
    <path d="M80,478 q20,-6 40,0 t40,0 M420,500 q20,-6 40,0 t40,0 M860,486 q20,-6 40,0 t40,0 M240,525 q20,-6 40,0 t40,0" />
  </g>

  <!-- sun-glitter: broken gold reflection running down the bay under the sun -->
  <g class="glitter" fill="#ffe3b0">
    <rect x="678" y="466" width="44" height="2" rx="1" />
    <rect x="684" y="476" width="34" height="2" rx="1" />
    <rect x="674" y="486" width="52" height="2" rx="1" />
    <rect x="682" y="497" width="38" height="2" rx="1" />
    <rect x="672" y="508" width="56" height="2" rx="1" />
    <rect x="684" y="519" width="34" height="2" rx="1" />
    <rect x="676" y="530" width="48" height="2" rx="1" />
  </g>

  <!-- ferry, lower-left third: dark hull, white superstructure -->
  <g class="ferry">
    <path d="M240,494 L412,494 L396,512 L252,512 Z" fill="#2c3238" />
    <rect x="268" y="478" width="112" height="16" rx="2" fill="#f2f2ee" />
    <rect x="286" y="468" width="46" height="10" rx="2" fill="#f2f2ee" />
    <path d="M356,466 L368,466 L364,478 L352,478 Z" fill="#b8aca0" />
    <path d="M276,486 L372,486" stroke="#5a626a" stroke-width="2.5" stroke-dasharray="3 5" />
  </g>

  <!-- a small sailboat in the bay below the skyline (centered for mobile) -->
  <g class="sailboat">
    <path d="M557,470 L557,499 L543,499 Z" fill="#f2f2ee" />
    <path d="M560,476 L560,499 L574,499 Z" fill="#e6e0d4" />
    <line x1="557" y1="469" x2="557" y2="500" stroke="#6b5f54" stroke-width="1" />
    <path d="M541,500 L575,500 L569,508 L547,508 Z" fill="#2c3238" />
  </g>
</svg>

<style>
  .ferry {
    animation: ferry 26s ease-in-out infinite alternate;
  }
  @keyframes ferry {
    from {
      transform: translateX(-18px) translateY(0);
    }
    to {
      transform: translateX(34px) translateY(-2px);
    }
  }
  .beacon {
    animation: beacon 2.4s ease-in-out infinite;
  }
  @keyframes beacon {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }
  .shimmer {
    animation: shimmer 5s ease-in-out infinite;
  }
  @keyframes shimmer {
    0%,
    100% {
      opacity: 0.1;
    }
    50% {
      opacity: 0.24;
    }
  }
  .pier {
    animation: pier 3.6s ease-in-out infinite;
  }
  @keyframes pier {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
  .sailboat {
    animation: sail 34s ease-in-out infinite alternate;
  }
  @keyframes sail {
    from {
      transform: translate(0, 0);
    }
    to {
      transform: translate(-44px, -2px);
    }
  }
  .glitter rect {
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0.5;
    animation: glint 3s ease-in-out infinite;
  }
  .glitter rect:nth-child(2) {
    animation-delay: 0.5s;
  }
  .glitter rect:nth-child(3) {
    animation-delay: 1s;
  }
  .glitter rect:nth-child(4) {
    animation-delay: 0.3s;
  }
  .glitter rect:nth-child(5) {
    animation-delay: 0.8s;
  }
  .glitter rect:nth-child(6) {
    animation-delay: 1.3s;
  }
  .glitter rect:nth-child(7) {
    animation-delay: 0.6s;
  }
  @keyframes glint {
    0%,
    100% {
      opacity: 0.2;
      transform: scaleX(0.82);
    }
    50% {
      opacity: 0.65;
      transform: scaleX(1.05);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ferry,
    .beacon,
    .shimmer,
    .pier,
    .sailboat,
    .glitter rect {
      animation: none;
    }
    .glitter rect {
      opacity: 0.4;
    }
  }
</style>
