import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Band } from "@/lib/model";
import { BAND_LABEL } from "@/lib/model";

export type MapSchool = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  band: Band;
};

type Props = {
  schools: MapSchool[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pinMode: boolean;
  onPin: (lat: number, lng: number) => void;
  onCancelPin: () => void;
};

const KENYA: L.LatLngBoundsExpression = [
  [5.05, 33.85],
  [-4.75, 41.95],
];

export function LeafletMap({ schools, selectedId, onSelect, pinMode, onPin, onCancelPin }: Props) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const schoolsRef = useRef(schools);
  schoolsRef.current = schools;

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || mapRef.current) return;
    const map = L.map(node, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 5,
      maxZoom: 17,
    });
    map.fitBounds(KENYA);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    map.setMaxBounds(
      L.latLngBounds([
        [6.3, 32.4],
        [-5.7, 43.3],
      ]),
    );
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(node);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    for (const school of schools) {
      const selected = school.id === selectedId;
      const icon = L.divIcon({
        className: "school-pin",
        html: `<span class="pin" data-band="${school.band}" data-on="${selected ? "true" : "false"}"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([school.lat, school.lng], { icon, title: school.name, keyboard: false });
      marker.bindTooltip(school.name, { direction: "top", offset: [0, -8], opacity: 1 });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event.originalEvent);
        onSelect(school.id);
      });
      marker.addTo(layer);
    }
  }, [schools, selectedId, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const school = schoolsRef.current.find((item) => item.id === selectedId);
    if (!school) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo([school.lat, school.lng], Math.max(map.getZoom(), 10), { duration: reduce ? 0 : 0.55 });
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handle = (event: L.LeafletMouseEvent) => {
      if (!pinMode) return;
      onPin(event.latlng.lat, event.latlng.lng);
    };
    map.on("click", handle);
    return () => {
      map.off("click", handle);
    };
  }, [pinMode, onPin]);

  function fit() {
    const map = mapRef.current;
    if (!map) return;
    if (schools.length === 0) {
      map.fitBounds(KENYA);
      return;
    }
    const bounds = L.latLngBounds(schools.map((school) => [school.lat, school.lng]));
    map.fitBounds(bounds.pad(0.25), { maxZoom: 11 });
  }

  return (
    <div className={`relative h-full w-full ${pinMode ? "is-pinning" : ""}`}>
      <div ref={nodeRef} className="h-full w-full" />
      {pinMode ? (
        <div className="map-overlay absolute inset-x-3 top-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3">
          <p className="text-sm text-ink">Tap the map to drop a pin for this school.</p>
          <button type="button" className="press h-11 shrink-0 rounded-md border border-line px-3 text-sm" onClick={onCancelPin}>
            Cancel
          </button>
        </div>
      ) : null}
      <div className="map-overlay pointer-events-none absolute top-20 left-3 flex flex-col items-start gap-2">
        <div className="pointer-events-auto rounded-lg border border-line bg-card px-3 py-2">
          <ul className="flex flex-col gap-1 text-xs text-ink-soft">
            {(["steady", "strained", "critical"] as const).map((band) => (
              <li key={band} className="flex items-center gap-2">
                <span className="pin pin-legend" data-band={band} data-on="false" />
                <span>
                  {BAND_LABEL[band]}
                  {band === "steady" ? " 75–100" : band === "strained" ? " 50–74" : " under 50"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="press pointer-events-auto h-11 rounded-md border border-line bg-card px-3 text-sm text-ink" onClick={fit}>
          Fit schools
        </button>
      </div>
    </div>
  );
}
