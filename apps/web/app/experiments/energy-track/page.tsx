import type {Metadata} from "next";
import {EnergyTrackWorkbench} from "../../../components/energy-track-workbench";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";

const description = "Adjust height, mass, friction, and gravity while a live energy budget follows a cart through a circular track.";
const previewImage = {url: "/experiments/energy-track-diagram.png", width: 740, height: 446, alt: "Energy track experiment showing a cart, force vectors, return height, and live energy budget"};

export const metadata: Metadata = {
  title: "Free Energy Conservation Track Experiment",
  description,
  alternates: {canonical: "/experiments/energy-track"},
  openGraph: {
    title: "Free Energy Conservation Track Experiment",
    description: "Track potential, kinetic, and thermal energy through one complete classroom-ready run.",
    url: "/experiments/energy-track",
    images: [previewImage],
  },
  twitter: {card: "summary_large_image", title: "Free Energy Conservation Track Experiment", description, images: [previewImage.url]},
};

export default function EnergyTrackExperimentPage() {
  return <><ExperimentStructuredData name="Free Energy Conservation Track Experiment" description={description} path="/experiments/energy-track" image={previewImage.url} teaches={["Potential energy", "Kinetic energy", "Thermal energy", "Conservation of energy"]} lessonMinutes={12} isFree /><EnergyTrackWorkbench /></>;
}
