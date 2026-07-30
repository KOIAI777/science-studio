import type {Metadata} from "next";
import {ExperimentWorkbench} from "../../../components/experiment-workbench";

export const metadata: Metadata = {
  title: "Free Inclined Plane and Friction Experiment",
  description: "Adjust angle, mass, friction, and gravity in a guided inclined-plane physics experiment built for classroom presentation.",
  alternates: {canonical: "/experiments/inclined-plane"},
  openGraph: {
    title: "Free Inclined Plane and Friction Experiment",
    description: "Resolve forces, predict motion, and present the result step by step with Science Studio.",
    url: "/experiments/inclined-plane",
  },
};

export default function InclinedPlaneExperimentPage() {
  return <ExperimentWorkbench />;
}
