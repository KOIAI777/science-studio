import {Activity} from "lucide-react";
import {TeachingGuidePage, teachingGuideMetadata} from "../../../components/teaching-guide-page";

const config = {
  headline: "How to teach momentum conservation with a collision simulation",
  metaTitle: "Momentum Conservation Teaching Guide",
  description: "A 15-minute middle-school lesson for testing momentum conservation in one-dimensional collisions by comparing mass, velocity, impulse, and kinetic energy.",
  path: "/teaching-guides/momentum-conservation",
  previewImage: "/experiments/momentum-collisions-classroom-diagram.png",
  previewImageAlt: "Two carts before and after a collision with velocity vectors, masses, momentum totals, and energy readings",
  previewImageWidth: 734,
  previewImageHeight: 482,
  topic: "Mechanics",
  duration: "15 minutes",
  minutes: 15,
  icon: Activity,
  experimentPath: "/experiments/momentum-collisions",
  experimentName: "Momentum & Collisions",
  answer: "Treat the two carts as one system during the short collision. If external impulse is negligible, total momentum before and after is the same even when the carts bounce differently or kinetic energy changes.",
  objective: "Students can calculate system momentum and separate momentum conservation from kinetic-energy conservation.",
  learningGoal: "Compare before and after momentum",
  caption: "Use a one-dimensional setup so the direction sign is visible. The total-momentum readout lets students test a claim rather than infer it from the animation alone.",
  lessonHeading: "Make the system boundary explicit before comparing the two collision states.",
  lessonSteps: [
    {time: "0-3 min", heading: "Define the system", body: "Show the two carts, their masses, and their velocities. Ask students which quantities belong to each cart and which quantity belongs to the two-cart system."},
    {time: "3-6 min", heading: "Predict the result", body: "Set unequal masses and one moving cart. Students calculate the initial total momentum before the collision begins."},
    {time: "6-9 min", heading: "Run an elastic collision", body: "Pause immediately after the collision. Compare each cart's changed velocity with the unchanged total system momentum."},
    {time: "9-12 min", heading: "Change restitution", body: "Repeat with a lower coefficient of restitution. Students see that the carts may leave together or more slowly while total momentum remains the same."},
    {time: "12-15 min", heading: "Compare energy separately", body: "Show kinetic energy for both cases. Ask why momentum can be conserved even when kinetic energy decreases in an inelastic collision."},
  ],
  misconceptions: [
    {claim: "Momentum and kinetic energy are the same rule", correction: "Momentum is conserved for an isolated system, while kinetic energy is conserved only in an elastic collision."},
    {claim: "The heavier cart keeps its velocity", correction: "Mass affects how much a cart's velocity changes, but both carts receive equal and opposite impulses during the collision."},
    {claim: "A cart that stops has no momentum in the system", correction: "Its individual momentum is zero after stopping, but the other cart or the joined pair carries the system momentum."},
  ],
  equations: [
    {label: "Momentum", value: "p = mv"},
    {label: "System momentum", value: "p_total = p1 + p2"},
    {label: "Impulse", value: "J = delta p = F delta t"},
  ],
  equationScope: "The model is one-dimensional and treats external forces during the collision as negligible. Velocities carry direction, so opposite directions use opposite signs.",
  observations: [
    {heading: "Elastic", body: "The carts exchange momentum while total momentum and total kinetic energy stay constant in the ideal elastic case."},
    {heading: "Inelastic", body: "Total momentum stays constant, but some kinetic energy transfers to internal energy, sound, or deformation."},
    {heading: "Unequal masses", body: "The lighter cart generally has the larger velocity change because the collision impulses have equal magnitude and opposite direction."},
  ],
  source: {title: "The comparison uses conservation of momentum for a system with negligible net external impulse.", href: "https://openstax.org/books/college-physics-2e/pages/8-introduction-to-linear-momentum-and-collisions", label: "OpenStax College Physics 2e, Chapter 8: Linear Momentum and Collisions", context: "The simulation isolates the collision interval so students can compare the system before and after the interaction."},
  teaches: ["Momentum", "Conservation of momentum", "Impulse", "Elastic collisions", "Inelastic collisions"],
  faqs: [
    {question: "Is momentum conserved in an inelastic collision?", answer: "Yes, for an isolated system. Kinetic energy can decrease, but the total vector momentum before and after remains the same."},
    {question: "Why do carts move in opposite directions after a collision?", answer: "During contact they exert equal and opposite forces for the same time, producing equal and opposite changes in momentum."},
  ],
};

export const metadata = teachingGuideMetadata(config);

export default function MomentumConservationGuidePage() {
  return <TeachingGuidePage config={config} />;
}
