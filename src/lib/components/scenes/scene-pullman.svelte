<script lang="ts">
  // Pullman, WA — composed from four reference photos (static/for_llm/):
  //   clock_tower    → the WSU campanile: brick shaft with blind-arch panels, cream
  //                    cornices with dentils + corbels, white Roman-numeral dial,
  //                    corner finials + flagpole
  //   pullman.jpeg   → azure sky hazing to pale gold, golden Palouse ridges, campus
  //                    blocks, scalloped foreground canopy
  //   rolling_hills  → quilted wheat hills: chartreuse crescents on crests, deep
  //                    green troughs, a brown shadowed dome, tiny hilltop chapel
  //   martin_stadium → gray tiered horseshoe, glass press box, lattice light towers,
  //                    crimson end zones

  // Foreground canopy blobs (rounded broadleaf canopies).
  interface Blob { x: number; y: number; r: number; c: string }
  const CANOPY: Blob[] = [
    { x: -10, y: 486, r: 34, c: "#4a6b32" },
    { x: 52, y: 496, r: 30, c: "#5e833c" },
    { x: 118, y: 488, r: 36, c: "#4a6b32" },
    { x: 186, y: 500, r: 28, c: "#6e9b4e" },
    { x: 250, y: 492, r: 32, c: "#5e833c" },
    { x: 322, y: 502, r: 26, c: "#6e9b4e" },
    { x: 392, y: 494, r: 30, c: "#4a6b32" },
    { x: 470, y: 504, r: 26, c: "#6e9b4e" },
    { x: 540, y: 496, r: 30, c: "#5e833c" },
    { x: 618, y: 506, r: 26, c: "#6e9b4e" },
    { x: 690, y: 496, r: 30, c: "#4a6b32" },
    { x: 766, y: 506, r: 26, c: "#5e833c" },
    { x: 840, y: 494, r: 32, c: "#4a6b32" },
    { x: 916, y: 504, r: 28, c: "#6e9b4e" },
    { x: 986, y: 492, r: 34, c: "#4a6b32" },
    { x: 1058, y: 502, r: 28, c: "#5e833c" },
    { x: 1124, y: 490, r: 34, c: "#4a6b32" },
    { x: 1196, y: 498, r: 30, c: "#5e833c" },
  ];

  // Sunlit lime highlights on top of the canopy.
  const HIGHLIGHTS: Blob[] = [
    { x: 52, y: 476, r: 12, c: "#90b25a" },
    { x: 186, y: 481, r: 11, c: "#90b25a" },
    { x: 322, y: 483, r: 10, c: "#90b25a" },
    { x: 470, y: 485, r: 11, c: "#90b25a" },
    { x: 618, y: 487, r: 10, c: "#90b25a" },
    { x: 766, y: 487, r: 10, c: "#90b25a" },
    { x: 916, y: 485, r: 11, c: "#90b25a" },
    { x: 1058, y: 483, r: 10, c: "#90b25a" },
  ];

  // Pointed conifers and blue spruce mixed into the canopy band.
  const CONIFERS = [
    { x: 20, w: 26, h: 64, c: "#2f4a33" },
    { x: 152, w: 22, h: 56, c: "#6c8c96" },
    { x: 292, w: 26, h: 62, c: "#2f4a33" },
    { x: 430, w: 20, h: 52, c: "#6c8c96" },
    { x: 585, w: 24, h: 58, c: "#2f4a33" },
    { x: 720, w: 20, h: 54, c: "#6c8c96" },
    { x: 872, w: 26, h: 62, c: "#2f4a33" },
    { x: 1000, w: 22, h: 56, c: "#2f4a33" },
    { x: 1090, w: 20, h: 52, c: "#6c8c96" },
    { x: 1170, w: 26, h: 64, c: "#2f4a33" },
  ];
</script>

