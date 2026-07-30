import type {Metadata} from "next";
import {EnergyTrackWorkbench} from "../../../components/energy-track-workbench";

export const metadata: Metadata = {
  title: "Free Energy Conservation Track Experiment",
  description: "Adjust height, mass, friction, and gravity while a live energy budget follows a cart through a circular track.",
  alternates: {canonical: "/experiments/energy-track"},
  openGraph: {
    title: "Free Energy Conservation Track Experiment",
    description: "Track potential, kinetic, and thermal energy through one complete classroom-ready run.",
    url: "/experiments/energy-track",
  },
};

export default function EnergyTrackExperimentPage() {
  return <EnergyTrackWorkbench />;
}
