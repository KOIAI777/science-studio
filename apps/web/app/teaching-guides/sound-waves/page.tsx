import {AudioLines} from "lucide-react";
import {TeachingGuidePage, teachingGuideMetadata} from "../../../components/teaching-guide-page";

const config = {
  headline: "How to teach sound frequency and amplitude with a wave simulation",
  metaTitle: "Sound Waves Teaching Guide",
  description: "A 15-minute middle-school lesson for distinguishing sound frequency, amplitude, wavelength, pitch, and loudness with an adjustable longitudinal-wave model.",
  path: "/teaching-guides/sound-waves",
  previewImage: "/experiments/sound-waves-classroom-diagram.png",
  previewImageAlt: "Longitudinal sound-wave simulation showing compressions, rarefactions, waveform, frequency, amplitude, and microphone measurement",
  previewImageWidth: 1378,
  previewImageHeight: 714,
  topic: "Waves",
  duration: "15 minutes",
  minutes: 15,
  icon: AudioLines,
  experimentPath: "/experiments/sound-waves",
  experimentName: "Sound Waves",
  answer: "Frequency controls pitch and amplitude controls sound pressure variation. Change one control at a time: more compressions per second raise pitch, while a larger pressure swing makes the waveform taller without changing its pitch.",
  objective: "Students can identify which wave property changes when a sound becomes higher in pitch or larger in amplitude.",
  learningGoal: "Separate pitch from loudness",
  caption: "Use the particle view and waveform view together. The compressions and rarefactions describe the same sound pattern as the pressure graph.",
  lessonHeading: "Hold the medium fixed so each sound change has one physical explanation.",
  lessonSteps: [
    {time: "0-3 min", heading: "Name the two views", body: "Show the longitudinal particle pattern beside the pressure waveform. Ask students where a compression appears on the graph."},
    {time: "3-6 min", heading: "Change frequency only", body: "Keep amplitude fixed and increase frequency. Students count more cycles in the same time interval and connect that to a higher pitch."},
    {time: "6-9 min", heading: "Change amplitude only", body: "Return to the first frequency, then increase amplitude. The waveform becomes taller and the compressions stronger while the period stays the same."},
    {time: "9-12 min", heading: "Compare wavelength", body: "For a fixed sound speed, increase frequency again. Students see wavelength decrease even though the medium has not changed."},
    {time: "12-15 min", heading: "Use a microphone point", body: "Move the observation point and explain that the delayed waveform records the same wave after it travels through the medium."},
  ],
  misconceptions: [
    {claim: "A taller wave has a higher pitch", correction: "Amplitude changes pressure variation and perceived loudness. Pitch is determined mainly by frequency."},
    {claim: "Sound particles travel with the wave", correction: "Air particles oscillate around equilibrium. The wave transfers energy and information through the medium."},
    {claim: "Frequency and wavelength rise together", correction: "When sound speed is fixed, frequency and wavelength are inversely related."},
  ],
  equations: [
    {label: "Wave speed", value: "v = f lambda"},
    {label: "Period", value: "T = 1 / f"},
    {label: "Sound-pressure level", value: "L_p = 20 log10(p / p0)"},
  ],
  equationScope: "The classroom model treats the medium as uniform and uses a fixed sound speed. Perceived loudness also depends on frequency and hearing, so amplitude is a useful but simplified comparison.",
  observations: [
    {heading: "Higher frequency", body: "More cycles pass the microphone each second. The period and wavelength become smaller when sound speed is fixed."},
    {heading: "Higher amplitude", body: "Compressions and rarefactions are stronger and the pressure waveform is taller, while frequency can remain unchanged."},
    {heading: "Propagation delay", body: "A microphone farther from the source receives the same pattern later because the wave takes time to travel."},
  ],
  source: {title: "The lesson uses the relationship among wave speed, frequency, and wavelength in a uniform medium.", href: "https://openstax.org/books/college-physics-2e/pages/17-2-speed-of-sound-frequency-and-wavelength", label: "OpenStax College Physics 2e, 17.2: Speed of Sound, Frequency, and Wavelength", context: "Use the equation after the visual comparison so students can state which value was held fixed and which value changed."},
  teaches: ["Longitudinal waves", "Frequency", "Amplitude", "Wavelength", "Pitch", "Sound pressure"],
  faqs: [
    {question: "Does amplitude change the pitch of a sound?", answer: "No. In the simplified wave model, pitch depends on frequency while amplitude changes the size of the pressure variation."},
    {question: "Why does wavelength change when frequency changes?", answer: "For a fixed sound speed, v = f lambda. Increasing frequency therefore decreases wavelength."},
  ],
};

export const metadata = teachingGuideMetadata(config);

export default function SoundWavesGuidePage() {
  return <TeachingGuidePage config={config} />;
}
