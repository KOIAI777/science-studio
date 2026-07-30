import type {Metadata} from "next";
import {OhmsLawWorkbench} from "../../../components/ohms-law-workbench";

const pageTitle = "Free Ohm's Law Lab";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Close one ideal DC circuit, adjust voltage and resistance, and measure current while teaching Ohm's law step by step.";
const previewImage = {
  url: "/experiments/ohms-law-diagram.png",
  width: 728,
  height: 684,
  alt: "Ohm's Law Lab showing one battery, one resistor, a closed switch, and conventional current direction",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {canonical: "/experiments/ohms-law"},
  openGraph: {
    type: "website",
    title: socialTitle,
    description,
    url: "/experiments/ohms-law",
    images: [previewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
    images: [previewImage.url],
  },
};

export default function OhmsLawExperimentPage() {
  return <OhmsLawWorkbench />;
}
