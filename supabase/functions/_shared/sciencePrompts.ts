export type ScienceDifficulty = "beginner" | "intermediate" | "advanced";

export const SCIENCE_DIFFICULTY_LABELS: Record<ScienceDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

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
  difficulty: ScienceDifficulty;
};

/**
 * This is the one public source of question IDs and prompt text.
 * It contains no answer key, scoring guidance, or private evaluation data.
 */
export const SCIENCE_QUESTION_SET_VERSION = "everyday-science-v2";
export const SCIENCE_DIFFICULTY_VERSION = "difficulty-calibration-v1";

export const SCIENCE_PROMPTS: SciencePrompt[] = [
  {
    difficulty: "beginner",
    id: "fan-cooling",
    title: "The ceiling fan",
    domain: "Physics",
    prompt: "Why does a ceiling fan make us feel cooler even though it usually does not significantly lower the room's air temperature?",
  },
  {
    difficulty: "beginner",
    id: "air-conditioner",
    title: "The air conditioner",
    domain: "Technology & engineering",
    prompt: "How does an air conditioner move heat out of a room, and why does its outdoor unit release warm air?",
  },
  {
    difficulty: "beginner",
    id: "bus-braking",
    title: "A braking bus",
    domain: "Physics",
    prompt: "Why do passengers tend to lean or move forward when a moving bus brakes suddenly?",
  },
  {
    difficulty: "beginner",
    id: "pressure-cooker",
    title: "The pressure cooker",
    domain: "Chemistry",
    prompt: "Why does food generally cook faster in a pressure cooker than in an ordinary open pot of boiling water?",
  },
  {
    difficulty: "beginner",
    id: "refrigerator",
    title: "The refrigerator",
    domain: "Technology & engineering",
    prompt: "A refrigerator does not create cold from nothing. Explain how it keeps the inside cool and where the removed heat goes.",
  },
  {
    difficulty: "beginner",
    id: "airplane-lift",
    title: "An airplane wing",
    domain: "Physics",
    prompt: "How does an airplane wing generate lift and help an aircraft stay in the air?",
  },
  {
    difficulty: "beginner",
    id: "microwave-oven",
    title: "The microwave oven",
    domain: "Technology & engineering",
    prompt: "How does a microwave oven heat food, and why can ordinary metal objects cause problems inside it?",
  },
  {
    difficulty: "beginner",
    id: "cold-glass",
    title: "Water on a cold glass",
    domain: "Earth & space science",
    prompt: "On a humid day, tiny water droplets appear on the outside of a cold glass. Where does that water come from?",
  },
  {
    difficulty: "beginner",
    id: "iron-rusting",
    title: "Rust on iron",
    domain: "Chemistry",
    prompt: "Why does an iron gate or bicycle chain tend to rust faster when it is exposed to damp air?",
  },
  {
    difficulty: "beginner",
    id: "seasons",
    title: "The seasons",
    domain: "Earth & space science",
    prompt: "Why does Earth experience different seasons, and why are they mainly caused by Earth's axial tilt rather than its changing distance from the Sun?",
  },
  {
    difficulty: "intermediate",
    id: "rainbow-formation",
    title: "A rainbow after rain",
    domain: "Earth & space science",
    prompt: "Explain how sunlight and water droplets together produce a rainbow. Include what happens to the light as it enters, travels through and leaves a droplet.",
  },
  {
    difficulty: "intermediate",
    id: "echo-formation",
    title: "An echo in a valley",
    domain: "Physics",
    prompt: "Why can you hear an echo in a valley or a large empty hall but not usually in a furnished small room? Explain the role of reflection, distance and absorption.",
  },
  {
    difficulty: "intermediate",
    id: "solar-panel-current",
    title: "A solar panel",
    domain: "Technology & engineering",
    prompt: "How does a solar panel convert sunlight into electrical energy, and why can its output change with the angle of sunlight, shade and temperature?",
  },
  {
    difficulty: "intermediate",
    id: "soap-cleaning",
    title: "How soap removes grease",
    domain: "Chemistry",
    prompt: "Why does soap help water remove oily dirt that plain water struggles to wash away? Explain the different parts of a soap molecule and how they interact with oil and water.",
  },
  {
    difficulty: "intermediate",
    id: "coastal-breeze",
    title: "A sea breeze",
    domain: "Earth & space science",
    prompt: "Why does a sea breeze often blow from the sea toward the land during a sunny afternoon? Explain how different heating rates create air movement.",
  },
  {
    difficulty: "intermediate",
    id: "bicycle-gears",
    title: "Bicycle gears",
    domain: "Technology & engineering",
    prompt: "How do changing bicycle gears make pedalling easier on a hill or faster on a flat road? Explain the trade-off between force, distance and rotational speed.",
  },
  {
    difficulty: "intermediate",
    id: "floating-ship",
    title: "A heavy ship floating",
    domain: "Physics",
    prompt: "Why can a huge steel ship float while a small steel nail sinks? Explain buoyancy and the importance of the ship's overall volume and average density.",
  },
  {
    difficulty: "intermediate",
    id: "battery-energy",
    title: "A rechargeable battery",
    domain: "Chemistry",
    prompt: "How does a rechargeable battery supply electrical energy and then store energy again when charged? Describe the role of reversible chemical reactions without treating electricity as stored electrons alone.",
  },
  {
    difficulty: "intermediate",
    id: "water-filter",
    title: "A household water filter",
    domain: "Technology & engineering",
    prompt: "How can a household filter remove different kinds of impurities from water? Compare physical filtration with adsorption or other treatment stages, and explain why not every filter removes every contaminant.",
  },
  {
    difficulty: "intermediate",
    id: "moon-phases",
    title: "Phases of the Moon",
    domain: "Earth & space science",
    prompt: "Why does the Moon appear to change shape over a month even though it remains roughly spherical? Explain the changing positions of the Sun, Earth and Moon.",
  },
  {
    difficulty: "advanced",
    id: "heat-pump-efficiency",
    title: "A heat pump in winter",
    domain: "Technology & engineering",
    prompt: "A heat pump can deliver more thermal energy to a room than the electrical energy it consumes. Explain how this is possible using energy conservation, refrigerant phase changes and the temperature lift between outdoors and indoors.",
  },
  {
    difficulty: "advanced",
    id: "sonic-boom",
    title: "A sonic boom",
    domain: "Physics",
    prompt: "What changes in the pressure waves around an aircraft as it approaches and exceeds the speed of sound? Explain wavefront overlap, the shock wave and why a sonic boom is heard along a path rather than only at the instant the aircraft crosses Mach 1.",
  },
  {
    difficulty: "advanced",
    id: "catalytic-converter",
    title: "A car catalytic converter",
    domain: "Chemistry",
    prompt: "How does a three-way catalytic converter reduce harmful exhaust emissions? Explain oxidation and reduction reactions, the role of catalyst surfaces, and why the air-fuel mixture must be controlled.",
  },
  {
    difficulty: "advanced",
    id: "greenhouse-effect",
    title: "The greenhouse effect",
    domain: "Earth & space science",
    prompt: "Explain how greenhouse gases warm the lower atmosphere while allowing much incoming sunlight to pass through. Distinguish absorption and re-emission of infrared radiation from the misleading idea that the atmosphere acts exactly like a glass greenhouse.",
  },
  {
    difficulty: "advanced",
    id: "induction-cooktop",
    title: "An induction cooktop",
    domain: "Technology & engineering",
    prompt: "How does an induction cooktop heat a compatible pan without directly heating the glass surface first? Explain the alternating magnetic field, induced currents, resistive heating and factors affecting coupling.",
  },
  {
    difficulty: "advanced",
    id: "bridge-resonance",
    title: "A bridge and resonance",
    domain: "Physics",
    prompt: "How can rhythmic forces from wind, traffic or marching produce large oscillations in a bridge? Explain natural frequency, resonance, damping and why real structural failures usually involve more than a single simple resonance effect.",
  },
  {
    difficulty: "advanced",
    id: "electrolysis",
    title: "Electrolysis of water",
    domain: "Chemistry",
    prompt: "Why does splitting water into hydrogen and oxygen require an external energy input? Explain the role of electrodes, ions, electron transfer and why the gases form in a 2:1 volume ratio under comparable conditions.",
  },
  {
    difficulty: "advanced",
    id: "urban-heat-island",
    title: "An urban heat island",
    domain: "Earth & space science",
    prompt: "Why can a city remain warmer than nearby rural areas at night? Analyze surface albedo, heat capacity, evapotranspiration, urban geometry and anthropogenic heat rather than attributing the effect to one cause.",
  },
  {
    difficulty: "advanced",
    id: "regenerative-braking",
    title: "Regenerative braking",
    domain: "Technology & engineering",
    prompt: "How does regenerative braking recover some of a vehicle's kinetic energy during deceleration? Explain motor-generator operation, energy conversion, battery limits and why the process cannot recover all the vehicle's energy.",
  },
  {
    difficulty: "advanced",
    id: "turbulent-flow",
    title: "Turbulence in a fast-flowing river",
    domain: "Physics",
    prompt: "What physical factors can cause a smooth fluid flow to become turbulent? Explain inertia, viscosity, Reynolds number, boundary conditions and why the transition is not governed by one universal speed.",
  },
];
