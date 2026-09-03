<script lang="ts">
  import { browser } from "$app/environment";
  import {
    AttributionControl,
    setWorkerUrl,
    Map as MLMap,
    NavigationControl,
    Popup,
    type ExpressionSpecification,
    type GeoJSONSource,
    type MapGeoJSONFeature,
    type MapMouseEvent,
  } from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import { modeLabel, fmtInt, type BikeStation } from "$lib/colorado-bikes.js";

  let {
    stations,
    selectedId = $bindable(null as string | null),
  }: {
    stations: BikeStation[];
    selectedId?: string | null;
  } = $props();

  const COLOR_BIKE = "#10b981"; // emerald
  const COLOR_PED = "#8b5cf6"; // violet
  const COLOR_BOTH = "#f59e0b"; // amber

  type PointFC = {
    type: "FeatureCollection";
    features: {
      type: "Feature";
      properties: Record<string, string | number>;
      geometry: { type: "Point"; coordinates: [number, number] };
    }[];
  };

  const radiusExpr = (scale: number): ExpressionSpecification =>
    [
      "interpolate",
      ["pow", 0.45],
      ["get", "total"],
      1, scale * 6,
      10_000, scale * 14,
      250_000, scale * 26,
      2_000_000, scale * 38,
    ] as unknown as ExpressionSpecification;

  let container = $state<HTMLElement | null>(null);
  let map: MLMap | null = null;
  let mapReady = false;
  let lookup: Record<string, BikeStation> = {};

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function colorFor(s: BikeStation): string {
    if (s.hasBike && s.hasPed) return COLOR_BOTH;
    return s.hasBike ? COLOR_BIKE : COLOR_PED;
  }

  function popupHtml(s: BikeStation): string {
    return `<div style="font-size:12px;max-width:260px;line-height:1.45">
      <div style="font-weight:700;color:#0369a1">${esc(s.name)}</div>
      <div style="color:#6b7280;font-size:11px">${esc(modeLabel(s))} · ${esc(s.county)} County</div>
      <div style="margin-top:4px">${fmtInt.format(s.total)} counts across ${fmtInt.format(s.days)} days recorded</div>
      <div style="margin-top:4px;color:#9ca3af;font-size:10px">Station ${esc(s.id)}</div>
    </div>`;
  }

  function featureCollection(list: BikeStation[]): PointFC {
    return {
      type: "FeatureCollection",
      features: list.map((s) => ({
        type: "Feature",
        properties: {
          id: s.id,
          total: s.total,
          color: colorFor(s),
        },
        geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      })),
    };
  }

  function sync() {
    if (!map || !mapReady) return;
    const src = map.getSource("stations") as GeoJSONSource | undefined;
    src?.setData(featureCollection(stations));
  }

  $effect(() => {
    if (!browser || !container) return;
    lookup = Object.fromEntries(stations.map((s) => [s.id, s]));

    // MapLibre v6 worker must be served from /static so its relative
    // imports resolve under Vite bundling (see accident-map.svelte).
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    map = new MLMap({
      container,
      style: "https://tiles.openfreemap.org/styles/fiord",
      center: [-105.3, 39.6],
      zoom: 6.6,
      maxZoom: 17,
      attributionControl: false,
    });
    map.addControl(new NavigationControl(), "top-left");
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution:
          "© OpenMapTiles · OpenStreetMap contributors · Data: CDOT via data.colorado.gov",
      }),
    );

    map.on("load", () => {
      if (!map) return;
      mapReady = true;
      map.addSource("stations", {
        type: "geojson",
        data: featureCollection(stations),
      });

      // Halo sized by volume, then the dot itself.
      map.addLayer({
        id: "stations-halo",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": radiusExpr(1),
          "circle-color": ["get", "color"],
          "circle-opacity": 0.25,
        },
      });
      map.addLayer({
        id: "stations-pt",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": radiusExpr(0.46),
          "circle-color": ["get", "color"],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on(
        "click",
        "stations-pt",
        (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
          const m = map;
          if (!m) return;
          const id = (
            e.features?.[0]?.properties as { id?: string } | undefined
          )?.id;
          if (!id || !lookup[id]) return;
          selectedId = id;
          new Popup({ offset: 14, maxWidth: "300px" })
            .setLngLat(
              (
                e.features?.[0]?.geometry as { coordinates: [number, number] }
              ).coordinates,
            )
            .setHTML(popupHtml(lookup[id]))
            .addTo(m);
        },
      );

      const hoverCursor = (on: boolean) => {
        if (!map) return;
        map.getCanvas().style.cursor = on ? "pointer" : "";
      };
      map.on("mouseenter", "stations-pt", () => hoverCursor(true));
      map.on("mouseleave", "stations-pt", () => hoverCursor(false));

      if (browser) (window as unknown as { map?: MLMap | null }).map = map;

      sync();
    });

    return () => {
      mapReady = false;
      map?.remove();
      map = null;
    };
  });

  // react to new/filtered data
  $effect(() => {
    void stations.length;
    lookup = Object.fromEntries(stations.map((s) => [s.id, s]));
    sync();
  });

  // fly to selected station (from the list)
  $effect(() => {
    if (!selectedId || !map || !mapReady) return;
    const s = lookup[selectedId];
    if (!s) return;
    map.flyTo({ center: [s.lon, s.lat], zoom: 12.5, speed: 1.2 });
  });
</script>

<div
  bind:this={container}
  class="h-[540px] w-full overflow-hidden rounded-lg border"
></div>

<style>
  :global(.maplibregl-popup-content) {
    background: #ffffff;
    color: #1f2937;
    padding: 10px 12px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.18);
  }

  :global(.maplibregl-popup-tip) {
    border-top-color: #ffffff;
    border-bottom-color: #ffffff;
    border-left-color: #ffffff;
    border-right-color: #ffffff;
  }

  :global(.maplibregl-popup-close-button) {
    color: #6b7280;
    font-size: 18px;
    padding: 2px 6px;
  }

  :global(.maplibregl-popup-close-button:hover) {
    color: #1f2937;
  }
</style>
