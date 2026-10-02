<script lang="ts">
  const bigScallops = Array.from({ length: 20 }, () => 'a30,20 0 0 1 60,0').join(' ');
  const smallScallops = Array.from({ length: 31 }, () => 'a20,14 0 0 1 40,0').join(' ');

  // Denver, postcard-style: the city rising out of a green tree canopy,
  // then three hazed blue ridges
  // stacking up into a bright cirrus-streaked sky. Sharp geometry = city,
  // soft geometry = mountains. No snow — this is the front range in summer.
</script>

<svg
  class="h-full w-full"
  viewBox="0 0 1200 540"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="sky-denver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5ea6e0" />
      <stop offset="0.55" stop-color="#8cc3ea" />
      <stop offset="1" stop-color="#c8e1f4" />
    </linearGradient>
    <!-- contrail: opaque at the tail, fading to nothing behind -->
    <linearGradient id="contrail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="1200" height="540" fill="url(#sky-denver)" />

  <!-- thin cirrus wisps, plus a denser pale band hugging the summit line -->
  <g class="cirrus" fill="#eaf4fb">
    <ellipse cx="300" cy="58" rx="140" ry="7" opacity="0.35" />
    <ellipse cx="228" cy="92" rx="90" ry="5" opacity="0.28" />
    <ellipse cx="720" cy="48" rx="160" ry="8" opacity="0.4" />
    <ellipse cx="905" cy="110" rx="110" ry="6" opacity="0.3" />
    <ellipse cx="520" cy="128" rx="120" ry="5" opacity="0.25" />
    <ellipse cx="400" cy="178" rx="380" ry="16" fill="#dcebf8" opacity="0.55" />
  </g>

  <!-- farthest range: huge periwinkle dome-massif to the left, triangular
       twin on the right with a saddle between -->
  <path
    d="M0,300 L60,262 L140,212 L230,182 L324,169 L420,232 L480,206 L576,196 L660,232 L760,262 L840,292 L936,302 L1056,202 L1150,252 L1200,272 L1200,540 L0,540 Z"
    fill="#a9bedd"
  />
  <g stroke="#98add2" stroke-width="2" fill="none" opacity="0.6">
    <path d="M324,169 L310,240 M480,206 L470,270 M576,196 L588,270 M1056,202 L1046,270" />
  </g>

  <!-- mid-blue ridge with broad V saddles -->
  <path
    d="M0,340 L120,260 L260,320 L380,292 L520,330 L660,272 L800,330 L920,302 L1050,340 L1200,312 L1200,540 L0,540 Z"
    fill="#7a9bcb"
  />

  <!-- dark dusty-blue ridge: peak just left of center, shoulder rising right -->
  <path
    d="M0,380 L120,342 L240,370 L330,344 L420,285 L520,332 L640,360 L760,342 L900,302 L1020,286 L1100,302 L1200,292 L1200,540 L0,540 Z"
    fill="#4e6ea8"
  />

  <!-- a distant airliner climbing out of DIA, trailing a contrail -->
  <g class="airliner">
    <rect x="613" y="69.2" width="92" height="1.6" rx="0.8" fill="url(#contrail)" />
    <g fill="#3f4b55">
      <path
        d="M585,70 C590,68.5 606,68.6 613,69 C614,69.3 614,70.7 613,71 C606,71.4 590,71.5 585,70 Z"
      />
      <path d="M600,70 L611,76 L607,70 Z" />
      <path d="M600,70 L611,64 L607,70 Z" />
      <path d="M609,70 L614,65.5 L612.5,70 Z" />
    </g>
  </g>

  <!-- downtown skyline: rectilinear slabs, light from upper-left -->
  <g>
    <rect x="78" y="356" width="28" height="120" fill="#3a4e58" />
    <rect x="112" y="346" width="26" height="130" fill="#3a4e58" />
    <!-- signature tower: deep teal glass with a rounded crown -->
    <path d="M228,476 L228,282 Q228,260 249,260 Q270,260 270,282 L270,476 Z" fill="#26424b" />
    <rect x="231" y="270" width="5" height="206" fill="#3e5d66" opacity="0.8" />
    <!-- pale cream slab with vertical pinstripes -->
    <rect x="318" y="270" width="42" height="206" fill="#e9e7dd" />
    <rect x="352" y="270" width="8" height="206" fill="#c9cfc8" />
    <g stroke="#cfd4cd" stroke-width="1.5">
      <path d="M328,276 L328,470 M338,276 L338,470 M346,276 L346,470" />
    </g>
    <rect x="340" y="332" width="32" height="144" fill="#42585f" />
    <rect x="390" y="336" width="36" height="140" fill="#5d7f8c" />
    <rect x="440" y="358" width="26" height="118" fill="#dfe4e2" />
    <!-- stepped taupe tower -->
    <rect x="492" y="348" width="36" height="128" fill="#8a8478" />
    <rect x="498" y="330" width="24" height="18" fill="#8a8478" />
    <rect x="504" y="316" width="12" height="14" fill="#8a8478" />
    <!-- white grid-facade tower -->
    <rect x="564" y="330" width="36" height="146" fill="#dde3e3" />
    <g stroke="#c2cacb" stroke-width="1.5">
      <path d="M564,352 L600,352 M564,378 L600,378 M564,404 L600,404 M564,430 L600,430" />
    </g>
    <rect x="624" y="350" width="36" height="126" fill="#6b6257" />
    <!-- teal reflective slab -->
    <rect x="696" y="317" width="36" height="159" fill="#4f7a82" />
    <rect x="700" y="322" width="4" height="150" fill="#9fb7bd" opacity="0.7" />
    <!-- tallest right-side tower with small dark crown box -->
    <rect x="738" y="286" width="36" height="190" fill="#253c47" />
    <rect x="748" y="271" width="16" height="15" fill="#1f333c" />
    <!-- stepped pale towers descending -->
    <rect x="780" y="330" width="26" height="146" fill="#aebdc4" />
    <rect x="806" y="346" width="20" height="130" fill="#aebdc4" />
    <rect x="826" y="362" width="14" height="114" fill="#aebdc4" />
    <!-- striped pale cluster -->
    <rect x="876" y="340" width="28" height="136" fill="#c6cfd2" />
    <rect x="906" y="330" width="30" height="146" fill="#c6cfd2" />
    <rect x="938" y="350" width="26" height="126" fill="#c6cfd2" />
    <rect x="966" y="340" width="26" height="136" fill="#c6cfd2" />
    <g stroke="#8fa0a8" stroke-width="1.5">
      <path d="M884,346 L884,470 M914,336 L914,470 M924,336 L924,470 M946,356 L946,470 M974,346 L974,470" />
    </g>
    <rect x="1010" y="364" width="90" height="112" fill="#3e515b" />
    <rect x="1130" y="398" width="40" height="78" fill="#8a6a5c" />
  </g>

  <!-- tree canopy belt the city rises out of: two scalloped rows + crowns -->
  <path
    d="M0,540 L0,470 {bigScallops} L1200,540 Z"
    fill="#24421f"
  />
  <path
    d="M-20,540 L-20,486 {smallScallops} L1220,540 Z"
    fill="#3c5a2b"
  />
  <!-- sunlit crowns catching the light -->
  <g fill="#6b8440" opacity="0.75">
    <circle cx="30" cy="452" r="18" />
    <circle cx="58" cy="462" r="14" />
    <circle cx="1180" cy="450" r="18" />
    <circle cx="1150" cy="462" r="13" />
    <circle cx="330" cy="470" r="11" />
    <circle cx="640" cy="472" r="10" />
    <circle cx="870" cy="468" r="12" />
  </g>
</svg>

<style>
  .cirrus {
    animation: cirrus 72s ease-in-out infinite alternate;
  }
  @keyframes cirrus {
    from {
      transform: translateX(-28px);
    }
    to {
      transform: translateX(48px);
    }
  }
  .airliner {
    animation: airliner 58s linear infinite;
  }
  @keyframes airliner {
    from {
      transform: translateX(680px);
    }
    to {
      transform: translateX(-760px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cirrus {
      animation: none;
    }
    .airliner {
      animation: none;
      transform: translateX(-120px);
    }
  }
</style>
