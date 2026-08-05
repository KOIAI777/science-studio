import {Magnet} from "lucide-react";
import {TeachingGuidePage, teachingGuideMetadata} from "../../../components/teaching-guide-page";

const config = {
  headline: "How to teach electromagnets with an adjustable solenoid",
  metaTitle: "Electromagnets Teaching Guide",
  description: "A 15-minute middle-school lesson for explaining how current direction, coil turns, current, and an iron core change the field of an electromagnet.",
  path: "/teaching-guides/electromagnets",
  previewImage: "/experiments/electromagnets-classroom-diagram.png",
  previewImageAlt: "Electromagnet solenoid with current direction, magnetic field loops, north and south poles, coil turns, and compass response",
  previewImageWidth: 1280,
  previewImageHeight: 720,
  topic: "Electricity and magnetism",
  duration: "15 minutes",
  minutes: 15,
  icon: Magnet,
  experimentPath: "/experiments/electromagnets",
  experimentName: "Electromagnets",
  answer: "An electromagnet's field is created by moving charge. Increase current or coil turns to strengthen the ideal solenoid field, reverse current to reverse its poles, and use the right-hand grip rule to predict the field direction.",
  objective: "Students can connect a visible current direction to a solenoid's pole direction and relative field strength.",
  learningGoal: "Predict poles and field strength",
  caption: "Follow the current arrows around the coil before looking at the field loops. The two views make the right-hand grip rule testable rather than decorative.",
  lessonHeading: "Use current reversal as the cleanest test of magnetic-field direction.",
  lessonSteps: [
    {time: "0-3 min", heading: "Identify a solenoid", body: "Show the coil, battery, current arrows, and compass. Ask students whether the coil should have one pole, two poles, or no magnetic effect."},
    {time: "3-6 min", heading: "Predict with the right hand", body: "Have students curl their right-hand fingers in the current direction. Their thumb predicts the field direction through the coil and the north end."},
    {time: "6-9 min", heading: "Reverse the current", body: "Swap the battery direction while keeping turns and current size fixed. The compass response and north-south labels should reverse together."},
    {time: "9-12 min", heading: "Increase coil turns", body: "Return to the original direction and add turns. Compare the field-strength indicator while all other controls remain fixed."},
    {time: "12-15 min", heading: "Add a core", body: "Introduce the iron core as a material response that concentrates the field. Contrast this with the direction change caused by reversing current."},
  ],
  misconceptions: [
    {claim: "The center particles are electrons leaving the coil", correction: "They visualize the field, not individual charge carriers. Electrons drift through the wire while the magnetic field extends around the coil."},
    {claim: "More turns reverse the poles", correction: "More turns strengthen the ideal field for the same current direction. Reversing current changes which end is north."},
    {claim: "A coil has only one magnetic pole", correction: "A solenoid behaves like a bar magnet with a north and south end, joined by continuous field lines."},
  ],
  equations: [
    {label: "Ideal solenoid field", value: "B = mu0 n I"},
    {label: "Turn density", value: "n = N / L"},
    {label: "Current direction", value: "right-hand grip rule"},
  ],
  equationScope: "The strength relationship is an ideal long-solenoid approximation. The model emphasizes relative changes; real coils have edge effects, resistance, heating, and material saturation.",
  observations: [
    {heading: "Reverse current", body: "The north and south labels exchange, and the compass deflection reverses because the magnetic-field direction reverses."},
    {heading: "Add turns", body: "With the same current and coil length, more turns per length create a stronger ideal field."},
    {heading: "Add an iron core", body: "The core increases the field response by becoming magnetized, but it does not set the direction independently of the current."},
  ],
  source: {title: "The comparison starts from the magnetic field produced by current in an ideal solenoid.", href: "https://openstax.org/books/college-physics-2e/pages/22-9-magnetic-fields-produced-by-currents-amperes-law", label: "OpenStax College Physics 2e, 22.9: Magnetic Fields Produced by Currents", context: "Use the ideal relationship to compare one changed control at a time, then name the ways a physical coil differs from the model."},
  teaches: ["Electromagnets", "Solenoids", "Magnetic fields", "Current direction", "Right-hand grip rule"],
  faqs: [
    {question: "What changes when current through an electromagnet reverses?", answer: "The magnetic-field direction reverses, so the solenoid's north and south poles exchange."},
    {question: "How can a solenoid be made stronger?", answer: "In the ideal model, increase current or turns per unit length. An appropriate iron core can also strengthen the field."},
  ],
};

export const metadata = teachingGuideMetadata(config);

export default function ElectromagnetsGuidePage() {
  return <TeachingGuidePage config={config} />;
}
