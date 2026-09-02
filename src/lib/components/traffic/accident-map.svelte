<script lang="ts">
  import { browser } from "$app/environment";
  import {
    AttributionControl,
    setWorkerUrl,
    Map as MLMap,
    NavigationControl,
    Popup,
    type GeoJSONSource,
    type MapGeoJSONFeature,
    type MapMouseEvent,
  } from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import { fmtTime, type Accident } from "$lib/denver-traffic.js";

  let {
    accidents,
    selectedId = $bindable(null as string | null),
  }: {
    accidents: Accident[];
    selectedId?: string | null;
  } = $props();

  const DENVER: [number, number] = [-104.985, 39.745];

  type PointFC = {
    type: "FeatureCollection";
    features: {
      type: "Feature";
      properties: Record<string, boolean | string | number>;
      geometry: { type: "Point"; coordinates: [number, number] };
    }[];
  };

  let container = $state<HTMLElement | null>(null);
  let map: MLMap | null = null;
  let mapReady = false;
  let lookup: Record<string, Accident> = {};

  const esc = (s: string | null) =>
    s
      ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      : null;

  function row(label: string, value: string | null): string {
    if (!value) return "";
    return `<div style="display:flex;gap:6px"><span style="color:#6b7280;min-width:92px">${label}</span><span>${esc(value)}</span></div>`;
  }

  function vehicleLine(v: Accident["vehicle1"]): string {
    if (!v) return "";
    const bits = [
      v.type,
      v.direction && `${v.action ?? ""} ${v.direction}`.trim(),
      v.factor,
    ]
      .filter(Boolean)
      .join(" — ");
    return bits ? `<div>▪ ${esc(bits)}</div>` : "";
  }

  function popupHtml(a: Accident): string {
    const fatal = a.fatalities > 0;
    const head = `<div style="font-weight:700;color:${fatal ? "#dc2626" : "#0369a1"}">${fmtTime(a.timeMs)} · ${esc(a.intersection ?? "Denver")}</div>`;
    const hood = a.neighborhood
      ? `<div style="color:#6b7280;font-size:11px">Neighborhood: ${esc(a.neighborhood)}${a.precinct ? ` · Precinct ${esc(a.precinct)}` : ""}</div>`
      : "";
    const details = [
      row("Collision", a.collisionType),
      row("Location", a.intersectionRelated),
      row("Weather", a.weather),
      row("Lighting", a.lighting),
      fatal
        ? `<div style="color:#dc2626;font-weight:600">${row("Fatalities", String(a.fatalities))}</div>`
        : "",
      a.pedestriansInjured > 0
        ? row("Ped. injured", String(a.pedestriansInjured))
        : "",
      vehicleLine(a.vehicle1),
      vehicleLine(a.vehicle2),
    ].join("");
    return `<div style="font-size:12px;max-width:280px;line-height:1.45">${head}${hood}${details}<div style="margin-top:4px;color:#9ca3af;font-size:10px">Incident ${esc(a.id)}</div></div>`;
  }

  function featureCollection(list: Accident[]): PointFC {
    return {
      type: "FeatureCollection",
      features: list.map((a) => ({
        type: "Feature",
        properties: { id: a.id, fatal: a.fatalities > 0 },
        geometry: { type: "Point", coordinates: [a.lng, a.lat] },
      })),
    };
  }

  function sync() {
    if (!map || !mapReady) return;
    const src = map.getSource("accidents") as GeoJSONSource | undefined;
    src?.setData(featureCollection(accidents));
  }

  $effect(() => {
    if (!browser || !container) return;
    lookup = Object.fromEntries(accidents.map((a) => [a.id, a]));

    // MapLibre v6 resolves its worker relative to the module file, which
    // breaks under Vite bundling (the worker's own imports 404 → no tiles).
    // Serve the worker + its shared chunk from /static so their relative
    // import resolves identically in dev and production.
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    map = new MLMap({
      container,
      style: "https://tiles.openfreemap.org/styles/fiord",
      center: DENVER,
      zoom: 11.3,
      maxZoom: 18,
      attributionControl: false, // we add our own below
    });
    map.addControl(new NavigationControl(), "top-left");
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution:
          "© OpenMapTiles · OpenStreetMap contributors · Data: Denver PD via data.colorado.gov",
      }),
    );

    map.on("load", () => {
      if (!map) return;
      mapReady = true;
      map.addSource("accidents", {
        type: "geojson",
        data: featureCollection(accidents),
        cluster: true,
        clusterRadius: 34,
      });

      // clusters
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "accidents",
        filter: ["has", "cluster"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 14, 5, 18, 20, 24],
          "circle-color": "#f97316",
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "accidents",
        filter: ["has", "cluster"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        },
        paint: { "text-color": "#ffffff" },
      });

      // individual accidents — red if fatal, blue otherwise
      map.addLayer({
        id: "accidents-pt",
        type: "circle",
        source: "accidents",
        filter: ["!", ["has", "cluster"]],
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "case",
            ["==", ["get", "fatal"], true],
            "#dc2626",
            "#0ea5e9",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // interactions
      map.on(
        "click",
        "clusters",
        (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
          const fe = e.features?.[0];
          const id = (fe?.properties as { cluster_id?: number } | undefined)
            ?.cluster_id;
          if (!fe || id == null || !map) return;
          const src = map.getSource("accidents") as GeoJSONSource;
          const coords = (fe.geometry as { coordinates: [number, number] })
            .coordinates;
          src.getClusterExpansionZoom(id).then(
            (zoom: number) => {
              map?.easeTo({ center: coords, zoom });
            },
            () => {
              // cluster can't expand further (identical coordinates) — just zoom in
              map?.easeTo({
                center: coords,
                zoom: Math.min(18, (map?.getZoom() ?? 0) + 2),
              });
            },
          );
        },
      );

      map.on(
        "click",
        "accidents-pt",
        (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
          const m = map;
          if (!m) return;
          const id = (
            e.features?.[0]?.properties as { id?: string } | undefined
          )?.id;
          if (!id || !lookup[id]) return;
          selectedId = id;
          const lngLat = (
            e.features?.[0]?.geometry as { coordinates: [number, number] }
          ).coordinates;
          new Popup({ offset: 12, maxWidth: "320px" })
            .setLngLat(lngLat)
            .setHTML(popupHtml(lookup[id]))
            .addTo(m);
        },
      );

      const hoverCursor = (on: boolean) => {
        if (!map) return;
        map.getCanvas().style.cursor = on ? "pointer" : "";
      };
      map.on("mouseenter", "accidents-pt", () => hoverCursor(true));
      map.on("mouseleave", "accidents-pt", () => hoverCursor(false));

      // handy for debugging in devtools
      if (browser) (window as unknown as { map?: MLMap | null }).map = map;

      sync();
    });

    return () => {
      mapReady = false;
      map?.remove();
      map = null;
    };
  });

  // react to new data
  $effect(() => {
    void accidents.length;
    lookup = Object.fromEntries(accidents.map((a) => [a.id, a]));
    sync();
  });

  // fly to selected accident (from the list)
  $effect(() => {
    if (!selectedId || !map || !mapReady) return;
    const a = lookup[selectedId];
    if (!a) return;
    map.flyTo({ center: [a.lng, a.lat], zoom: 14.5, speed: 1.2 });
  });
</script>

<div
  bind:this={container}
  class="h-[480px] w-full overflow-hidden rounded-lg border"
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
