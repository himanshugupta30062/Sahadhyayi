import {
  SCIENCE_PROMPTS,
  SCIENCE_QUESTION_SET_VERSION,
  type ScienceDomain,
  type SciencePrompt,
  type ScienceDifficulty,
} from "../../../supabase/functions/_shared/sciencePrompts";

export { SCIENCE_QUESTION_SET_VERSION };
export type { ScienceDomain, ScienceDifficulty };

export type ScienceQuestion = SciencePrompt & {
  context: string;
  scientist: { name: string; contribution: string; href: string } | null;
  book: { title: string; author: string; searchQuery: string };
  youtubeSearch: string;
};

type ScienceLearningDetails = Pick<
  ScienceQuestion,
  "context" | "scientist" | "book" | "youtubeSearch"
>;

/**
 * Learning links and context are public. Reference answers and evaluation
 * criteria are kept separately in the Edge Function only.
 */
const SCIENCE_LEARNING_DETAILS: Record<string, ScienceLearningDetails> = {
  "fan-cooling": {
    context: "Think about moving air, heat leaving your skin and what happens when sweat evaporates.",
    scientist: {
      name: "Michael Faraday",
      contribution: "His work on electromagnetism helped establish principles behind electric motors.",
      href: "https://en.wikipedia.org/wiki/Michael_Faraday",
    },
    book: { title: "The New Way Things Work", author: "David Macaulay", searchQuery: "The New Way Things Work David Macaulay" },
    youtubeSearch: "how a ceiling fan cools the human body convection evaporation",
  },
  "air-conditioner": {
    context: "Describe the job of the refrigerant, indoor coil, compressor and outdoor coil.",
    scientist: {
      name: "Willis Carrier",
      contribution: "He developed the modern electrical air-conditioning system for controlling indoor temperature and humidity.",
      href: "https://en.wikipedia.org/wiki/Willis_Carrier",
    },
    book: { title: "Refrigeration and Air Conditioning Technology", author: "Bill Whitman, Bill Johnson and John Tomczyk", searchQuery: "Refrigeration and Air Conditioning Technology Whitman Johnson Tomczyk" },
    youtubeSearch: "vapor compression refrigeration cycle how air conditioner works",
  },
  "bus-braking": {
    context: "Think about what your body was doing just before the driver applied the brakes.",
    scientist: {
      name: "Isaac Newton",
      contribution: "His first law of motion describes inertia: an object resists a change in its state of motion.",
      href: "https://en.wikipedia.org/wiki/Isaac_Newton",
    },
    book: { title: "Conceptual Physics", author: "Paul G. Hewitt", searchQuery: "Conceptual Physics Paul Hewitt" },
    youtubeSearch: "Newton first law inertia passengers moving bus brakes demonstration",
  },
  "pressure-cooker": {
    context: "Consider what pressure does to the boiling temperature of water and the temperature of the steam.",
    scientist: {
      name: "Denis Papin",
      contribution: "His seventeenth-century steam digester was an important predecessor of the pressure cooker.",
      href: "https://en.wikipedia.org/wiki/Denis_Papin",
    },
    book: { title: "Chemistry: The Central Science", author: "Theodore L. Brown and co-authors", searchQuery: "Chemistry The Central Science Brown" },
    youtubeSearch: "why pressure cooker cooks food faster boiling point explained",
  },
  "refrigerator": {
    context: "Think of it as a heat-moving machine that uses electrical energy.",
    scientist: {
      name: "Jacob Perkins",
      contribution: "He patented an early practical vapor-compression refrigeration machine in 1834.",
      href: "https://en.wikipedia.org/wiki/Jacob_Perkins",
    },
    book: { title: "The New Way Things Work", author: "David Macaulay", searchQuery: "The New Way Things Work David Macaulay" },
    youtubeSearch: "how refrigerator works evaporator condenser compressor explained",
  },
  "airplane-lift": {
    context: "Think about the wing's shape, its angle to the airflow, pressure differences and the air pushed downward.",
    scientist: {
      name: "The Wright brothers",
      contribution: "Orville and Wilbur Wright developed and demonstrated the first successful powered, controlled heavier-than-air aircraft.",
      href: "https://en.wikipedia.org/wiki/Wright_brothers",
    },
    book: { title: "Aerodynamics for Naval Aviators", author: "H. H. Hurt Jr.", searchQuery: "Aerodynamics for Naval Aviators H H Hurt" },
    youtubeSearch: "NASA how airplane wings generate lift angle of attack downwash",
  },
  "microwave-oven": {
    context: "Think about electromagnetic waves, molecules in food and how metal interacts with the waves.",
    scientist: {
      name: "Percy Spencer",
      contribution: "His work with radar equipment led to the development of the microwave oven.",
      href: "https://en.wikipedia.org/wiki/Percy_Spencer",
    },
    book: { title: "The New Way Things Work", author: "David Macaulay", searchQuery: "The New Way Things Work David Macaulay" },
    youtubeSearch: "how microwave oven works dielectric heating metal sparks explained",
  },
  "cold-glass": {
    context: "Think about water vapour in the surrounding air and what happens when moist air touches a cold surface.",
    scientist: {
      name: "John Dalton",
      contribution: "His work on gases and partial pressures helped explain how water vapour behaves in air.",
      href: "https://en.wikipedia.org/wiki/John_Dalton",
    },
    book: { title: "Meteorology Today", author: "C. Donald Ahrens", searchQuery: "Meteorology Today C Donald Ahrens" },
    youtubeSearch: "dew point condensation water droplets outside cold glass explained",
  },
  "iron-rusting": {
    context: "Think about the roles of iron, oxygen and water, and why salt can make corrosion faster.",
    scientist: {
      name: "Humphry Davy",
      contribution: "His electrochemical research helped establish an understanding of corrosion and protective metals.",
      href: "https://en.wikipedia.org/wiki/Humphry_Davy",
    },
    book: { title: "Chemistry: The Central Science", author: "Theodore L. Brown and co-authors", searchQuery: "Chemistry The Central Science Brown" },
    youtubeSearch: "electrochemical rusting of iron oxygen water salt explained",
  },
  "seasons": {
    context: "Think about sunlight angle, day length and why the Northern and Southern Hemispheres have opposite seasons.",
    scientist: {
      name: "Johannes Kepler",
      contribution: "His laws describe planetary motion and provide useful context for understanding Earth's orbit.",
      href: "https://en.wikipedia.org/wiki/Johannes_Kepler",
    },
    book: { title: "Astronomy Today", author: "Eric Chaisson and Steve McMillan", searchQuery: "Astronomy Today Chaisson McMillan" },
    youtubeSearch: "NASA seasons explained Earth's axial tilt not distance from Sun",
  },
};

