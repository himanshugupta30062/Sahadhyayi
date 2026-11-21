import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Flag,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { generateMatrixPuzzle, type MatrixDifficulty, type MatrixPuzzle } from "@/lib/brain/matrixGenerator";
import MatrixTile from "@/components/brain/MatrixTile";
import { listBrainAssessmentAttempts, saveBrainAssessmentAttempt } from "@/lib/brain/attempts";
import { EXPANDED_QUESTIONS, EXPANDED_DIFFICULTY_BY_ID } from "@/lib/brain/questionBank";

type Domain = "Visual patterns" | "Logic" | "Number patterns" | "Verbal reasoning" | "Spatial reasoning";
type Difficulty = "Easy" | "Medium" | "Hard";
type PracticeDomain = "All areas" | Domain;

type Question = {
  id: string;
  domain: Domain;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  visual?: string[];
  visualOptions?: string[];
  matrixPuzzle?: MatrixPuzzle;
  skill?: string;
  difficulty?: Difficulty;
};

type AttemptHistoryEntry = {
  date: string;
  score: number;
  total: number;
  mode: string;
  domains?: Record<string, { correct: number; total: number }>;
  durationSeconds?: number;
};

const QUESTIONS: Question[] = [
  { id: "m1", domain: "Visual patterns", prompt: "Which symbol completes the sequence?", visual: ["○", "△", "□", "△", "□", "◇", "□", "◇", "?"], options: ["○", "△", "□", "◇"], answer: 3, explanation: "Each row shifts the sequence forward; the final symbol is a diamond." },
  { id: "m2", domain: "Visual patterns", prompt: "Choose the missing tile. Each row adds one dot.", visual: ["•", "••", "•••", "••", "•••", "••••", "•••", "••••", "?"], options: ["••", "•••", "••••", "•••••"], answer: 3, explanation: "The number of dots increases by one across each row." },
  { id: "m3", domain: "Visual patterns", prompt: "What comes next in the rotation?", visual: ["↑", "→", "↓", "→", "↓", "←", "↓", "←", "?"], options: ["↑", "→", "↓", "←"], answer: 3, explanation: "The direction turns clockwise one step at a time; the final direction is left." },
  { id: "m4", domain: "Visual patterns", prompt: "Find the missing shape in this pattern.", visual: ["●", "○", "●", "○", "●", "○", "●", "○", "?"], options: ["●", "○", "▲", "□"], answer: 0, explanation: "Filled and empty circles alternate; the next is a filled circle." },

  { id: "n1", domain: "Number patterns", prompt: "What number comes next? 2, 6, 12, 20, 30, …", options: ["36", "40", "42", "44"], answer: 2, explanation: "The differences are +4, +6, +8, +10; next is +12, giving 42." },
  { id: "n2", domain: "Number patterns", prompt: "Complete the sequence: 81, 27, 9, 3, …", options: ["0", "1", "2", "6"], answer: 1, explanation: "Each term is divided by 3." },
  { id: "n3", domain: "Number patterns", prompt: "Find the missing number: 5, 11, 23, 47, __", options: ["89", "93", "95", "97"], answer: 2, explanation: "Multiply by 2 and add 1 each time." },
  { id: "l1", domain: "Logic", prompt: "All glims are norks. No nork is a vep. Which statement must be true?", options: ["Some glims are veps", "No glim is a vep", "All veps are glims", "Some norks are glims"], answer: 1, explanation: "If every glim is a nork and no nork is a vep, a glim cannot be a vep." },
  { id: "l2", domain: "Logic", prompt: "A is taller than B. B is taller than C. D is taller than A. Who is shortest?", options: ["A", "B", "C", "D"], answer: 2, explanation: "The order is D > A > B > C." },
  { id: "l3", domain: "Logic", prompt: "If today is not Monday, the library is open. The library is closed. What follows?", options: ["Today is Monday", "Today is Sunday", "The library is open tomorrow", "Nothing can be concluded"], answer: 0, explanation: "The contrapositive is: if the library is closed, today must be Monday." },
  { id: "v1", domain: "Verbal reasoning", prompt: "Book is to reading as fork is to …", options: ["Drawing", "Eating", "Writing", "Cutting"], answer: 1, explanation: "A book is a tool used for reading; a fork is a tool used for eating." },
  { id: "v2", domain: "Verbal reasoning", prompt: "Choose the word that does not belong.", options: ["Triangle", "Square", "Circle", "Cube"], answer: 3, explanation: "Cube is a three-dimensional solid; the others are two-dimensional shapes." },
  { id: "v3", domain: "Verbal reasoning", prompt: "Transparent is to opaque as scarce is to …", options: ["Rare", "Limited", "Abundant", "Precious"], answer: 2, explanation: "Opaque is the opposite of transparent; abundant is the opposite of scarce." },
  { id: "n4", domain: "Number patterns", prompt: "What comes next? 1, 1, 2, 3, 5, 8, …", options: ["11", "12", "13", "15"], answer: 2, explanation: "Each term is the sum of the two preceding terms (Fibonacci pattern)." },
  { id: "n5", domain: "Number patterns", prompt: "What comes next? 4, 9, 16, 25, …", options: ["30", "32", "36", "49"], answer: 2, explanation: "These are consecutive squares: 2², 3², 4², 5²; next is 6² = 36." },
  { id: "n6", domain: "Number patterns", prompt: "Complete the sequence: 3, 8, 15, 24, 35, …", options: ["42", "46", "48", "50"], answer: 2, explanation: "The differences are +5, +7, +9, +11; next is +13, giving 48." },
  { id: "l4", domain: "Logic", prompt: "Mira is older than Dev. Dev is older than Asha. Which statement is certainly true?", options: ["Asha is older than Mira", "Mira is older than Asha", "Dev is oldest", "Asha and Mira are the same age"], answer: 1, explanation: "The order is Mira > Dev > Asha, so Mira is older than Asha." },
  { id: "l5", domain: "Logic", prompt: "Every red card is numbered. This card is red. What must be true?", options: ["It is numbered", "It is blue", "It is unnumbered", "No conclusion follows"], answer: 0, explanation: "The rule applies to every red card, including this one." },
  { id: "v4", domain: "Verbal reasoning", prompt: "Seed is to plant as egg is to …", options: ["Nest", "Bird", "Shell", "Feather"], answer: 1, explanation: "A seed can grow into a plant; an egg can develop into a bird." },
  { id: "v5", domain: "Verbal reasoning", prompt: "Choose the closest meaning of 'concise'.", options: ["Brief", "Confusing", "Detailed", "Uncertain"], answer: 0, explanation: "Concise means expressing something clearly in few words." },
  { id: "m5", domain: "Visual patterns", prompt: "Which symbol comes next? ★, ☆, ★, ☆, ★, …", options: ["★", "☆", "○", "△"], answer: 1, explanation: "Filled and outline stars alternate; the next is an outline star." },
  { id: "m6", domain: "Visual patterns", prompt: "Complete the sequence: ↗, ↘, ↙, ↖, …", options: ["↗", "↘", "↙", "↖"], answer: 0, explanation: "The arrow rotates 90° clockwise each step, returning to ↗." },

  { id: "s1", domain: "Spatial reasoning", prompt: "A paper is folded in half from left to right. A hole is punched through the folded paper away from the fold. How many holes appear when it is fully unfolded?", options: ["1", "2", "3", "4"], answer: 1, explanation: "The punch passes through both layers, creating two symmetric holes when unfolded." },
  { id: "s2", domain: "Spatial reasoning", prompt: "A cube has faces numbered 1 through 6, with opposite faces summing to 7. Which number is opposite 2?", options: ["3", "4", "5", "6"], answer: 2, explanation: "Opposite faces sum to 7, so the face opposite 2 is 5." },
  { id: "s3", domain: "Spatial reasoning", prompt: "You face north, turn 90° clockwise, then 180° anticlockwise. Which direction do you face?", options: ["North", "East", "South", "West"], answer: 3, explanation: "North → east after the clockwise turn; a 180° anticlockwise turn points west." },
  { id: "s4", domain: "Spatial reasoning", prompt: "A square sheet is rotated one quarter-turn clockwise. Which corner moves to the top-right position?", options: ["Top-left", "Top-right", "Bottom-right", "Bottom-left"], answer: 0, explanation: "After a clockwise quarter-turn, the original top-left corner moves to the top-right position." },
  { id: "s5", domain: "Spatial reasoning", prompt: "A solid cube is painted on all six outer faces and cut into 27 equal smaller cubes. How many small cubes have exactly two painted faces?", options: ["8", "12", "6", "4"], answer: 1, explanation: "The 12 edge-centre cubes each have exactly two painted faces." },
  { id: "s6", domain: "Spatial reasoning", prompt: "A person walks 3 km east, 3 km north, then 3 km west. Where are they relative to the starting point?", options: ["3 km north", "3 km south", "3 km east", "Back at the start"], answer: 0, explanation: "The east and west legs cancel, leaving a net displacement of 3 km north." },
  { id: "s7", domain: "Spatial reasoning", prompt: "A cube is viewed with face A on top and face B facing you. The cube is rolled forward once, bringing the top face toward you. Which face is now on top?", options: ["The original bottom face", "The original front face", "The original back face", "The original left face"], answer: 2, explanation: "Rolling forward brings the original back face onto the top." },
  { id: "s8", domain: "Spatial reasoning", prompt: "On a standard 8×8 chessboard, how many squares are there in total when every size is counted?", options: ["64", "128", "204", "256"], answer: 2, explanation: "There are 64 + 49 + 36 + 25 + 16 + 9 + 4 + 1 = 204 squares." },
  { id: "s9", domain: "Spatial reasoning", prompt: "A cube is painted on every face and cut into 64 equal cubes (4×4×4). How many small cubes have no paint?", options: ["4", "8", "16", "27"], answer: 1, explanation: "The unpainted interior is (4−2)³ = 8 cubes." },
  { id: "s10", domain: "Spatial reasoning", prompt: "A compass needle points east. The map is rotated 90° clockwise while the needle stays fixed in the room. Relative to the rotated map, which direction does the needle point?", options: ["North", "South", "East", "West"], answer: 0, explanation: "After the map rotates clockwise, its north direction points east in the room; the fixed east-pointing needle therefore aligns with map north." },

  { id: "m7", domain: "Visual patterns", prompt: "Which symbol completes the alternating pattern? ▲, ▲, ○, ▲, ▲, ○, ▲, ▲, …", options: ["▲", "○", "□", "◇"], answer: 1, explanation: "The repeating group is two triangles followed by one circle." },
  { id: "m8", domain: "Visual patterns", prompt: "A shape turns 90° clockwise at each step. If it points left now, which way will it point after two steps?", options: ["Up", "Right", "Down", "Left"], answer: 1, explanation: "Left → up → right after two clockwise quarter-turns." },
  { id: "m9", domain: "Visual patterns", prompt: "Complete the sequence: 1 line, 2 lines, 3 lines, 4 lines, …", options: ["2 lines", "3 lines", "4 lines", "5 lines"], answer: 3, explanation: "The number of lines increases by one at each step." },
  { id: "m10", domain: "Visual patterns", prompt: "Which item is the odd one out?", options: ["↑↓", "←→", "↗↙", "↑→"], answer: 3, explanation: "The first three pairs point in exactly opposite directions; the last pair does not." },
  { id: "n7", domain: "Number patterns", prompt: "What comes next? 7, 10, 16, 25, 37, …", options: ["49", "50", "52", "54"], answer: 2, explanation: "The differences are +3, +6, +9, +12; next is +15, giving 52." },
  { id: "n8", domain: "Number patterns", prompt: "Find the missing number: 2, 5, 11, 23, 47, …", options: ["93", "94", "95", "96"], answer: 2, explanation: "Each term is doubled and then 1 is added." },
  { id: "n9", domain: "Number patterns", prompt: "What is the next prime number after 29?", options: ["30", "31", "33", "35"], answer: 1, explanation: "31 is prime; 30, 33 and 35 have non-trivial factors." },
  { id: "n10", domain: "Number patterns", prompt: "Complete the sequence: 100, 96, 88, 76, 60, …", options: ["44", "42", "40", "38"], answer: 2, explanation: "Subtract 4, 8, 12, 16; next subtract 20 to get 40." },
  { id: "l6", domain: "Logic", prompt: "Some poets are teachers. All teachers are readers. Which conclusion must follow?", options: ["All poets are readers", "Some poets are readers", "No poets are readers", "All readers are poets"], answer: 1, explanation: "The poets who are teachers must also be readers, so some poets are readers." },
  { id: "l7", domain: "Logic", prompt: "Three boxes are labelled Apples, Oranges and Mixed. Every label is wrong. You may take one fruit from one box. Which box should you sample to identify all boxes?", options: ["Apples", "Oranges", "Mixed", "Any box"], answer: 2, explanation: "The box labelled Mixed cannot be mixed. Its single fruit reveals its true contents, allowing the other two to be deduced." },
  { id: "l8", domain: "Logic", prompt: "If the alarm is set, the light flashes. The light is not flashing. What follows?", options: ["The alarm is set", "The alarm is not set", "The light is broken", "Nothing follows"], answer: 1, explanation: "By modus tollens, if setting the alarm guarantees a flashing light and no light flashes, the alarm is not set." },
  { id: "l9", domain: "Logic", prompt: "Ravi is either in the library or the lab, but not both. He is not in the library. Where is he?", options: ["At home", "In the lab", "In both places", "Cannot be determined"], answer: 1, explanation: "The two locations are mutually exclusive and exhaustive; if he is not in the library, he is in the lab." },
  { id: "v6", domain: "Verbal reasoning", prompt: "Thermometer is to temperature as barometer is to …", options: ["Wind", "Pressure", "Rainfall", "Humidity"], answer: 1, explanation: "A thermometer measures temperature; a barometer measures atmospheric pressure." },
  { id: "v7", domain: "Verbal reasoning", prompt: "Choose the closest meaning of 'meticulous'.", options: ["Careless", "Thorough", "Hasty", "Ordinary"], answer: 1, explanation: "Meticulous means showing great attention to detail; thorough is the closest option." },
  { id: "v8", domain: "Verbal reasoning", prompt: "Chapter is to book as scene is to …", options: ["Actor", "Stage", "Play", "Audience"], answer: 2, explanation: "A chapter is a section of a book; a scene is a section of a play." },

  { id: "m11", domain: "Visual patterns", prompt: "Which symbol completes the repeating group? ◆, ●, ●, ◆, ●, ●, ◆, …", options: ["◆", "●", "▲", "■"], answer: 1, explanation: "The repeating unit is one diamond followed by two circles, so a circle comes next." },
  { id: "m12", domain: "Visual patterns", prompt: "A pointer turns 180° at every step. It points up now. Which way will it point after three steps?", options: ["Up", "Right", "Down", "Left"], answer: 2, explanation: "Three half-turns have the same final direction as one half-turn: down." },
  { id: "m13", domain: "Visual patterns", prompt: "A pattern repeats: small circle, large circle, small square, large square. What is next?", options: ["Small circle", "Large circle", "Small square", "Large square"], answer: 0, explanation: "The four-item cycle starts again with a small circle." },
  { id: "m14", domain: "Visual patterns", prompt: "How many sides should the next shape have? Triangle, square, pentagon, hexagon, …", options: ["5", "6", "7", "8"], answer: 2, explanation: "The number of sides increases by one: 3, 4, 5, 6, then 7." },
  { id: "m15", domain: "Visual patterns", prompt: "Which pair becomes the other when reflected across a vertical line?", options: ["( and )", "/ and backslash", "↑ and ↓", "b and p"], answer: 0, explanation: "A left parenthesis reflected across a vertical line becomes a right parenthesis." },
  { id: "m16", domain: "Visual patterns", prompt: "The sequence alternates between an upward arrow and its 90° clockwise rotation. What is the third arrow?", options: ["Up", "Right", "Down", "Left"], answer: 0, explanation: "The pattern is up, right, up, right; the third arrow points up." },
  { id: "n11", domain: "Number patterns", prompt: "What comes next? 1, 4, 9, 16, 25, …", options: ["30", "32", "36", "49"], answer: 2, explanation: "These are consecutive square numbers: 1² through 5²; next is 6² = 36." },
  { id: "n12", domain: "Number patterns", prompt: "Find the next term: 2, 5, 10, 17, 26, …", options: ["35", "36", "37", "38"], answer: 2, explanation: "The differences are +3, +5, +7, +9; next is +11, giving 37." },
  { id: "n13", domain: "Number patterns", prompt: "Complete the sequence: 64, 32, 16, 8, …", options: ["2", "4", "6", "12"], answer: 1, explanation: "Each term is half the preceding term, so the next is 4." },
  { id: "n14", domain: "Number patterns", prompt: "What comes next? 2, 3, 5, 8, 12, 17, …", options: ["21", "22", "23", "24"], answer: 2, explanation: "The differences increase by one: +1, +2, +3, +4, +5, then +6." },
  { id: "n15", domain: "Number patterns", prompt: "Find the next number: 3, 6, 18, 72, 360, …", options: ["1,440", "1,800", "2,160", "2,520"], answer: 2, explanation: "Multiply successively by 2, 3, 4, 5; next multiply by 6 to get 2,160." },
  { id: "n16", domain: "Number patterns", prompt: "What comes next? 121, 100, 81, 64, …", options: ["36", "49", "56", "25"], answer: 1, explanation: "These are descending squares: 11², 10², 9², 8²; next is 7² = 49." },
  { id: "l10", domain: "Logic", prompt: "All tulips are flowers. Some flowers fade quickly. What must be true about tulips?", options: ["All tulips fade quickly", "Some tulips fade quickly", "No tulips fade quickly", "No definite conclusion about tulips fading follows"], answer: 3, explanation: "The flowers that fade quickly may or may not be tulips; the premises do not establish an overlap." },
  { id: "l11", domain: "Logic", prompt: "If the server is online, the status page is green. The server is online. What follows?", options: ["The status page is green", "The status page is red", "The server is offline", "Nothing follows"], answer: 0, explanation: "The stated condition and the fact that the server is online directly imply a green status page." },
  { id: "l12", domain: "Logic", prompt: "In a race, Neha finishes before Omar. Omar finishes before Pia. Who finishes first among the three?", options: ["Neha", "Omar", "Pia", "Cannot be determined"], answer: 0, explanation: "The order is Neha, then Omar, then Pia." },
  { id: "l13", domain: "Logic", prompt: "Only registered members can borrow a book. Arun borrowed a book. Which conclusion follows?", options: ["Arun is a registered member", "Arun works at the library", "Arun owns the book", "All members borrowed a book"], answer: 0, explanation: "Borrowing is restricted to registered members, so Arun must be registered." },
  { id: "l14", domain: "Logic", prompt: "A code is valid only if it contains a letter and a digit. This code contains no digit. What follows?", options: ["The code is valid", "The code is invalid", "The code contains a letter", "Nothing can be concluded"], answer: 1, explanation: "A required condition is missing, so the code cannot be valid." },
  { id: "l15", domain: "Logic", prompt: "Four people stand in a line. K is ahead of L, and M is behind L. Which statement must be true?", options: ["K is ahead of M", "M is ahead of K", "L is first", "K and M are adjacent"], answer: 0, explanation: "K is ahead of L and L is ahead of M, so K is necessarily ahead of M." },
  { id: "v10", domain: "Verbal reasoning", prompt: "Choose the closest meaning of reluctant.", options: ["Unwilling", "Eager", "Certain", "Carefree"], answer: 0, explanation: "Reluctant means hesitant or unwilling to do something." },
  { id: "v11", domain: "Verbal reasoning", prompt: "Glove is to hand as shoe is to …", options: ["Sock", "Foot", "Lace", "Ground"], answer: 1, explanation: "A glove is worn on a hand; a shoe is worn on a foot." },
  { id: "v12", domain: "Verbal reasoning", prompt: "Choose the word that does not belong.", options: ["Whisper", "Murmur", "Shout", "Mutter"], answer: 2, explanation: "Whisper, murmur and mutter describe quiet speech; shout describes loud speech." },
  { id: "v13", domain: "Verbal reasoning", prompt: "Which word is the opposite of temporary?", options: ["Brief", "Occasional", "Permanent", "Uncertain"], answer: 2, explanation: "Permanent means lasting or intended to last indefinitely, the opposite of temporary." },
  { id: "v14", domain: "Verbal reasoning", prompt: "Editor is to manuscript as curator is to …", options: ["Museum collection", "Audience", "Ticket", "Stage"], answer: 0, explanation: "An editor works on a manuscript; a curator manages a collection." },
  { id: "v15", domain: "Verbal reasoning", prompt: "Choose the pair with the same relationship as seed : tree.", options: ["Caterpillar : butterfly", "Leaf : branch", "Root : soil", "Nest : bird"], answer: 0, explanation: "A seed can develop into a tree, just as a caterpillar develops into a butterfly." },
  { id: "s11", domain: "Spatial reasoning", prompt: "A cube is painted on all faces and cut into 27 equal smaller cubes. How many have exactly three painted faces?", options: ["4", "6", "8", "12"], answer: 2, explanation: "Only the eight corner cubes have three painted faces." },
  { id: "s12", domain: "Spatial reasoning", prompt: "A cube is painted on all faces and cut into 27 equal smaller cubes. How many have exactly one painted face?", options: ["6", "8", "12", "18"], answer: 0, explanation: "Each face has one centre cube for a 3×3×3 division, giving six cubes with exactly one painted face." },
  { id: "s13", domain: "Spatial reasoning", prompt: "You face west, turn 90° clockwise, then 90° clockwise again. Which direction do you face?", options: ["North", "East", "South", "West"], answer: 1, explanation: "West turns to north, then to east after the second clockwise quarter-turn." },
  { id: "s14", domain: "Spatial reasoning", prompt: "A person walks 4 km north, 4 km east, then 4 km south. In which direction are they from the starting point?", options: ["North", "South", "East", "West"], answer: 2, explanation: "The north and south movements cancel, leaving a net displacement 4 km east." },
  { id: "s15", domain: "Spatial reasoning", prompt: "A rectangle is rotated 180°. Where does its original top-left corner move?", options: ["Bottom-right", "Top-right", "Bottom-left", "Top-left"], answer: 0, explanation: "A half-turn maps every corner to the diagonally opposite corner." },
  { id: "s16", domain: "Spatial reasoning", prompt: "A cube is painted on all faces and cut into 64 equal smaller cubes. How many have exactly two painted faces?", options: ["8", "12", "16", "24"], answer: 3, explanation: "Each of the 12 edges has (4−2) = 2 edge-centre cubes, giving 12 × 2 = 24." },
  { id: "s17", domain: "Spatial reasoning", prompt: "On a map, east is to the right and north is up. You move two squares right and one square down. Which direction is your final position from the start?", options: ["North-east", "South-east", "South-west", "North-west"], answer: 1, explanation: "The net displacement is east and south, placing you south-east of the starting point." },
  { id: "s18", domain: "Spatial reasoning", prompt: "A square is rotated 90° anticlockwise. Where does its original bottom-right corner move?", options: ["Top-right", "Bottom-right", "Bottom-left", "Top-left"], answer: 0, explanation: "Under a 90° anticlockwise rotation, the original bottom-right corner moves to the top-right." },
  { id: "v9", domain: "Verbal reasoning", prompt: "Which pair has the same relationship as 'generous : selfish'?", options: ["Ancient : old", "Expand : contract", "Quiet : silent", "Rapid : quick"], answer: 1, explanation: "Generous and selfish are opposites, as are expand and contract." },
];

