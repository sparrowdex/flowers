import PeaceLily from './prakriti';
import OrangeGladiolus from './aarushi';

const plantData = {
  'prakriti': {
    plantName: 'Peace Lily',
    description: [
      "Your plant identity is the <span className=\"text-white font-medium\">Peace Lily</span>.",
      "Like the Peace Lily, you carry a quiet elegance—a presence that doesn't demand attention but commands it naturally. Beneath your calm exterior burns a constant flame of determination and drive.",
      "The Peace Lily thrives in gentle light, yet its white bloom glows with an inner luminescence, just as you radiate strength and purpose even in moments of stillness.",
      "Resilient. Graceful. Quietly powerful."
    ],
    component: PeaceLily,
    hasAudio: true,
    funFacts: [
      "Peace lilies are not true lilies.",
      "They are native to tropical regions of the Americas and southeastern Asia.",
      "The white 'flower' is actually a specialized leaf bract.",
      "Peace lilies are known for their air-purifying qualities.",
      "They can thrive in low-light conditions.",
    ]
  },
  'aarushi': {
    plantName: 'Gladiolus',
    description: [
      "Your plant identity is the <span className=\"text-white font-medium\">Gladiolus</span>.",
      "Like the Gladiolus, you stand tall and vibrant, a symbol of strength of character, faithfulness, and honor. Your presence brings a splash of color and joy to the world.",
      "The Gladiolus is known for its towering flower spikes, reaching for the sky, much like your own aspirations and determination to reach new heights.",
      "Strong. Vibrant. Ambitious."
    ],
    component: OrangeGladiolus,
    hasAudio: true,
    funFacts: [
      "The name 'gladiolus' comes from the Latin word 'gladius', meaning 'sword'.",
      "They are part of the iris family.",
      "In the language of flowers, 'gladiolus' represents moral integrity and determination, echoing someone who keeps going no matter how heavy life feels.",
      "There are over 10,000 cultivated varieties of gladiolus.",
      "Gladiolus blooms open gradually from the bottom upward, like a person who reveals their layers slowly once they feel safe with you.",
      "Gladiolus flowers come in almost every color except for true blue.",
    ]
  }
};

export default plantData;
