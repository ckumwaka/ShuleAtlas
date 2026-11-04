import { createFileRoute } from "@tanstack/react-router";
import { MapperApp } from "@/components/mapper-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <MapperApp />;
}
