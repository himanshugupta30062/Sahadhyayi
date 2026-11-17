export type ScienceDomain =
  | "Physics"
  | "Technology & engineering"
  | "Chemistry"
  | "Earth & space science";

export type SciencePrompt = {
  id: string;
  title: string;
  domain: ScienceDomain;
  prompt: string;
};

/**
 * This is the one public source of question IDs and prompt text.
 * It contains no answer key, scoring guidance, or private evaluation data.
 */
export const SCIENCE_QUESTION_SET_VERSION = "everyday-science-v1";

export const SCIENCE_PROMPTS: SciencePrompt[] = [
  {
    id: "fan-cooling",
    title: "The ceiling fan",
    domain: "Physics",
    prompt: "Why does a ceiling fan make us feel cooler even though it usually does not significantly lower the room's air temperature?",
  },
  {
    id: "air-conditioner",
    title: "The air conditioner",
    domain: "Technology & engineering",
    prompt: "How does an air conditioner move heat out of a room, and why does its outdoor unit release warm air?",
  },
  {
    id: "bus-braking",
    title: "A braking bus",
    domain: "Physics",
    prompt: "Why do passengers tend to lean or move forward when a moving bus brakes suddenly?",
  },
  {
    id: "pressure-cooker",
    title: "The pressure cooker",
    domain: "Chemistry",
    prompt: "Why does food generally cook faster in a pressure cooker than in an ordinary open pot of boiling water?",
  },
  {
    id: "refrigerator",
    title: "The refrigerator",
    domain: "Technology & engineering",
    prompt: "A refrigerator does not create cold from nothing. Explain how it keeps the inside cool and where the removed heat goes.",
  },
  {
    id: "airplane-lift",
    title: "An airplane wing",
    domain: "Physics",
    prompt: "How does an airplane wing generate lift and help an aircraft stay in the air?",
  },
  {
    id: "microwave-oven",
    title: "The microwave oven",
    domain: "Technology & engineering",
    prompt: "How does a microwave oven heat food, and why can ordinary metal objects cause problems inside it?",
  },
  {
    id: "cold-glass",
    title: "Water on a cold glass",
    domain: "Earth & space science",
    prompt: "On a humid day, tiny water droplets appear on the outside of a cold glass. Where does that water come from?",
  },
  {
    id: "iron-rusting",
    title: "Rust on iron",
    domain: "Chemistry",
    prompt: "Why does an iron gate or bicycle chain tend to rust faster when it is exposed to damp air?",
  },
  {
    id: "seasons",
    title: "The seasons",
    domain: "Earth & space science",
    prompt: "Why does Earth experience different seasons, and why are they mainly caused by Earth's axial tilt rather than its changing distance from the Sun?",
  },
];