const QUESTION_BANK: Question[] = [...QUESTIONS, ...EXPANDED_QUESTIONS];

const DIFFICULTY_BY_ID: Record<string, Difficulty> = {
  ...EXPANDED_DIFFICULTY_BY_ID,
  m1: "Easy", m2: "Easy", m4: "Easy", n2: "Easy", l2: "Easy", v1: "Easy", v2: "Easy",
  m3: "Medium", n1: "Medium", n4: "Medium", n6: "Medium", l1: "Medium", l4: "Medium", v3: "Medium", v4: "Medium",
  n3: "Hard", n5: "Hard", l3: "Hard", l5: "Hard", v5: "Hard", m5: "Hard", m6: "Hard", m7: "Easy", m8: "Medium", m9: "Easy", m10: "Hard", n7: "Medium", n8: "Hard", n9: "Easy", n10: "Hard", l6: "Medium", l7: "Hard", l8: "Medium", l9: "Easy", v6: "Medium", v7: "Hard", v8: "Easy", v9: "Medium", s1: "Easy", s2: "Easy", s3: "Easy", s4: "Medium", s5: "Medium", s6: "Medium", s7: "Medium", s8: "Hard", s9: "Hard", s10: "Hard", m11: "Easy", m12: "Medium", m13: "Easy", m14: "Medium", m15: "Hard", m16: "Medium", n11: "Easy", n12: "Medium", n13: "Easy", n14: "Medium", n15: "Hard", n16: "Hard", l10: "Medium", l11: "Easy", l12: "Easy", l13: "Medium", l14: "Medium", l15: "Hard", v10: "Easy", v11: "Easy", v12: "Medium", v13: "Medium", v14: "Hard", v15: "Hard", s11: "Easy", s12: "Medium", s13: "Easy", s14: "Easy", s15: "Medium", s16: "Hard", s17: "Medium", s18: "Hard",
};

