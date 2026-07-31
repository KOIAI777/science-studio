import type {Metadata} from "next";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {ExperimentWorkbench} from "../../../components/experiment-workbench";

const description = "Adjust angle, mass, friction, and gravity in a guided inclined-plane physics experiment built for classroom presentation.";
const previewImage = {url: "/experiments/inclined-plane-diagram.png", width: 562, height: 422, alt: "Inclined plane experiment with a block, force vectors, ramp, and angle"};

export const metadata: Metadata = {
  title: "Free Inclined Plane and Friction Experiment",
  description,
  alternates: {canonical: "/experiments/inclined-plane"},
  openGraph: {
    title: "Free Inclined Plane and Friction Experiment",
    description: "Resolve forces, predict motion, and present the result step by step with Science Studio.",
    url: "/experiments/inclined-plane",
    images: [previewImage],
  },
  twitter: {card: "summary_large_image", title: "Free Inclined Plane and Friction Experiment", description, images: [previewImage.url]},
};

export default function InclinedPlaneExperimentPage() {
  return <><ExperimentStructuredData name="Free Inclined Plane and Friction Experiment" description={description} path="/experiments/inclined-plane" image={previewImage.url} teaches={["Force decomposition", "Static friction", "Kinetic friction", "Acceleration on an incline"]} lessonMinutes={12} isFree /><ExperimentWorkbench /></>;
}
