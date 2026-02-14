import PeaceLily from './prakriti';
import OrangeGladiolus from './aarushi';
import PinkCarnationScene from './simran';
import BlueOrchid from './kaashvi';
import SweetPeaApp from './mahi';
import LotusScene from './jaisu';
import ValentineScene from './valentine'; // Ensure you created src/valentine.jsx

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
      "In the language of flowers, 'gladiolus' represents moral integrity and determination.",
      "There are over 10,000 cultivated varieties of gladiolus.",
      "Gladiolus blooms open gradually from the bottom upward.",
      "Gladiolus flowers come in almost every color except for true blue.",
    ]
  },
  'simran': {
    plantName: 'Pink Carnation',
    description: [
      "Your plant identity is the <span className=\"text-white font-bold\">Pink Carnation</span>.",
      "Just like this flower, you have a presence that is <i>impossible to forget</i>. You represent <b>deep gratitude and admiration</b>—a reflection of the genuine warmth and effortless grace you bring into every room.",
      "While others might fade, the Pink Carnation is celebrated for its <b>resilience and lasting beauty</b>.",
      "<span className=\"italic font-bold\">Unforgettable. Radiant. Soulful.</span>"
    ],
    component: PinkCarnationScene,
    hasAudio: true,
    funFacts: [
      "The \"Never Forget\" Flower: carries the specific meaning of \"I will never forget you.\"",
      "The Original Color: First wild carnations were almost exclusively shades of pink.",
      "A \"Divine\" Name: Dianthus comes from Greek Dios (God) and Anthos (Flower).",
      "Symbol of Gratitude: Pink is the official color for gratitude and admiration.",
      "Built to Last: As cut flowers, they can stay fresh for up to three weeks.",
      "The \"Pinking\" Connection: The jagged edges of the petals gave the color its name.",
      "The Flower of \"Hugs\": Carnations \"hug\" their petals inward toward their heart.",
      "A Clove-Scented Secret: Many varieties have a spicy, clove-like fragrance.",
      "The Exam Tradition: Oxford students wear pink for the \"steady journey.\"",
      "A \"Flesh\" Connection: Name may come from Latin carnis, referring to warm skin tones."
    ]
  },
  'kaashvi': {
    plantName: 'Blue Orchid',
    description: [
      "Your plant identity is the <span className=\"text-white font-bold\">Blue Orchid</span>.",
      "Like the Blue Orchid, you possess an air of mystery and sophistication, blooming in the most unexpected places.",
      "Orchids symbolize love, beauty, and strength, much like your own resilient spirit.",
      "<span className=\"italic font-bold\">Mysterious. Elegant. Resilient.</span>"
    ],
    component: BlueOrchid,
    hasAudio: true,
    funFacts: [
      "Orchids are one of the largest families of flowering plants.",
      "The Blue Orchid is not naturally occurring; most are dyed.",
      "Orchids have a symbiotic relationship with fungi in the wild.",
      "The word 'orchid' comes from the Greek word 'orkhis'.",
      "Orchids can take up to 10 years to bloom from seed.",
      "They are known for intricate shapes mimicking insects.",
      "The vanilla flavor comes from the orchid family.",
      "Some orchids can live for over 100 years."
    ]
  },
  'mahi': {
    plantName: 'Sweet Pea',
    description: [
      "Your plant identity is the <span className=\"text-white font-bold\">Sweet Pea</span>.",
      "Like the Sweet Pea, you bring joy and delight wherever you go with your charming personality.",
      "Sweet Peas symbolize blissful pleasure and gratitude, reflecting your kind heart.",
      "<span className=\"italic font-bold\">Charming. Joyful. Grateful.</span>"
    ],
    component: SweetPeaApp,
    hasAudio: true,
    funFacts: [
      "Sweet peas are native to the Mediterranean region.",
      "The name comes from the sweet scent detectable from feet away.",
      "There are over 1,000 different varieties in various colors.",
      "They are annual climbers that can grow up to 6-8 feet tall.",
      "Sweet peas are often used in Victorian floral arrangements.",
      "The flowers are edible and used for decoration.",
      "They symbolize departure and blissful pleasure."
    ]
  },
  'jaisu': {
    plantName: 'Lotus',
    description: [
      "Your plant identity is the <span className=\"text-white font-bold\">Lotus</span>.",
      "Like the Lotus, you rise above challenges with grace and purity, blooming even in muddy waters.",
      "The Lotus symbolizes enlightenment, rebirth, and spiritual awakening.",
      "<span className=\"italic font-bold\">Graceful. Resilient. Enlightened.</span>"
    ],
    component: LotusScene,
    hasAudio: true,
    funFacts: [
      "Lotus flowers symbolize purity and enlightenment.",
      "Lotus seeds can remain viable for up to 1,300 years.",
      "The flowers open in the morning and close at night.",
      "Lotus plants have floating leaves up to 3 feet in.", ]
  },
  'valentine': {
    plantName: 'The Heart Bloom',
    component: ValentineScene,
    hasAudio: true,
  }
};

export default plantData;