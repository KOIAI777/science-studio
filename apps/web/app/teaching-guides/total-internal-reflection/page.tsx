import {Lightbulb} from "lucide-react";
import {TeachingGuidePage, teachingGuideMetadata} from "../../../components/teaching-guide-page";

const config = {
  headline: "How to teach total internal reflection with an interactive ray diagram",
  metaTitle: "Total Internal Reflection Teaching Guide",
  description: "A 15-minute middle-school optics lesson for explaining refraction, critical angle, and total internal reflection with one adjustable ray diagram.",
  path: "/teaching-guides/total-internal-reflection",
  previewImage: "/experiments/refraction-total-internal-reflection-classroom-diagram.png",
  previewImageAlt: "Refraction and total internal reflection ray diagram with incident angle, reflected ray, refracted ray, and critical angle",
  previewImageWidth: 1200,
  previewImageHeight: 620,
  topic: "Optics",
  duration: "15 minutes",
  minutes: 15,
  icon: Lightbulb,
  experimentPath: "/experiments/refraction-total-internal-reflection",
  experimentName: "Refraction Lab",
  answer: "Total internal reflection occurs only when light travels from a higher-index material toward a lower-index material and the incident angle is greater than the critical angle. Sweep the incident angle slowly so students can see the refracted ray reach 90 degrees before it disappears.",
  objective: "Students can distinguish ordinary reflection, refraction, and total internal reflection by tracing what happens at one boundary.",
  learningGoal: "Find the critical-angle condition",
  caption: "Keep both media fixed while changing only the incident angle. The boundary condition becomes visible when the refracted ray lies along the surface.",
  lessonHeading: "Use the critical angle as a boundary, not as a formula students memorize first.",
  lessonSteps: [
    {time: "0-3 min", heading: "Predict the outgoing paths", body: "Show light traveling from glass to air at a modest angle. Ask students to sketch the reflected and refracted rays before the measurements appear."},
    {time: "3-6 min", heading: "Increase one angle", body: "Hold both refractive indices fixed and increase only the incident angle. Students should observe the refracted ray bend farther from the normal."},
    {time: "6-9 min", heading: "Pause at the boundary", body: "Stop when the refracted ray is exactly along the interface. Name this incident angle the critical angle and show that the refracted angle is 90 degrees."},
    {time: "9-12 min", heading: "Cross the critical angle", body: "Increase the incident angle a little more. The transmitted ray no longer exists in the ideal ray model, while the reflected ray carries the light back into the first medium."},
    {time: "12-15 min", heading: "Reverse the media", body: "Swap the direction so light travels from air into glass. Students should explain why a critical angle and total internal reflection no longer occur."},
  ],
  misconceptions: [
    {claim: "Any steep ray totally reflects", correction: "A large angle is not enough. The ray must also travel from higher refractive index to lower refractive index."},
    {claim: "The light is absorbed after the critical angle", correction: "In the ideal model, the reflected ray remains. The energy is redirected into reflection rather than transmitted across the boundary."},
    {claim: "The critical angle is always 45 degrees", correction: "It depends on the pair of refractive indices, so a glass-air boundary and a water-air boundary have different critical angles."},
  ],
  equations: [
    {label: "Snell's law", value: "n1 sin(theta1) = n2 sin(theta2)"},
    {label: "Critical-angle condition", value: "theta2 = 90 degrees"},
    {label: "Critical angle", value: "sin(theta_c) = n2 / n1"},
  ],
  equationScope: "These relationships assume uniform, isotropic media and a sharp flat boundary. The model shows ray directions, not wave interference or absorption.",
  observations: [
    {heading: "Below critical", body: "Both reflected and refracted rays are present. The refracted ray bends away from the normal as the incident angle increases."},
    {heading: "At critical", body: "The refracted ray travels along the boundary. Its angle from the normal is 90 degrees."},
    {heading: "Above critical", body: "The ideal ray diagram shows no refracted ray into the second medium; the light is totally internally reflected."},
  ],
  source: {title: "The lesson follows Snell's law at a boundary between two transparent media.", href: "https://openstax.org/books/college-physics-2e/pages/25-4-total-internal-reflection", label: "OpenStax College Physics 2e, 25.4: Total Internal Reflection", context: "Use the source after students have made the visual prediction, so the equation explains an observed threshold instead of replacing it."},
  teaches: ["Refraction", "Snell's law", "Critical angle", "Total internal reflection"],
  faqs: [
    {question: "What must be true for total internal reflection?", answer: "Light must travel from higher refractive index to lower refractive index, and the incident angle must exceed that boundary's critical angle."},
    {question: "Why is there still a reflected ray below the critical angle?", answer: "Reflection occurs at transparent boundaries too. Below the critical angle, part of the light reflects and part refracts."},
  ],
};

export const metadata = teachingGuideMetadata(config);

export default function TotalInternalReflectionGuidePage() {
  return <TeachingGuidePage config={config} />;
}