const TEST_SECONDS = 20 * 60;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createAttempt(source: Question[], difficulty: Difficulty, matrixCount: number): Question[] {
  const matrixDifficulty = difficulty.toLowerCase() as MatrixDifficulty;
  const matrixQuestions: Question[] = Array.from({ length: matrixCount }, (_, index) => {
    const matrixPuzzle = generateMatrixPuzzle(matrixDifficulty);
    return {
      id: `matrix-${index + 1}`,
      domain: "Visual patterns",
      prompt: "Choose the tile that completes the visual matrix.",
      options: matrixPuzzle.options.map((_, optionIndex) => `Option ${String.fromCharCode(65 + optionIndex)}`),
      answer: matrixPuzzle.answerIndex,
      explanation: matrixPuzzle.explanation,
      matrixPuzzle,
    };
  });

  return shuffle([...source, ...matrixQuestions]).map((question) => {
    if (question.matrixPuzzle) return question;
    const options = shuffle(question.options.map((label, originalIndex) => ({ label, originalIndex })));
    return {
      ...question,
      options: options.map((option) => option.label),
      answer: options.findIndex((option) => option.originalIndex === question.answer),
    };
  });
}

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

const localDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function getMasteryTier(pct: number): { label: string; badgeClass: string; description: string } {
  if (pct >= 90) {
    return {
      label: "Exceptional Mastery",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      description: "Remarkable accuracy and high-speed cognitive adaptability across visual, logical, and numerical paradigms.",
    };
  }
  if (pct >= 75) {
    return {
      label: "High Proficiency",
      badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
      description: "Strong structural reasoning with consistent analytical problem solving across varied reasoning challenges.",
    };
  }
  if (pct >= 50) {
    return {
      label: "Solid Foundation",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      description: "Consistent core logic with opportunities to sharpen edge-case rotation and multi-step series.",
    };
  }
  return {
    label: "Developing Thinker",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    description: "Good start! Repeated deliberate practice on one domain at a time helps recognize pattern grammars quickly.",
  };
}

