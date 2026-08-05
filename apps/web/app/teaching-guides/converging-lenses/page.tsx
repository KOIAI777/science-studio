import {Focus} from "lucide-react";
import {TeachingGuidePage, teachingGuideMetadata} from "../../../components/teaching-guide-page";

const config = {
  headline: "How to teach converging-lens image formation with ray diagrams",
  metaTitle: "Converging Lenses Teaching Guide",
  description: "A 15-minute middle-school optics lesson for predicting image position, orientation, size, and real or virtual status with an adjustable converging lens.",
  path: "/teaching-guides/converging-lenses",
  previewImage: "/experiments/lenses-image-formation-classroom-diagram.png",
  previewImageAlt: "Converging-lens ray diagram showing object distance, focal points, principal rays, screen position, magnification, and image orientation",
  previewImageWidth: 1280,
  previewImageHeight: 720,
  topic: "Optics",
  duration: "15 minutes",
  minutes: 15,
  icon: Focus,
  experimentPath: "/experiments/lenses-image-formation",
  experimentName: "Lenses & Image Formation",
  answer: "For a converging lens, object position relative to the focal length determines the image. Trace two principal rays before showing the calculation: outside the focal length gives a real inverted image, while inside it gives a virtual upright image.",
  objective: "Students can use ray intersections to predict whether a converging lens forms a real or virtual image.",
  learningGoal: "Predict image type and position",
  caption: "Keep focal length fixed and move only the object. The ray intersections, image label, and lens equation should describe the same optical state.",
  lessonHeading: "Trace the image before measuring it, then use the equation as a check.",
  lessonSteps: [
    {time: "0-3 min", heading: "Mark the focal points", body: "Show the lens axis, focal points, and an object beyond twice the focal length. Ask students where the rays must meet after the lens."},
    {time: "3-6 min", heading: "Trace two principal rays", body: "Use the ray parallel to the axis and the ray through the lens center. Their intersection determines the real image location."},
    {time: "6-9 min", heading: "Move toward the focal point", body: "Keep focal length fixed and move the object inward. Students see the real image move farther away and grow as the object approaches the focal length."},
    {time: "9-12 min", heading: "Cross inside the focal length", body: "Move the object inside the focal length. Extend the outgoing rays backward to locate the virtual upright image on the object side."},
    {time: "12-15 min", heading: "Compare screen evidence", body: "Ask which image can be formed on a screen. Connect that test to whether real rays meet at the image position."},
  ],
  misconceptions: [
    {claim: "A converging lens always makes an enlarged image", correction: "Image size depends on object distance. A distant object produces a smaller real image, while a near object can produce a larger image."},
    {claim: "A virtual image is not a real optical result", correction: "The rays do not physically meet at the virtual image, but the eye traces them back to an apparent source location."},
    {claim: "The focal point is where every image appears", correction: "The focal point is where parallel rays meet. Image position depends on the object distance as well as focal length."},
  ],
  equations: [
    {label: "Thin-lens equation", value: "1 / f = 1 / do + 1 / di"},
    {label: "Magnification", value: "m = hi / ho = -di / do"},
    {label: "Focal length", value: "f > 0 for converging lens"},
  ],
  equationScope: "The diagram uses the thin-lens and paraxial-ray approximation. It does not model lens thickness, aberration, or the finite aperture of a real lens.",
  observations: [
    {heading: "Object beyond focal length", body: "The refracted rays meet on the far side of the lens, forming a real inverted image that can be projected onto a screen."},
    {heading: "Object at focal length", body: "The outgoing rays are parallel in the ideal model, so the image distance tends toward infinity."},
    {heading: "Object inside focal length", body: "The rays diverge after the lens; their backward extensions meet on the object side, forming a virtual upright image."},
  ],
  source: {title: "The lesson uses the principal-ray construction and thin-lens equation for an ideal converging lens.", href: "https://openstax.org/books/college-physics-2e/pages/25-6-image-formation-by-lenses", label: "OpenStax College Physics 2e, 25.6: Image Formation by Lenses", context: "Have students locate the ray intersection first, then use the sign-aware equation to test the predicted image location and type."},
  teaches: ["Converging lenses", "Principal rays", "Focal length", "Real images", "Virtual images", "Magnification"],
  faqs: [
    {question: "When does a converging lens make a real image?", answer: "When the object is farther from the lens than its focal length, the refracted rays meet on the opposite side and form a real image."},
    {question: "Why cannot a virtual image be projected onto a screen?", answer: "The rays do not meet at the virtual image location. They only appear to originate there when traced backward by the eye."},
  ],
};

export const metadata = teachingGuideMetadata(config);

export default function ConvergingLensesGuidePage() {
  return <TeachingGuidePage config={config} />;
}
