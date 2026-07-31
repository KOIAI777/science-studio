import type {Metadata} from "next";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {ForcesAndMotionWorkbench} from "../../../components/forces-and-motion-workbench";

const description = "Adjust mass, applied force, and friction while a live free-body diagram and graphs explain Newton's second law.";

export const metadata: Metadata = {
  title: "Free Forces and Motion Experiment",
  description,
  alternates: {canonical: "/experiments/forces-and-motion"},
  openGraph: {
    title: "Free Forces and Motion Experiment",
    description: "Cross the static-friction threshold, calculate net force, and follow motion after the push ends.",
    url: "/experiments/forces-and-motion",
    images: [{
      url: "/experiments/forces-and-motion-diagram.png",
      width: 446,
      height: 208,
      alt: "Forces and Motion free-body diagram with four labeled force vectors",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Forces and Motion Experiment",
    description: "Cross the static-friction threshold, calculate net force, and follow motion after the push ends.",
    images: ["/experiments/forces-and-motion-diagram.png"],
  },
};

export default function ForcesAndMotionExperimentPage() {
  return <><ExperimentStructuredData name="Free Forces and Motion Experiment" description={description} path="/experiments/forces-and-motion" image="/experiments/forces-and-motion-diagram.png" teaches={["Free-body diagrams", "Static friction", "Kinetic friction", "Newton's second law"]} lessonMinutes={10} isFree /><ForcesAndMotionWorkbench /></>;
}
