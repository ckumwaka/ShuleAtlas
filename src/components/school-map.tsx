import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { MapSchool } from "@/components/leaflet-map";

type MapProps = {
  schools: MapSchool[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pinMode: boolean;
  onPin: (lat: number, lng: number) => void;
  onCancelPin: () => void;
};

export function SchoolMap(props: MapProps) {
  const [MapView, setMapView] = useState<ComponentType<MapProps> | null>(null);

  useEffect(() => {
    let live = true;
    void import("@/components/leaflet-map").then((module) => {
      if (live) setMapView(() => module.LeafletMap);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!MapView) {
    return (
      <div className="grid h-full place-items-center bg-paper-2 text-sm text-muted">
        Loading the Kenya map…
      </div>
    );
  }

  return <MapView {...props} />;
}