export default function BrainIQTest() {
  const [searchParams] = useSearchParams();
  const practiceMode = searchParams.get("mode") === "practice";
  const dailyMode = searchParams.get("mode") === "daily";

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<"all" | "incorrect" | "flagged">("all");
  const [seconds, setSeconds] = useState(TEST_SECONDS);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("Medium");
  const [selectedDomain, setSelectedDomain] = useState<PracticeDomain>("All areas");
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryEntry[]>([]);
  const [historySyncStatus, setHistorySyncStatus] = useState<"loading" | "synced" | "local">("loading");

  const baseQuestions = useMemo(() => {
    if (dailyMode) return [QUESTIONS[0], QUESTIONS[4], QUESTIONS[8]];
    return QUESTION_BANK.filter(
      (question) =>
        DIFFICULTY_BY_ID[question.id] === selectedDifficulty &&
        (!practiceMode || selectedDomain === "All areas" || question.domain === selectedDomain),
    );
  }, [dailyMode, practiceMode, selectedDifficulty, selectedDomain]);

  const [attemptQuestions, setAttemptQuestions] = useState<Question[] | null>(null);
  const plannedMatrixCount =
    !dailyMode && (!practiceMode || selectedDomain === "All areas" || selectedDomain === "Visual patterns") ? 3 : 0;
  const questions = attemptQuestions ?? baseQuestions;
  const current = questions[index];
  const score = questions.reduce((sum, question) => sum + (answers[question.id] === question.answer ? 1 : 0), 0);

  const toggleFlag = useCallback((id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectOption = useCallback(
    (optionIndex: number) => {
      if (!current) return;
      setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
    },
    [current],
  );

  // Keyboard navigation when test is active
  useEffect(() => {
    if (!started || finished || !current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or editable element
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "1" || e.key.toLowerCase() === "a") {
        if (current.options[0]) {
          e.preventDefault();
          selectOption(0);
        }
      } else if (e.key === "2" || e.key.toLowerCase() === "b") {
        if (current.options[1]) {
          e.preventDefault();
          selectOption(1);
        }
      } else if (e.key === "3" || e.key.toLowerCase() === "c") {
        if (current.options[2]) {
          e.preventDefault();
          selectOption(2);
        }
      } else if (e.key === "4" || e.key.toLowerCase() === "d") {
        if (current.options[3]) {
          e.preventDefault();
          selectOption(3);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i < questions.length - 1 ? i + 1 : i));
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFlag(current.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [started, finished, current, questions.length, selectOption, toggleFlag]);

  const activityDays = useMemo(
    () =>
      new Set(
        attemptHistory
          .filter((attempt) => Number.isFinite(new Date(attempt.date).getTime()))
          .map((attempt) => localDayKey(new Date(attempt.date))),
      ),
    [attemptHistory],
  );

  const activityCalendar = useMemo(
    () =>
      Array.from({ length: 28 }, (_, offset) => {
        const day = new Date();
        day.setHours(12, 0, 0, 0);
        day.setDate(day.getDate() - (27 - offset));
        const key = localDayKey(day);
        return {
          key,
          label: day.toLocaleDateString(undefined, { weekday: "short" }),
          dayNumber: day.getDate(),
          isToday: offset === 27,
          completed: activityDays.has(key),
        };
      }),
    [activityDays],
  );

  const activeDaysInWindow = activityCalendar.filter((day) => day.completed).length;

  const currentStreak = useMemo(() => {
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!activityDays.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (activityDays.has(localDayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [activityDays]);

  const domainScores = useMemo(
    () =>
      questions.reduce<Record<string, { correct: number; total: number }>>((acc, q) => {
        const item = acc[q.domain] ?? { correct: 0, total: 0 };
        item.total += 1;
        if (answers[q.id] === q.answer) item.correct += 1;
        acc[q.domain] = item;
        return acc;
      }, {}),
    [questions, answers],
  );

  useEffect(() => {
    let cancelled = false;
    let localEntries: AttemptHistoryEntry[] = [];
    try {
      const saved = window.localStorage.getItem("sahadhyayi-iq-test-history");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          localEntries = parsed
            .filter(
              (item): item is AttemptHistoryEntry =>
                item &&
                typeof item.date === "string" &&
                Number.isFinite(item.score) &&
                Number.isFinite(item.total) &&
                item.total > 0 &&
                typeof item.mode === "string",
            )
            .slice(0, 90);
        }
      }
    } catch {
      localEntries = [];
    }
    setAttemptHistory(localEntries);

    void listBrainAssessmentAttempts(90)
      .then((cloudEntries) => {
        if (cancelled) return;
        if (cloudEntries === null) {
          setHistorySyncStatus("local");
          return;
        }
        const unique = new Map<string, AttemptHistoryEntry>();
        [...cloudEntries, ...localEntries].forEach((entry) => {
          unique.set(`${entry.date}|${entry.score}|${entry.total}`, entry);
        });
        const merged = [...unique.values()]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 90);
        setAttemptHistory(merged);
        setHistorySyncStatus("synced");
        try {
          window.localStorage.setItem("sahadhyayi-iq-test-history", JSON.stringify(merged));
        } catch {
          /* storage may be unavailable */
        }
      })
      .catch(() => {
        if (!cancelled) setHistorySyncStatus("local");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!finished || !attemptQuestions) return;
    const entry: AttemptHistoryEntry = {
      date: new Date().toISOString(),
      score,
      total: questions.length,
      mode: dailyMode
        ? "Daily"
        : practiceMode
          ? `Practice · ${selectedDomain} · ${selectedDifficulty}`
          : `Test · ${selectedDifficulty}`,
      domains: domainScores,
      durationSeconds: dailyMode ? 0 : TEST_SECONDS - seconds,
    };
    setAttemptHistory((previous) => {
      const next = [entry, ...previous].slice(0, 90);
      try {
        window.localStorage.setItem("sahadhyayi-iq-test-history", JSON.stringify(next));
      } catch {
        /* storage may be unavailable */
      }
      return next;
    });

    void saveBrainAssessmentAttempt({
      mode: dailyMode ? "daily" : practiceMode ? "practice" : "general",
      difficulty: dailyMode ? null : selectedDifficulty,
      questionCount: questions.length,
      correctCount: score,
      durationSeconds: entry.durationSeconds ?? 0,
      domainScores,
      completedAt: entry.date,
    })
      .then((saved) => {
        if (saved) {
          setHistorySyncStatus("synced");
          setAttemptHistory((previous) => {
            const unique = new Map(
              previous.map((item) => [`${item.date}|${item.mode}|${item.score}|${item.total}`, item]),
            );
            unique.set(`${saved.date}|${saved.mode}|${saved.score}|${saved.total}`, saved);
            return [...unique.values()]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 90);
          });
        }
      })
      .catch(() => setHistorySyncStatus("local"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    if (!started || finished || dailyMode) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, dailyMode]);

  const beginAssessment = () => {
    setAttemptQuestions(
      dailyMode ? baseQuestions : createAttempt(baseQuestions, selectedDifficulty, plannedMatrixCount),
    );
    setStarted(true);
  };

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setIndex(0);
    setAnswers({});
    setFlaggedIds(new Set());
    setReviewFilter("all");
    setSeconds(TEST_SECONDS);
    setAttemptQuestions(null);
  };

  const scorePercentage = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const masteryTier = getMasteryTier(scorePercentage);

  const filteredReviewQuestions = useMemo(() => {
    return questions.map((q, qIndex) => ({ q, originalIndex: qIndex })).filter(({ q }) => {
      if (reviewFilter === "incorrect") {
        return answers[q.id] !== q.answer;
      }
      if (reviewFilter === "flagged") {
        return flaggedIds.has(q.id);
      }
      return true;
    });
  }, [questions, answers, flaggedIds, reviewFilter]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <SEO
        title="IQ Test Practice & Cognitive Reasoning | Sahadhyayi"
        description="Practice original visual, logical, numerical, verbal and spatial reasoning questions with step-by-step verified explanations."
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Navigation link back */}
        <Link
          to="/brain"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to IQ Test
        </Link>

        {/* Page Hero Header */}
        <div className="mt-5 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 text-violet-600 ring-1 ring-violet-500/30 dark:text-violet-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold tracking-wider uppercase text-[10px]">
                {dailyMode ? "Daily Challenge" : practiceMode ? "Skill Practice" : "Standard Assessment"}
              </Badge>
              {flaggedIds.size > 0 && started && !finished && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
                  <Flag className="mr-1 h-3 w-3 fill-amber-500/30" />
                  {flaggedIds.size} flagged
                </Badge>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {dailyMode ? "Daily brain challenge" : practiceMode ? "Skill practice" : "Reasoning test"}
            </h1>
          </div>
        </div>

        {/* Practice Streak & Consistency Card (shown prior to starting) */}
        {attemptHistory.length > 0 && !started && (
          <Card className="mt-6 border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Your practice consistency</CardTitle>
                  <CardDescription>
                    Activity saved privately ·{" "}
                    {historySyncStatus === "synced"
                      ? "synced to your account"
                      : historySyncStatus === "loading"
                        ? "checking your history"
                        : "stored on this device"}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{currentStreak}</p>
                  <p className="text-xs text-muted-foreground">day streak</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {activityCalendar.map((day) => (
                  <div key={day.key} title={day.key} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{day.label}</span>
                    <div
                      aria-label={
                        day.completed ? `Practice completed on ${day.key}` : `No practice on ${day.key}`
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                        day.completed
                          ? "bg-violet-600 text-white shadow-sm"
                          : "bg-muted text-muted-foreground"
                      } ${day.isToday ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-background" : ""}`}
                    >
                      {day.dayNumber}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{activeDaysInWindow} active days</span>
                <span>Last 28 days</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Intro / Setup Card */}
        {!started && !finished && (
          <Card className="mt-6 border-border/80 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Before you begin</CardTitle>
              <CardDescription>
                This practice assessment uses original sample questions across visual patterns, logic, number
                patterns, verbal and spatial reasoning.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 transition-colors">
                  <Clock3 className="mb-2 h-4 w-4 text-violet-500" />
                  <p className="font-medium text-foreground">
                    {dailyMode ? "3 questions" : `${baseQuestions.length + plannedMatrixCount} questions`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dailyMode ? "Quick challenge" : `${selectedDifficulty} level`}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 transition-colors">
                  <Sparkles className="mb-2 h-4 w-4 text-violet-500" />
                  <p className="font-medium text-foreground">{dailyMode ? "Untimed" : "20 minutes"}</p>
                  <p className="text-xs text-muted-foreground">No penalty for skips</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 transition-colors">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-violet-500" />
                  <p className="font-medium text-foreground">Answer review</p>
                  <p className="text-xs text-muted-foreground">Explanations at the end</p>
                </div>
              </div>

              {practiceMode && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Focus area</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(
                      [
                        "All areas",
                        "Visual patterns",
                        "Logic",
                        "Number patterns",
                        "Verbal reasoning",
                        "Spatial reasoning",
                      ] as const
                    ).map((domain) => (
                      <Button
                        key={domain}
                        type="button"
                        variant={selectedDomain === domain ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDomain(domain)}
                        className="w-full whitespace-normal"
                      >
                        {domain}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose one reasoning area to practise, or keep all areas selected.
                  </p>
                </div>
              )}

              {!dailyMode && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Choose difficulty</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Easy", "Medium", "Hard"] as const).map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={selectedDifficulty === level ? "default" : "outline"}
                        onClick={() => setSelectedDifficulty(level)}
                        className="w-full"
                      >
                        {level}
                        <span className="ml-1 text-xs opacity-75">
                          ({QUESTION_BANK.filter((question) => DIFFICULTY_BY_ID[question.id] === level).length})
                        </span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedDifficulty === "Easy"
                      ? "Build confidence with direct patterns and foundational reasoning."
                      : selectedDifficulty === "Medium"
                        ? "Mix multi-step patterns, deductions and verbal relationships."
                        : "Try more demanding sequences, deductions and less familiar patterns."}
                  </p>
                </div>
              )}

              <p className="text-sm leading-6 text-muted-foreground">
                This is a learning and puzzle experience—not a standardized, professionally normed IQ test. Your
                score reflects only this question set.
              </p>

              <Button size="lg" onClick={beginAssessment} className="w-full shadow-sm">
                Begin assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Test In Progress View */}
        {started && !finished && current && (
          <Card className="mt-6 border-border/80 bg-card shadow-sm">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-violet-500/30 text-violet-600 dark:text-violet-400">
                    {current.domain}
                  </Badge>
                  {!dailyMode && <Badge variant="secondary">{selectedDifficulty}</Badge>}
                  {flaggedIds.has(current.id) && (
                    <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Flagged
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={flaggedIds.has(current.id) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => toggleFlag(current.id)}
                    className={`h-8 gap-1.5 px-2.5 text-xs transition-colors ${
                      flaggedIds.has(current.id)
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                    }`}
                    title="Bookmark or flag this question to review later (Shortcut: F)"
                  >
                    <Flag className={`h-3.5 w-3.5 ${flaggedIds.has(current.id) ? "fill-white" : ""}`} />
                    <span>{flaggedIds.has(current.id) ? "Flagged" : "Flag"}</span>
                  </Button>

                  {!dailyMode && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
                      <Clock3 className="h-3.5 w-3.5 text-violet-500" />
                      {formatTime(seconds)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Question progress</span>
                  <span>
                    {Object.keys(answers).length} of {questions.length} answered
                  </span>
                </div>
                <Progress value={(Object.keys(answers).length / questions.length) * 100} className="mt-1.5 h-2" />
              </div>

              <div className="pt-1">
                <CardDescription className="text-xs">
                  Question {index + 1} of {questions.length} · {questions.length - Object.keys(answers).length} unanswered
                </CardDescription>
                <CardTitle className="pt-1 text-xl font-semibold leading-7 tracking-tight">
                  {current.prompt}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Visual Matrix Puzzle Rendering */}
              {current.matrixPuzzle && (
                <div
                  className="mx-auto grid max-w-[510px] grid-cols-3 gap-2 rounded-2xl border border-border/80 bg-muted/30 p-3 sm:gap-3 sm:p-5"
                  role="group"
                  aria-label="Visual matrix puzzle"
                >
                  {current.matrixPuzzle.cells.map((cell, tileIndex) => (
                    <div
                      key={tileIndex}
                      className={`flex aspect-square items-center justify-center rounded-xl border p-2 shadow-2xs transition-all ${
                        cell
                          ? "border-border bg-card"
                          : "border-2 border-dashed border-violet-500 bg-violet-500/5 ring-4 ring-violet-500/10"
                      }`}
                    >
                      {cell ? (
                        <MatrixTile cell={cell} className="h-full w-full max-h-24 max-w-24 text-foreground" />
                      ) : (
                        <span className="text-3xl font-bold text-violet-600 dark:text-violet-400" aria-label="Missing tile">
                          ?
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Standard Visual Sequence Grid */}
              {current.visual && (
                <div
                  aria-label={current.visual.join(" ")}
                  className="mx-auto grid max-w-[510px] grid-cols-3 gap-2 rounded-2xl border border-border/80 bg-muted/30 p-3 sm:gap-3 sm:p-5"
                >
                  {current.visual.map((tile, tileIndex) => (
                    <div
                      key={tileIndex}
                      className="flex aspect-square items-center justify-center rounded-xl border border-border bg-card text-2xl font-bold shadow-2xs sm:text-4xl"
                    >
                      {tileIndex === 8 ? (
                        <span className="text-violet-600 dark:text-violet-400">?</span>
                      ) : (
                        tile
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Question Options */}
              <div className="space-y-2.5 pt-1">
                {current.options.map((option, optionIndex) => {
                  const isSelected = answers[current.id] === optionIndex;
                  const keyShortcut = String.fromCharCode(65 + optionIndex);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectOption(optionIndex)}
                      aria-pressed={isSelected}
                      className={`group flex min-h-14 w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500 shadow-sm"
                          : "border-border/80 bg-card hover:border-border hover:bg-muted/50"
                      } ${current.matrixPuzzle ? "min-h-24 justify-center sm:min-h-28" : ""}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                          isSelected
                            ? "border-violet-500 bg-violet-600 text-white"
                            : "border-border/80 bg-muted/50 text-muted-foreground group-hover:border-foreground/30"
                        }`}
                      >
                        {keyShortcut}
                      </span>
                      {current.matrixPuzzle ? (
                        <MatrixTile
                          cell={current.matrixPuzzle.options[optionIndex]}
                          className="h-16 w-16 text-foreground sm:h-20 sm:w-20"
                        />
                      ) : (
                        <span className="text-sm font-medium leading-relaxed sm:text-base text-foreground">
                          {option}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Keyboard navigation helper */}
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-mono">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">1</kbd>–
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">4</kbd> select
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">←</kbd>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">→</kbd> navigate
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">F</kbd> flag
                </span>
              </div>

              {/* Question Navigator */}
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 backdrop-blur-xs">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Question navigator
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {Object.keys(answers).length}/{questions.length} answered
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                  {questions.map((question, questionIndex) => {
                    const answered = answers[question.id] !== undefined;
                    const active = questionIndex === index;
                    const isFlagged = flaggedIds.has(question.id);

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setIndex(questionIndex)}
                        aria-label={`Go to question ${questionIndex + 1}${
                          answered ? ", answered" : ", unanswered"
                        }${active ? ", current question" : ""}${isFlagged ? ", flagged for review" : ""}`}
                        aria-current={active ? "step" : undefined}
                        className={`relative flex h-9 items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                          active
                            ? "border-violet-600 bg-violet-600 text-white shadow-sm ring-2 ring-violet-500/30"
                            : answered
                              ? "border-emerald-500/40 bg-emerald-500/10 text-foreground hover:bg-emerald-500/20"
                              : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        {questionIndex + 1}
                        {isFlagged && (
                          <span
                            className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white shadow-xs"
                            title="Flagged"
                          >
                            •
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-600" />
                    Current
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Answered
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    Unanswered
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Flagged
                  </span>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  className="border-border/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  onClick={() => (index === questions.length - 1 ? setFinished(true) : setIndex((i) => i + 1))}
                  className="shadow-sm"
                >
                  {index === questions.length - 1 ? "Finish test" : "Next question"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setFinished(true)}
              >
                End assessment early
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Finished / Results View */}
        {finished && (
          <Card className="mt-6 border-border/80 bg-card shadow-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <CardTitle className="mt-2 text-2xl font-bold tracking-tight">Your practice results</CardTitle>
              <CardDescription>
                Comprehensive breakdown of cognitive performance across each tested reasoning domain.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Score Meter & Mastery Card */}
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-6 text-center">
                <Badge variant="outline" className={`mb-3 px-3 py-1 font-semibold text-xs border ${masteryTier.badgeClass}`}>
                  <Award className="mr-1.5 h-3.5 w-3.5" />
                  {masteryTier.label}
                </Badge>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight tabular-nums text-foreground">
                  {score}
                  <span className="text-2xl font-semibold text-muted-foreground"> / {questions.length}</span>
                </p>
                <p className="mt-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                  {scorePercentage}% accuracy
                </p>

                <Progress value={scorePercentage} className="mt-4 h-2.5" />

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground max-w-lg mx-auto">
                  {masteryTier.description}
                </p>
              </div>

              {/* Progress Over Time & Consistency History */}
              {attemptHistory.length > 0 && (
                <div className="space-y-5 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5">
                  <div>
                    <h3 className="font-semibold text-foreground">Progress over time</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Your latest {Math.min(attemptHistory.length, 8)} saved attempts · stored privately on this device
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">
                          {Math.round(
                            (attemptHistory.slice(0, 8).reduce((sum, item) => sum + item.score / item.total, 0) /
                              Math.min(attemptHistory.length, 8)) *
                              100,
                          )}
                          %
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">Best attempt</p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {Math.round(
                            Math.max(...attemptHistory.slice(0, 8).map((item) => item.score / item.total)) * 100,
                          )}
                          %
                        </p>
                      </div>
                      <div className="col-span-2 rounded-xl border border-border/60 bg-muted/40 p-3 sm:col-span-1">
                        <p className="text-xs text-muted-foreground">Attempts saved</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">{attemptHistory.length}</p>
                      </div>
                    </div>

                    <div
                      className="mt-4 flex h-32 items-end gap-2"
                      role="img"
                      aria-label="Score percentage trend across recent attempts, newest first"
                    >
                      {[...attemptHistory]
                        .slice(0, 8)
                        .reverse()
                        .map((attempt, attemptIndex) => {
                          const percentage = Math.round((attempt.score / attempt.total) * 100);
                          return (
                            <div
                              key={attempt.date + attemptIndex}
                              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                            >
                              <span className="text-[10px] tabular-nums font-semibold text-muted-foreground">
                                {percentage}%
                              </span>
                              <div
                                className="w-full max-w-10 rounded-t-md bg-violet-600/80 transition-all hover:bg-violet-600"
                                style={{ height: `${Math.max(percentage, 6)}%` }}
                              />
                              <span className="text-[10px] text-muted-foreground truncate max-w-full">
                                {new Date(attempt.date).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Bars are shown oldest to newest. Percentages compare only the questions in each attempt.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">Reasoning area progress</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Combined accuracy from saved attempts that include area-level results.
                    </p>
                    <div className="mt-3 space-y-3">
                      {Object.entries(
                        attemptHistory.slice(0, 8).reduce<Record<string, { correct: number; total: number }>>(
                          (totals, attempt) => {
                            Object.entries(attempt.domains ?? {}).forEach(([domain, result]) => {
                              const curr = totals[domain] ?? { correct: 0, total: 0 };
                              curr.correct += result.correct;
                              curr.total += result.total;
                              totals[domain] = curr;
                            });
                            return totals;
                          },
                          {},
                        ),
                      ).map(([domain, result]) => {
                        const domainPct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
                        return (
                          <div key={domain}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-foreground">{domain}</span>
                              <span className="tabular-nums text-muted-foreground text-xs">
                                {result.correct}/{result.total} · {domainPct}%
                              </span>
                            </div>
                            <Progress value={domainPct} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* By Reasoning Area on Current Test */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Current test by reasoning area</h3>
                  <span className="text-xs text-muted-foreground">{Object.keys(domainScores).length} domains tested</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(domainScores).map(([domain, value]) => {
                    const domainPct = value.total ? Math.round((value.correct / value.total) * 100) : 0;
                    return (
                      <div
                        key={domain}
                        className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 text-sm shadow-2xs"
                      >
                        <span className="font-medium">{domain}</span>
                        <Badge
                          variant="secondary"
                          className={
                            domainPct >= 80
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : domainPct >= 50
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-destructive/10 text-destructive"
                          }
                        >
                          {value.correct}/{value.total} · {domainPct}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanations & Review with Filter Tabs */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Answer explanations</h3>
                    <p className="text-xs text-muted-foreground">Step-by-step verified cognitive reasoning steps.</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 p-1">
                    <Button
                      type="button"
                      variant={reviewFilter === "all" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setReviewFilter("all")}
                      className="h-7 px-2.5 text-xs"
                    >
                      All ({questions.length})
                    </Button>
                    <Button
                      type="button"
                      variant={reviewFilter === "incorrect" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setReviewFilter("incorrect")}
                      className="h-7 px-2.5 text-xs"
                    >
                      Review ({questions.filter((q) => answers[q.id] !== q.answer).length})
                    </Button>
                    {flaggedIds.size > 0 && (
                      <Button
                        type="button"
                        variant={reviewFilter === "flagged" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setReviewFilter("flagged")}
                        className="h-7 px-2.5 text-xs text-amber-600 dark:text-amber-400"
                      >
                        Flagged ({flaggedIds.size})
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredReviewQuestions.map(({ q, originalIndex }) => {
                    const isCorrect = answers[q.id] === q.answer;
                    const isFlagged = flaggedIds.has(q.id);

                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                          isCorrect
                            ? "border-border/80 bg-card"
                            : "border-destructive/30 bg-destructive/5 dark:bg-destructive/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {q.domain}
                              </Badge>
                              {isFlagged && (
                                <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-600">
                                  Flagged
                                </Badge>
                              )}
                            </div>
                            <p className="font-semibold text-foreground pt-1">
                              {originalIndex + 1}. {q.prompt}
                            </p>
                          </div>
                          <Badge variant={isCorrect ? "default" : "destructive"} className="shrink-0">
                            {isCorrect ? "Correct" : "Review"}
                          </Badge>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs sm:text-sm">
                          <div>
                            <span className="text-muted-foreground">Your answer: </span>
                            {answers[q.id] === undefined ? (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">Skipped</span>
                            ) : (
                              <span
                                className={`font-semibold ${
                                  isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                                }`}
                              >
                                {q.options[answers[q.id]]}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Correct answer: </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {q.options[q.answer]}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs leading-5 text-muted-foreground">
                This is not a certified IQ score, percentile or clinical assessment. No population norm has been
                applied. It is designed for cognitive puzzle practice and analytical skill development.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button onClick={reset} className="flex-1 shadow-sm">
                  <RotateCcw className="mr-2 h-4 w-4" /> Try again
                </Button>
                <Button asChild variant="outline" className="flex-1 border-border/80">
                  <Link to="/brain">Back to IQ Test</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
