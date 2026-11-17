import type { BrainQuestion } from "./questionTypes";

export const EXPANDED_QUESTIONS: BrainQuestion[] = [
  {
    "id": "xv-001",
    "domain": "Visual patterns",
    "skill": "Shape progression",
    "difficulty": "Easy",
    "prompt": "A sequence repeats in groups of three: circle, square, triangle, circle, square, triangle. What is next?",
    "options": [
      "Circle",
      "Square",
      "Triangle",
      "Diamond"
    ],
    "answer": 0,
    "explanation": "The three-shape cycle restarts after triangle, so the next shape is circle."
  },
  {
    "id": "xv-002",
    "domain": "Visual patterns",
    "skill": "Alternating fill",
    "difficulty": "Easy",
    "prompt": "A row alternates filled and hollow diamonds. If the first five are filled, hollow, filled, hollow, filled, what is sixth?",
    "options": [
      "Filled diamond",
      "Hollow diamond",
      "Filled circle",
      "Hollow circle"
    ],
    "answer": 1,
    "explanation": "The fill state alternates at every position; an even-numbered position is hollow."
  },
  {
    "id": "xv-003",
    "domain": "Visual patterns",
    "skill": "Rotation",
    "difficulty": "Medium",
    "prompt": "A pointer turns 45° clockwise at each step. It points north-west at the start. Where does it point after three steps?",
    "options": [
      "North",
      "North-east",
      "East",
      "South"
    ],
    "answer": 2,
    "explanation": "North-west → north → north-east → east. The final direction is east."
  },
  {
    "id": "xv-004",
    "domain": "Visual patterns",
    "skill": "Counting",
    "difficulty": "Medium",
    "prompt": "A pattern contains 2, 4, 7, 11, and 16 dots in successive frames. How many dots are in the next frame?",
    "options": [
      "20",
      "21",
      "22",
      "23"
    ],
    "answer": 2,
    "explanation": "The increases are +2, +3, +4, +5. The next increase is +6, giving 22."
  },
  {
    "id": "xv-005",
    "domain": "Visual patterns",
    "skill": "Reflection",
    "difficulty": "Hard",
    "prompt": "An arrow points north-east. It is reflected across a vertical mirror line. Which direction does its image point?",
    "options": [
      "South-east",
      "North-west",
      "South-west",
      "North-east"
    ],
    "answer": 1,
    "explanation": "A vertical reflection reverses left and right while preserving up and down, changing north-east to north-west."
  },
  {
    "id": "xn-001",
    "domain": "Number patterns",
    "skill": "Increasing differences",
    "difficulty": "Easy",
    "prompt": "Find the next term: 6, 10, 14, 18, …",
    "options": [
      "20",
      "21",
      "22",
      "24"
    ],
    "answer": 2,
    "explanation": "Each term increases by 4, so 18 + 4 = 22."
  },
  {
    "id": "xn-002",
    "domain": "Number patterns",
    "skill": "Multiplicative sequence",
    "difficulty": "Easy",
    "prompt": "Complete the sequence: 5, 15, 45, 135, …",
    "options": [
      "270",
      "360",
      "405",
      "540"
    ],
    "answer": 2,
    "explanation": "Each term is multiplied by 3; 135 × 3 = 405."
  },
  {
    "id": "xn-003",
    "domain": "Number patterns",
    "skill": "Alternating operations",
    "difficulty": "Medium",
    "prompt": "What comes next? 4, 8, 7, 14, 13, 26, …",
    "options": [
      "24",
      "25",
      "27",
      "52"
    ],
    "answer": 1,
    "explanation": "The operations alternate ×2 and −1. After 26, subtract 1 to get 25."
  },
  {
    "id": "xn-004",
    "domain": "Number patterns",
    "skill": "Square numbers",
    "difficulty": "Medium",
    "prompt": "Which number completes the sequence: 1, 4, 9, 16, 25, __, 49?",
    "options": [
      "30",
      "32",
      "36",
      "40"
    ],
    "answer": 2,
    "explanation": "These are consecutive squares from 1² through 7². The missing term is 6² = 36."
  },
  {
    "id": "xn-005",
    "domain": "Number patterns",
    "skill": "Prime numbers",
    "difficulty": "Hard",
    "prompt": "What is the smallest prime number greater than 50?",
    "options": [
      "51",
      "52",
      "53",
      "55"
    ],
    "answer": 2,
    "explanation": "51 is divisible by 3, 52 is even, and 53 has no divisors other than 1 and itself."
  },
  {
    "id": "xl-001",
    "domain": "Logic",
    "skill": "Syllogisms",
    "difficulty": "Easy",
    "prompt": "All lanterns are objects. Some objects are wooden. Which conclusion must be true?",
    "options": [
      "All lanterns are wooden",
      "Some lanterns are wooden",
      "All lanterns are objects",
      "No objects are lanterns"
    ],
    "answer": 2,
    "explanation": "The first statement directly establishes that every lantern is an object. The second statement does not link lanterns to wooden objects."
  },
  {
    "id": "xl-002",
    "domain": "Logic",
    "skill": "Ordering",
    "difficulty": "Easy",
    "prompt": "Nia finishes before Omar. Pia finishes after Omar. Who finishes last?",
    "options": [
      "Nia",
      "Omar",
      "Pia",
      "Cannot be determined"
    ],
    "answer": 2,
    "explanation": "The order is Nia, then Omar, then Pia. Pia finishes last."
  },
  {
    "id": "xl-003",
    "domain": "Logic",
    "skill": "Conditional reasoning",
    "difficulty": "Medium",
    "prompt": "If the key is missing, the cabinet cannot be opened. The cabinet was opened. What must be true?",
    "options": [
      "The key was not missing",
      "The key was broken",
      "The cabinet was empty",
      "The cabinet was opened without permission"
    ],
    "answer": 0,
    "explanation": "If a missing key prevents opening and the cabinet was opened, the key was not missing."
  },
  {
    "id": "xl-004",
    "domain": "Logic",
    "skill": "Constraint satisfaction",
    "difficulty": "Medium",
    "prompt": "A code has three different digits. The first digit is 2. The second is greater than the first. The third is less than the first. Which code satisfies all rules?",
    "options": [
      "2-1-3",
      "2-3-1",
      "1-3-2",
      "2-2-1"
    ],
    "answer": 1,
    "explanation": "In 2-3-1, all digits differ, 3 is greater than 2, and 1 is less than 2."
  },
  {
    "id": "xl-005",
    "domain": "Logic",
    "skill": "Truth conditions",
    "difficulty": "Hard",
    "prompt": "Exactly one statement is true: (A) The token is red. (B) The token is blue. The token is not red. What follows?",
    "options": [
      "The token is red",
      "The token is blue",
      "The token is both colours",
      "Its colour cannot be determined"
    ],
    "answer": 1,
    "explanation": "Statement A is false. Exactly one statement must be true, so statement B is true."
  },
  {
    "id": "xvbl-001",
    "domain": "Verbal reasoning",
    "skill": "Functional analogy",
    "difficulty": "Easy",
    "prompt": "Compass is to direction as clock is to …",
    "options": [
      "Distance",
      "Time",
      "Weight",
      "Temperature"
    ],
    "answer": 1,
    "explanation": "A compass indicates direction; a clock indicates time."
  },
  {
    "id": "xvbl-002",
    "domain": "Verbal reasoning",
    "skill": "Antonyms",
    "difficulty": "Easy",
    "prompt": "Choose the word most opposite in meaning to 'reluctant'.",
    "options": [
      "Unwilling",
      "Hesitant",
      "Eager",
      "Cautious"
    ],
    "answer": 2,
    "explanation": "Reluctant means unwilling or hesitant. Eager expresses willingness and enthusiasm."
  },
  {
    "id": "xvbl-003",
    "domain": "Verbal reasoning",
    "skill": "Classification",
    "difficulty": "Medium",
    "prompt": "Which word does not belong with the others?",
    "options": [
      "Whisper",
      "Murmur",
      "Mutter",
      "Shout"
    ],
    "answer": 3,
    "explanation": "Whisper, murmur and mutter describe quiet speech; shout is loud."
  },
  {
    "id": "xvbl-004",
    "domain": "Verbal reasoning",
    "skill": "Word relationships",
    "difficulty": "Medium",
    "prompt": "Blueprint is to building as recipe is to …",
    "options": [
      "Kitchen",
      "Meal",
      "Ingredient",
      "Chef"
    ],
    "answer": 1,
    "explanation": "A blueprint is a plan used to construct a building; a recipe is used to prepare a meal."
  },
  {
    "id": "xvbl-005",
    "domain": "Verbal reasoning",
    "skill": "Inference",
    "difficulty": "Hard",
    "prompt": "A notice says: 'Visitors may enter the archive only when accompanied by a staff member.' Which visitor is permitted to enter?",
    "options": [
      "A visitor carrying an invitation",
      "A visitor who has booked online",
      "A visitor accompanied by a staff member",
      "A visitor who has visited before"
    ],
    "answer": 2,
    "explanation": "The notice makes staff accompaniment a necessary condition. The other details do not satisfy it."
  },
  {
    "id": "xs-001",
    "domain": "Spatial reasoning",
    "skill": "Direction sense",
    "difficulty": "Easy",
    "prompt": "You face west and turn 90° clockwise. Which direction do you face?",
    "options": [
      "North",
      "South",
      "East",
      "West"
    ],
    "answer": 0,
    "explanation": "A 90° clockwise turn from west points north."
  },
  {
    "id": "xs-002",
    "domain": "Spatial reasoning",
    "skill": "Cube reasoning",
    "difficulty": "Easy",
    "prompt": "A cube has six faces. How many faces meet at any one vertex?",
    "options": [
      "2",
      "3",
      "4",
      "6"
    ],
    "answer": 1,
    "explanation": "Three square faces meet at each vertex of a cube."
  },
  {
    "id": "xs-003",
    "domain": "Spatial reasoning",
    "skill": "Coordinate movement",
    "difficulty": "Medium",
    "prompt": "A point moves 4 units north and then 3 units east. What is its straight-line distance from the start?",
    "options": [
      "5 units",
      "6 units",
      "7 units",
      "8 units"
    ],
    "answer": 0,
    "explanation": "The movements form perpendicular sides of a 3-4-5 right triangle, so the direct distance is 5."
  },
  {
    "id": "xs-004",
    "domain": "Spatial reasoning",
    "skill": "Paper folding",
    "difficulty": "Medium",
    "prompt": "A square is folded once vertically and once horizontally. A hole is punched through all layers away from the fold lines. How many holes appear after unfolding?",
    "options": [
      "2",
      "3",
      "4",
      "8"
    ],
    "answer": 2,
    "explanation": "Two folds create four layers. A punch away from both fold lines appears in four symmetric positions."
  },
  {
    "id": "xs-005",
    "domain": "Spatial reasoning",
    "skill": "3D geometry",
    "difficulty": "Hard",
    "prompt": "A cube is painted on all six faces and cut into 125 equal smaller cubes (5×5×5). How many small cubes have exactly one painted face?",
    "options": [
      "36",
      "48",
      "54",
      "60"
    ],
    "answer": 2,
    "explanation": "Each face contributes (5−2)² = 9 interior face cubes; six faces contribute 54."
  }
];

export const EXPANDED_DIFFICULTY_BY_ID: Record<string, BrainDifficulty> = Object.fromEntries(
  EXPANDED_QUESTIONS.map((question) => [question.id, question.difficulty]),
);