<svg
  class="h-full w-full"
  viewBox="0 0 1200 540"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="sky-pullman" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a82ae" />
      <stop offset="0.55" stop-color="#afc6da" />
      <stop offset="0.85" stop-color="#e3e0cf" />
    </linearGradient>
  </defs>

  <!-- ===== SKY (azure haze fading warm at the horizon) ===== -->
  <rect width="1200" height="540" fill="url(#sky-pullman)" />
  <g fill="#ffffff" opacity="0.7">
    <ellipse cx="130" cy="72" rx="34" ry="11" />
    <ellipse cx="158" cy="64" rx="24" ry="9" />
    <ellipse cx="104" cy="64" rx="18" ry="8" />
    <ellipse cx="960" cy="52" rx="30" ry="9" />
    <ellipse cx="986" cy="45" rx="20" ry="8" />
  </g>

  <!-- ===== DISTANT PALOUSE (hazy ridges flattened by haze) ===== -->
  <path
    d="M0,300 C120,286 260,296 400,288 C560,278 700,268 850,282 C1000,292 1100,286 1200,292 L1200,348 L0,348 Z"
    fill="#b4bfc6"
    opacity="0.75"
  />
  <path
    d="M0,318 C150,302 300,312 480,305 C650,298 820,308 1000,300 C1100,296 1150,300 1200,304 L1200,364 L0,364 Z"
    fill="#c6b795"
    opacity="0.9"
  />

  <!-- ===== ROLLING HILLS (quilted wheat country) ===== -->
  <path
    d="M0,372 C140,332 300,360 460,342 S760,374 900,350 S1120,372 1200,354 L1200,540 L0,540 Z"
    fill="#8fb13c"
  />
  <!-- chartreuse crescents glowing on the sun-facing crests -->
  <g fill="#c8d94f" opacity="0.55">
    <path d="M210,346 C280,336 350,342 420,352 C350,352 275,352 210,346 Z" />
    <path d="M560,356 C630,346 700,352 760,362 C690,362 620,362 560,356 Z" />
    <path d="M920,352 C990,344 1060,350 1130,360 C1058,360 986,358 920,352 Z" />
  </g>
  <!-- dry tan field patches interrupting the green -->
  <g fill="#a98c5b" opacity="0.5">
    <path d="M40,378 C110,368 180,376 240,386 C170,388 100,386 40,378 Z" />
    <path d="M780,368 C840,360 900,366 950,376 C886,378 830,376 780,368 Z" />
  </g>

  <!-- big brown shadowed dome (plowed hill in shade), center-right -->
  <path
    d="M640,540 C660,432 736,392 840,402 C938,412 992,452 1012,540 Z"
    fill="#6b4a38"
  />
  <path
    d="M860,404 C920,414 970,448 990,510 C960,470 910,428 850,412 Z"
    fill="#8a5e40"
    opacity="0.7"
  />

  <!-- deep-shadow green troughs -->
  <path
    d="M0,436 C160,410 360,442 560,424 S900,448 1200,420 L1200,540 L0,540 Z"
    fill="#3e5a1f"
    opacity="0.85"
  />

  <!-- hilltop grain elevators: domed white tanks + small headhouse, seated on the ridge -->
  <g transform="translate(792 281)">
    <!-- secondary shorter tank, slightly darker -->
    <path d="M-4,30 L-4,10 a3.5,3.5 0 0 1 7,0 L3,30 Z" fill="#d9cfba" />
    <!-- main tank with domed cap -->
    <path d="M5,30 L5,-2 a5,5 0 0 1 10,0 L15,30 Z" fill="#ede7da" />
    <path d="M12.6,30 L12.6,1 a2.4,2.4 0 0 0 2.4,-1.4 L15,30 Z" fill="#d9cfba" opacity="0.8" />
    <!-- small headhouse annex with dark gable roof -->
    <rect x="16" y="14" width="8" height="16" fill="#ede7da" />
    <polygon points="15,14 20,9 25,14" fill="#8a8272" />
    <!-- conifers at its base, on the ridge line -->
    <g fill="#2f4a33">
      <polygon points="-11,30 -7.5,21 -4,30" />
      <polygon points="26,31 29.5,22 33,31" />
    </g>
  </g>

  <!-- ===== CAMPUS BAND (brick halls, pale slabs, tree stipple) ===== -->
  <g fill="#5c7247" opacity="0.9">
    <circle cx="486" cy="356" r="7" />
    <circle cx="505" cy="360" r="6" />
    <circle cx="656" cy="356" r="7" />
    <circle cx="676" cy="360" r="6" />
    <polygon points="700,364 707,344 714,364" fill="#2f4a33" />
    <polygon points="466,364 473,346 480,364" fill="#2f4a33" />
  </g>
  <!-- pale concrete slab towers near center, capped + window-striped so they read as buildings -->
  <g>
    <rect x="498" y="330" width="14" height="42" fill="#cdc5b6" />
    <rect x="496" y="327" width="18" height="3.5" rx="1" fill="#ddd6c8" />
    <rect x="516" y="338" width="11" height="34" fill="#cdc5b6" />
    <rect x="514" y="335" width="15" height="3.5" rx="1" fill="#ddd6c8" />
    <rect x="672" y="334" width="12" height="38" fill="#cdc5b6" />
    <rect x="670" y="331" width="16" height="3.5" rx="1" fill="#ddd6c8" />
    <g fill="#9a9484" opacity="0.6">
      <rect x="501" y="336" width="8" height="2.4" />
      <rect x="501" y="344" width="8" height="2.4" />
      <rect x="501" y="352" width="8" height="2.4" />
      <rect x="519" y="344" width="6" height="2.4" />
      <rect x="519" y="352" width="6" height="2.4" />
      <rect x="675" y="340" width="6" height="2.4" />
      <rect x="675" y="348" width="6" height="2.4" />
    </g>
  </g>
  <!-- brick academic blocks with bright sun-struck roofs -->
  <g>
    <rect x="526" y="350" width="30" height="22" fill="#a6503e" />
    <rect x="524" y="347" width="34" height="3.5" rx="1" fill="#eae7e0" />
    <g fill="#7c3f33">
      <rect x="530" y="356" width="4" height="6" />
      <rect x="539" y="356" width="4" height="6" />
      <rect x="548" y="356" width="4" height="6" />
    </g>
    <rect x="636" y="352" width="30" height="20" fill="#a6503e" />
    <rect x="634" y="349" width="34" height="3.5" rx="1" fill="#eae7e0" />
  </g>

  <!-- ===== THE CLOCK TOWER (from clock_tower.jpeg) ===== -->
  <g>
    <!-- shadowed left face, lit front face, narrow sunlit right face —
         shaft now ends at the upper cornice, no brick crown above it -->
    <rect x="561" y="232" width="7" height="170" fill="#6e2e2c" />
    <rect x="568" y="232" width="24" height="170" fill="#9a423e" />
    <rect x="592" y="232" width="8" height="170" fill="#b55650" />

    <!-- blind-arch panels: three recessed brick arches ending at the base cornice -->
    <g fill="#7c3431">
      <path d="M570.5,336 L570.5,320 a2.5,2.5 0 0 1 5,0 L575.5,336 Z" />
      <path d="M578,336 L578,320 a2.5,2.5 0 0 1 5,0 L583,336 Z" />
      <path d="M585.5,336 L585.5,320 a2.5,2.5 0 0 1 5,0 L590.5,336 Z" />
    </g>

    <!-- lower cornice: clean cream band + shadow + small rectangular corbel blocks -->
    <rect x="558" y="296" width="45" height="7" fill="#f4efe2" />
    <rect x="558" y="303" width="45" height="3" fill="#d9cfba" />
    <g fill="#e9e2d2">
      <rect x="561" y="306" width="2.4" height="3.5" />
      <rect x="569" y="306" width="2.4" height="3.5" />
      <rect x="577" y="306" width="2.4" height="3.5" />
      <rect x="585" y="306" width="2.4" height="3.5" />
      <rect x="593" y="306" width="2.4" height="3.5" />
    </g>

    <!-- clock stage: keystone frame + white dial -->
    <rect x="564" y="240" width="33" height="34" fill="#e9e2d2" />
    <rect x="561" y="252" width="3" height="10" fill="#f4efe2" />
    <rect x="597" y="252" width="3" height="10" fill="#f4efe2" />
    <circle cx="580.5" cy="257" r="11" fill="#faf8f2" stroke="#1a1a1e" stroke-width="1" />
    <!-- numerals reduced to hour ticks -->
    <g stroke="#1a1a1e" stroke-width="1">
      <path d="M580.5,247.5 L580.5,249.5" />
      <path d="M580.5,264.5 L580.5,266.5" />
      <path d="M571,257 L573,257" />
      <path d="M588,257 L590,257" />
    </g>
    <!-- hands: long to XII-ish, short toward V -->
    <g stroke="#1a1a1e" stroke-width="1.2">
      <path d="M580.5,257 L583,248.5" />
      <path d="M580.5,257 L586,262" />
    </g>
    <circle cx="580.5" cy="257" r="1.2" fill="#1a1a1e" />

    <!-- upper cornice: one solid cream band with a clean shadow line -->
    <rect x="557" y="232" width="46" height="7" fill="#f4efe2" />
    <rect x="557" y="239" width="46" height="2" fill="#d9cfba" />

    <!-- slim flagpole rising straight off the upper cornice — no brick crown -->
    <rect x="579.8" y="204" width="1.4" height="28" fill="#6f675c" />
    <circle cx="580.5" cy="202" r="1.8" fill="#6f675c" />
  </g>

  <!-- ground shadow so the tower + base are seated in the lawn -->
  <ellipse cx="580.5" cy="403" rx="48" ry="4.5" fill="#3e5a1f" opacity="0.5" />

  <!-- ===== TOWER BASE BUILDING (from clock_tower.jpeg) ===== -->
  <g>
    <!-- two-story brick base rising around the shaft, same light/shadow logic -->
    <rect x="540" y="336" width="81" height="66" fill="#9a423e" />
    <rect x="540" y="336" width="6" height="66" fill="#6e2e2c" />
    <rect x="615" y="336" width="6" height="66" fill="#b55650" />

    <!-- cream cornice cap capping the base -->
    <rect x="537" y="329" width="87" height="6.5" fill="#f4efe2" />
    <rect x="537" y="335.5" width="87" height="2" fill="#d9cfba" />

    <!-- row of narrow round-arched windows on the upper story -->
    <g fill="#4a2b28">
      <path d="M549,360 L549,349.5 a2.5,2.5 0 0 1 5,0 L554,360 Z" />
      <path d="M561,360 L561,349.5 a2.5,2.5 0 0 1 5,0 L566,360 Z" />
      <path d="M595,360 L595,349.5 a2.5,2.5 0 0 1 5,0 L600,360 Z" />
      <path d="M607,360 L607,349.5 a2.5,2.5 0 0 1 5,0 L612,360 Z" />
    </g>

    <!-- ground-floor windows flanking the entrance -->
    <g fill="#4a2b28" opacity="0.9">
      <rect x="548" y="386" width="5" height="14" />
      <rect x="558" y="386" width="5" height="14" />
      <rect x="598" y="386" width="5" height="14" />
      <rect x="608" y="386" width="5" height="14" />
    </g>

    <!-- white gabled portico over the recessed double doors -->
    <rect x="574" y="386" width="13" height="16" fill="#4a2b28" />
    <rect x="570.5" y="382" width="3" height="20" fill="#f4efe2" />
    <rect x="587.5" y="382" width="3" height="20" fill="#f4efe2" />
    <polygon points="567,383 580.5,373 594,383" fill="#f4efe2" />
    <rect x="567" y="383" width="27" height="1.6" fill="#d9cfba" />

    <!-- concrete walkway leading from the doors out onto the lawn -->
    <polygon points="573,402 588,402 596,416 565,416" fill="#dcd3c1" opacity="0.9" />
  </g>

  <!-- ===== MARTIN STADIUM (from martin_stadium.jpg) ===== -->
  <g transform="translate(120 356)">
    <!-- soft ground shadow seating the whole bowl on the field -->
    <ellipse cx="90" cy="60" rx="112" ry="7" fill="#3e5a1f" opacity="0.35" />

    <!-- lattice light towers flanking the far stand, clear of everything else -->
    <g fill="#c9d2d8">
      <rect x="-6" y="-56" width="2.4" height="66" />
      <rect x="-14" y="-60" width="18" height="4.5" rx="1" />
      <rect x="184" y="-56" width="2.4" height="66" />
      <rect x="177" y="-60" width="18" height="4.5" rx="1" />
    </g>

    <!-- far grandstand: one solid mass, banded tiers + vertical aisles -->
    <polygon points="6,10 174,10 170,0 10,0" fill="#8b9299" />
    <polygon points="10,0 170,0 166,-10 14,-10" fill="#565e66" />
    <polygon points="14,-10 166,-10 162,-20 18,-20" fill="#8b9299" />
    <g stroke="#2c3539" stroke-width="1" opacity="0.35">
      <path d="M30,10 L27,-20 M60,10 L58,-20 M90,10 L90,-20 M120,10 L122,-20 M150,10 L153,-20" />
    </g>

    <!-- glass press box riding on top of the grandstand mass -->
    <rect x="40" y="-22" width="3" height="2" fill="#aab4bc" />
    <rect x="137" y="-22" width="3" height="2" fill="#aab4bc" />
    <rect x="36" y="-33" width="108" height="11" rx="1.5" fill="#e7eaed" />
    <g fill="#2c3539" opacity="0.75">
      <rect x="39" y="-30.5" width="102" height="2.6" />
      <rect x="39" y="-26" width="102" height="2.6" />
    </g>
    <rect x="34" y="-36" width="112" height="3" rx="1" fill="#aab4bc" />
    <!-- the turf + crimson end zones -->
    <rect x="10" y="10" width="160" height="34" fill="#2e8b3d" />
    <rect x="10" y="10" width="14" height="34" fill="#9d1b2e" />
    <rect x="156" y="10" width="14" height="34" fill="#9d1b2e" />
    <g stroke="#ffffff" stroke-width="0.8" opacity="0.5">
      <path d="M36,10 L36,44 M50,10 L50,44 M64,10 L64,44 M78,10 L78,44 M102,10 L102,44 M116,10 L116,44 M130,10 L130,44 M144,10 L144,44" />
    </g>
    <!-- 50-yard line -->
    <path d="M90,10 L90,44" stroke="#ffffff" stroke-width="1.6" opacity="0.85" />

    <!-- brick operations building at the east end, grounded beside the bowl -->
    <rect x="178" y="-2" width="22" height="60" fill="#9a4b38" />
    <g fill="#2c3539" opacity="0.6">
      <rect x="180" y="6" width="18" height="2.6" />
      <rect x="180" y="16" width="18" height="2.6" />
      <rect x="180" y="26" width="18" height="2.6" />
      <rect x="180" y="36" width="18" height="2.6" />
    </g>
    <rect x="176" y="-5" width="26" height="3" rx="1" fill="#e7eaed" />

    <!-- near sideline stand: solid trapezoid joining the field edge -->
    <polygon points="4,44 176,44 188,58 -8,58" fill="#8b9299" />
    <g stroke="#565e66" stroke-width="1.2" opacity="0.7">
      <path d="M32,44 L28,58 M74,44 L72,58 M106,44 L108,58 M148,44 L152,58" />
    </g>
  </g>

  <!-- winding pale country road through the troughs -->
  <path
    d="M120,506 C260,494 380,502 520,490 C620,482 700,488 760,496"
    stroke="#a98c5b"
    stroke-width="5"
    fill="none"
    opacity="0.6"
    stroke-linecap="round"
  />

  <!-- ===== FOREGROUND CANOPY (scalloped tree band from pullman.jpeg) ===== -->
  {#each CONIFERS as tree, i (i)}
    <polygon
      points="{tree.x},540 {tree.x + tree.w / 2},{540 - tree.h} {tree.x + tree.w},540"
      fill={tree.c}
    />
  {/each}
  {#each CANOPY as blob, i (i)}
    <circle cx={blob.x} cy={blob.y} r={blob.r} fill={blob.c} />
  {/each}
  {#each HIGHLIGHTS as hl, i (i)}
    <circle cx={hl.x} cy={hl.y} r={hl.r} fill={hl.c} opacity="0.8" />
  {/each}

  <!-- rooftops peeking through the canopy -->
  <g>
    <polygon points="546,472 566,458 586,472" fill="#9ca1a2" />
    <rect x="550" y="472" width="32" height="24" fill="#8f9496" />
    <polygon points="1040,478 1056,466 1072,478" fill="#e9e9e4" />
    <rect x="1044" y="478" width="24" height="20" fill="#dcdcd6" />
  </g>
</svg>
