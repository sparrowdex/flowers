import PeaceLily from './prakriti';
import OrangeGladiolus from './aarushi';
import PinkCarnationScene from './simran';

const plantData = {
  'prakriti': {
    plantName: 'Peace Lily',
    description: [
      "Your plant identity is the <span className=\"text-white font-bold\">Peace Lily</span>.",
      "Like the Peace Lily, you carry a quiet elegance, a presence that doesn't demand attention but commands it naturally. Beneath your calm exterior burns a constant flame of determination and drive.",
      "While this flower thrives in gentle light, its bloom glows with an inner luminescence, just as you radiate strength and purpose even in moments of stillness.",
      "<span className=\"italic font-bold\">Resilient. Graceful. Quietly powerful.</span>"
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
      "Your plant identity is the <span className=\"text-white font-bold\">Gladiolus</span>.",
      "Like the Gladiolus, you stand tall and vibrant—a symbol of integrity, faithfulness, and honor. Your presence brings a necessary splash of color and joy to the world around you.",
      "Known for its towering flower spikes reaching for the sky, the Gladiolus mirrors your own high aspirations and your relentless determination to reach new heights.",
      "<span className=\"italic font-bold\">Strong. Vibrant. Ambitious.</span>"
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
  },
  'simran': {
    plantName: 'Pink Carnation',
    description: [
      "Your plant identity is the <span className=\"text-white font-bold\">Pink Carnation</span>.",
      "Just like this flower, you have a presence that is <i>impossible to forget</i>. You represent <b>deep gratitude and admiration</b>—a reflection of the genuine warmth and effortless grace you bring into every room.",
      "While others might fade, the Pink Carnation is celebrated for its <b>resilience and lasting beauty</b>, reflecting a spirit that remains vibrant and steadfast as you step into this new chapter.",
      "<span className=\"italic font-bold\">Unforgettable. Radiant. Soulful.</span>"
    ],
    component: PinkCarnationScene,
    hasAudio: true,
    funFacts: [
      "The \"Never Forget\" Flower: In the historical Victorian language of flowers, pink carnations carry the specific and beautiful meaning of \"I will never forget you.\"",
      "The Original Color: While they now come in almost every color, the very first wild carnations discovered in the Mediterranean over 2,000 years ago were almost exclusively shades of pink.",
      "A \"Divine\" Name: Their scientific name is Dianthus, which comes from the Greek words Dios (God) and Anthos (Flower). Dedicating this flower is literally calling someone a \"Divine Flower.\"",
      "Symbol of Gratitude: While red is for passion, pink is the official color for gratitude and admiration. It tells the person, \"I am so thankful for your presence in my life.\"",
      "Built to Last: Carnations are famous for their extraordinary longevity. As cut flowers, they can stay fresh for up to three weeks—a perfect symbol for a person who is steady, resilient, and reliable.",
      "The \"Pinking\" Connection: The word \"pink\" (to describe the color) is actually thought to have come from the flower! The jagged, \"pinking shear\" edges of the petals gave the color its name, rather than the other way around.",
      "The Flower of \"Hugs\": Unlike other flowers that drop their petals as they fade, carnations \"hug\" their petals inward toward their heart. Because of this, they are often used to represent a love that holds on tight and never dies.",
      "A Clove-Scented Secret: Many varieties of pink carnations have a spicy, clove-like fragrance. They were used in the Elizabethan era to spice wine and ale when actual cloves were too expensive.",
      "The Exam Tradition: At Oxford University, students have a tradition of wearing carnations to their exams. They wear pink for all the exams in the middle of their testing period to represent the \"steady journey\" and endurance.",
      "A \"Flesh\" Connection: Some historians believe the name \"carnation\" comes from the Latin carnis (flesh), referring to the soft, skin-toned pink of the original blooms—representing the human, warm touch of a close relationship."
    ]
  }
};

export default plantData;