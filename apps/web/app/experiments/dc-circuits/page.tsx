import type {Metadata} from "next";
import {DcCircuitsWorkbench} from "../../../components/dc-circuits-workbench";

const pageTitle = "DC Circuits: Series & Parallel";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Compare single, series, and parallel DC circuits with synchronized current paths, component measurements, equivalent resistance, and guided classroom steps.";
const previewImage = {
  url: "/experiments/dc-circuits-diagram.png",
  width: 1280,
  height: 720,
  alt: "Science Studio series and parallel DC circuit comparison with synchronized current and voltage measurements",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: false, follow: false},
  alternates: {canonical: "/experiments/dc-circuits"},
  openGraph: {
    type: "website",
    title: socialTitle,
    description,
    url: "/experiments/dc-circuits",
    images: [previewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
    images: [previewImage.url],
  },
};

export default function DcCircuitsExperimentPage() {
  return <DcCircuitsWorkbench />;
}
