import type {Metadata} from "next";
import {ForcesAndMotionWorkbench} from "../../../components/forces-and-motion-workbench";

export const metadata: Metadata = {
  title: "Free Forces and Motion Experiment",
  description: "Adjust mass, applied force, and friction while a live free-body diagram and graphs explain Newton's second law.",
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
  return <ForcesAndMotionWorkbench />;
}