export const SCIENCE_QUESTIONS: ScienceQuestion[] = SCIENCE_PROMPTS.map((prompt) => ({
  ...prompt,
  ...SCIENCE_LEARNING_DETAILS[prompt.id],
}));

export function shuffleScienceQuestions(
  questions: ScienceQuestion[] = SCIENCE_QUESTIONS,
  random: () => number = Math.random,
): ScienceQuestion[] {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}


/**
 * Keep one stable ten-question topic set while progressively increasing the
 * reasoning expected at each level. The difficulty version is stored with
 * each attempt so future question-bank changes remain comparable.
 */
export function getScienceQuestionsForDifficulty(difficulty: ScienceDifficulty): ScienceQuestion[] {
  const challengeByDifficulty: Record<ScienceDifficulty, string> = {
    beginner: "Explain the main idea in everyday language. Identify what is happening and why.",
    intermediate: "Explain the cause-and-effect sequence. Name the important components or scientific principles and connect them clearly.",
    advanced: "Analyze the underlying mechanism in depth. Discuss interacting factors, relevant limitations or exceptions, and use a precise scientific explanation rather than only naming the concept.",
  };
  return SCIENCE_QUESTIONS.map((question) => ({
    ...question,
    prompt: question.prompt + "\n\nChallenge level: " + challengeByDifficulty[difficulty],
  }));
}
