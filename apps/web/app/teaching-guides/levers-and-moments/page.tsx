import {Scale} from "lucide-react";
import {TeachingGuidePage, teachingGuideMetadata} from "../../../components/teaching-guide-page";

const config = {
  headline: "How to teach levers and moments with a balance simulation",
  metaTitle: "Levers and Moments Teaching Guide",
  description: "A 15-minute middle-school lesson for explaining torque, clockwise and counterclockwise moments, and rotational equilibrium with an adjustable balance beam.",
  path: "/teaching-guides/levers-and-moments",
  previewImage: "/experiments/levers-and-balance-classroom-diagram.png",
  previewImageAlt: "Balance beam simulation with pivot, applied loads, perpendicular distances, moment arrows, and a torque comparison",
  previewImageWidth: 1200,
  previewImageHeight: 675,
  topic: "Mechanics",
  duration: "15 minutes",
  minutes: 15,
  icon: Scale,
  experimentPath: "/experiments/levers-and-balance",
  experimentName: "Levers & Balance",
  answer: "A beam balances when clockwise and counterclockwise moments are equal. Change force or perpendicular distance one at a time so students see why a smaller force can balance a larger one when it acts farther from the pivot.",
  objective: "Students can calculate a moment and use opposite rotation directions to test rotational equilibrium.",
  learningGoal: "Balance clockwise and counterclockwise moments",
  caption: "The pivot is the reference point. Read the perpendicular distance to the force line of action, not simply the beam length.",
  lessonHeading: "Start with an unbalanced beam, then restore equilibrium by changing a single moment term.",
  lessonSteps: [
    {time: "0-3 min", heading: "Locate the pivot", body: "Show an initially balanced beam and ask which quantities could make it rotate. Identify the pivot, force direction, and perpendicular distance."},
    {time: "3-6 min", heading: "Break the balance", body: "Increase one load while keeping its position fixed. Students predict rotation direction before running the motion."},
    {time: "6-9 min", heading: "Restore with distance", body: "Reduce the force or move the opposite load farther from the pivot. Pause when the displayed clockwise and counterclockwise moments match."},
    {time: "9-12 min", heading: "Test the same force twice", body: "Keep one force fixed but place it at two different distances. Students compare why the farther load produces the larger turning effect."},
    {time: "12-15 min", heading: "Use a diagonal force", body: "Show that only the component perpendicular to the lever arm creates the moment, then return to the right-angle classroom case."},
  ],
  misconceptions: [
    {claim: "The heavier side always goes down", correction: "Rotation depends on moment, the product of force and perpendicular distance. A smaller force farther out can win."},
    {claim: "Distance means any point on the beam", correction: "The relevant distance is perpendicular from the pivot to the force's line of action."},
    {claim: "A balanced beam has no forces", correction: "Forces still act. The net torque is zero, and vertical forces must also balance for static equilibrium."},
  ],
  equations: [
    {label: "Moment magnitude", value: "tau = F d_perpendicular"},
    {label: "Equilibrium", value: "sum tau = 0"},
    {label: "Right-angle force", value: "tau = rF"},
  ],
  equationScope: "The balance model treats the beam as rigid and focuses on a fixed pivot. Friction at the pivot and the beam's own weight can be added later as extra moments.",
  observations: [
    {heading: "Same force, farther out", body: "The larger perpendicular distance creates the larger moment, so the beam rotates more strongly in that direction."},
    {heading: "Different forces, equal moments", body: "A small force at a long distance can balance a larger force close to the pivot."},
    {heading: "Equal opposite moments", body: "The beam remains at rest when clockwise and counterclockwise moments sum to zero."},
  ],
  source: {title: "The lesson uses the torque condition for rotational static equilibrium.", href: "https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium", label: "OpenStax University Physics Volume 1, 12.1: Conditions for Static Equilibrium", context: "Keep the first example perpendicular to the beam so students can connect the visual distance directly to the moment calculation."},
  teaches: ["Moment of force", "Torque", "Perpendicular distance", "Rotational equilibrium", "Levers"],
  faqs: [
    {question: "Can a lighter load balance a heavier load?", answer: "Yes. It must act at a proportionally greater perpendicular distance so the two moments have equal magnitude."},
    {question: "Why does the distance need to be perpendicular?", answer: "Only the component of a force perpendicular to the lever arm changes the turning effect about the pivot."},
  ],
};

export const metadata = teachingGuideMetadata(config);

export default function LeversAndMomentsGuidePage() {
  return <TeachingGuidePage config={config} />;
}
