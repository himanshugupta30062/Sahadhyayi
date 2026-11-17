import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Clock3, RotateCcw, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { generateMatrixPuzzle, type MatrixDifficulty, type MatrixPuzzle } from "@/lib/brain/matrixGenerator";
import MatrixTile from "@/components/brain/MatrixTile";

type Domain = "Visual patterns" | "Logic" | "Number patterns" | "Verbal reasoning" | "Spatial reasoning";
type Question = { id: string; domain: Domain; prompt: string; options: string[]; answer: number; explanation: string; visual?: string[]; visualOptions?: string[]; matrixPuzzle?: MatrixPuzzle };

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


type Difficulty = "Easy" | "Medium" | "Hard";
type PracticeDomain = "All areas" | Domain;
type AttemptHistoryEntry = { date: string; score: number; total: number; mode: string; domains?: Record<string, { correct: number; total: number }> };
const DIFFICULTY_BY_ID: Record<string, Difficulty> = {
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
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
const localDayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function BrainIQTest() {
  const [searchParams] = useSearchParams();
  const practiceMode = searchParams.get("mode") === "practice";
  const dailyMode = searchParams.get("mode") === "daily";
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [seconds, setSeconds] = useState(TEST_SECONDS);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("Medium");
  const [selectedDomain, setSelectedDomain] = useState<PracticeDomain>("All areas");
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryEntry[]>([]);
  const baseQuestions = useMemo(() => dailyMode ? [QUESTIONS[0], QUESTIONS[4], QUESTIONS[8]] : QUESTIONS.filter((question) => DIFFICULTY_BY_ID[question.id] === selectedDifficulty && (!practiceMode || selectedDomain === "All areas" || question.domain === selectedDomain)), [dailyMode, practiceMode, selectedDifficulty, selectedDomain]);
  const [attemptQuestions, setAttemptQuestions] = useState<Question[] | null>(null);
  const plannedMatrixCount = !dailyMode && (!practiceMode || selectedDomain === "All areas" || selectedDomain === "Visual patterns") ? 3 : 0;
  const questions = attemptQuestions ?? baseQuestions;
  const current = questions[index];
  const score = questions.reduce((sum, question) => sum + (answers[question.id] === question.answer ? 1 : 0), 0);
  const activityDays = useMemo(() => new Set(attemptHistory.filter((attempt) => Number.isFinite(new Date(attempt.date).getTime())).map((attempt) => localDayKey(new Date(attempt.date)))), [attemptHistory]);
  const activityCalendar = useMemo(() => Array.from({ length: 28 }, (_, offset) => {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - (27 - offset));
    const key = localDayKey(day);
    return { key, label: day.toLocaleDateString(undefined, { weekday: "short" }), dayNumber: day.getDate(), isToday: offset === 27, completed: activityDays.has(key) };
  }), [activityDays]);
  const activeDaysInWindow = activityCalendar.filter((day) => day.completed).length;
  const currentStreak = useMemo(() => {
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!activityDays.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (activityDays.has(localDayKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
    return streak;
  }, [activityDays]);
  const domainScores = useMemo(() => questions.reduce<Record<string, { correct: number; total: number }>>((acc, q) => {
    const item = acc[q.domain] ?? { correct: 0, total: 0 };
    item.total += 1;
    if (answers[q.id] === q.answer) item.correct += 1;
    acc[q.domain] = item;
    return acc;
  }, {}), [questions, answers]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sahadhyayi-iq-test-history");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setAttemptHistory(parsed.filter((item): item is AttemptHistoryEntry => item && typeof item.date === "string" && Number.isFinite(item.score) && Number.isFinite(item.total) && item.total > 0 && typeof item.mode === "string").slice(0, 90));
      }
    } catch { setAttemptHistory([]); }
  }, []);

  useEffect(() => {
    if (!finished || !attemptQuestions) return;
    const entry: AttemptHistoryEntry = { date: new Date().toISOString(), score, total: questions.length, mode: dailyMode ? "Daily" : practiceMode ? `Practice · ${selectedDomain} · ${selectedDifficulty}` : `Test · ${selectedDifficulty}`, domains: domainScores };
    setAttemptHistory((previous) => {
      const next = [entry, ...previous].slice(0, 90);
      try { window.localStorage.setItem("sahadhyayi-iq-test-history", JSON.stringify(next)); } catch { /* storage may be unavailable */ }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    if (!started || finished || dailyMode) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { window.clearInterval(timer); setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, dailyMode]);

  const beginAssessment = () => {
    // Daily challenge stays repeatable; other attempts receive a shuffled order.
    setAttemptQuestions(dailyMode ? baseQuestions : createAttempt(baseQuestions, selectedDifficulty, plannedMatrixCount));
    setStarted(true);
  };
  const reset = () => { setStarted(false); setFinished(false); setIndex(0); setAnswers({}); setSeconds(TEST_SECONDS); setAttemptQuestions(null); };

  return <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground"><SEO title="IQ Test Practice | Sahadhyayi" description="Practice original visual, logical, numerical, verbal and spatial reasoning questions with explanations." /><div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
    <Link to="/brain" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to IQ Test</Link>
    <div className="mt-5 flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-3 text-violet-500"><BrainCircuit className="h-6 w-6" /></div><div><Badge variant="secondary">PRACTICE ASSESSMENT</Badge><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{dailyMode ? "Daily brain challenge" : practiceMode ? "Skill practice" : "Reasoning test"}</h1></div></div>
    {attemptHistory.length > 0 && !started && <Card className="mt-6"><CardHeader className="pb-3"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-lg">Your practice consistency</CardTitle><CardDescription>Activity saved privately on this device</CardDescription></div><div className="text-right"><p className="text-2xl font-bold tabular-nums">{currentStreak}</p><p className="text-xs text-muted-foreground">day streak</p></div></div></CardHeader><CardContent><div className="grid grid-cols-7 gap-2">{activityCalendar.map((day) => <div key={day.key} title={day.key} className="flex flex-col items-center gap-1"><span className="text-[10px] text-muted-foreground">{day.label}</span><div aria-label={day.completed ? `Practice completed on ${day.key}` : `No practice on ${day.key}`} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${day.completed ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"} ${day.isToday ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-background" : ""}`}>{day.dayNumber}</div></div>)}</div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{activeDaysInWindow} active days</span><span>Last 28 days</span></div></CardContent></Card>}
    {!started && !finished && <Card className="mt-6"><CardHeader><CardTitle>Before you begin</CardTitle><CardDescription>This practice assessment uses original sample questions across visual patterns, logic, number patterns, verbal and spatial reasoning.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted/50 p-3"><Clock3 className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">{dailyMode ? "3 questions" : `${baseQuestions.length + plannedMatrixCount} questions`}</p><p className="text-xs text-muted-foreground">{dailyMode ? "Quick challenge" : `${selectedDifficulty} level`}</p></div><div className="rounded-xl bg-muted/50 p-3"><Sparkles className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">{dailyMode ? "Untimed" : "20 minutes"}</p><p className="text-xs text-muted-foreground">No penalty for skips</p></div><div className="rounded-xl bg-muted/50 p-3"><CheckCircle2 className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">Answer review</p><p className="text-xs text-muted-foreground">Explanations at the end</p></div></div>{practiceMode && <div className="space-y-2"><p className="text-sm font-medium">Focus area</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{(["All areas", "Visual patterns", "Logic", "Number patterns", "Verbal reasoning", "Spatial reasoning"] as const).map((domain) => <Button key={domain} type="button" variant={selectedDomain === domain ? "default" : "outline"} size="sm" onClick={() => setSelectedDomain(domain)} className="w-full whitespace-normal">{domain}</Button>)}</div><p className="text-xs text-muted-foreground">Choose one reasoning area to practise, or keep all areas selected.</p></div>}{!dailyMode && <div className="space-y-2"><p className="text-sm font-medium">Choose difficulty</p><div className="grid grid-cols-3 gap-2">{(["Easy", "Medium", "Hard"] as const).map((level) => <Button key={level} type="button" variant={selectedDifficulty === level ? "default" : "outline"} onClick={() => setSelectedDifficulty(level)} className="w-full">{level}<span className="ml-1 text-xs opacity-75">({QUESTIONS.filter((question) => DIFFICULTY_BY_ID[question.id] === level).length})</span></Button>)}</div><p className="text-xs text-muted-foreground">{selectedDifficulty === "Easy" ? "Build confidence with direct patterns and foundational reasoning." : selectedDifficulty === "Medium" ? "Mix multi-step patterns, deductions and verbal relationships." : "Try more demanding sequences, deductions and less familiar patterns."}</p></div>}<p className="text-sm leading-6 text-muted-foreground">This is a learning and puzzle experience—not a standardized, professionally normed IQ test. Your score reflects only this question set.</p><Button size="lg" onClick={beginAssessment} className="w-full">Begin assessment <ArrowRight className="ml-2 h-4 w-4"/></Button></CardContent></Card>}
    {started && !finished && current && <Card className="mt-6"><CardHeader><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge variant="outline">{current.domain}</Badge>{!dailyMode && <Badge variant="secondary">{selectedDifficulty}</Badge>}</div>{!dailyMode && <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground"><Clock3 className="h-4 w-4"/>{formatTime(seconds)}</span>}</div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>Question progress</span><span>{Object.keys(answers).length} of {questions.length} answered</span></div><Progress value={Object.keys(answers).length / questions.length * 100} className="mt-2"/><CardDescription>Question {index + 1} of {questions.length} · {questions.length - Object.keys(answers).length} unanswered</CardDescription><CardTitle className="pt-2 text-xl leading-7">{current.prompt}</CardTitle></CardHeader><CardContent className="space-y-3">{current.matrixPuzzle && <div className="mx-auto grid max-w-[510px] grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:gap-3 sm:p-5" role="group" aria-label="Visual matrix puzzle">{current.matrixPuzzle.cells.map((cell, tileIndex) => <div key={tileIndex} className={`flex aspect-square items-center justify-center rounded-lg border p-2 ${cell ? "border-border bg-card" : "border-2 border-dashed border-violet-500 bg-violet-500/5"}`}>{cell ? <MatrixTile cell={cell} className="h-full w-full max-h-24 max-w-24 text-foreground" /> : <span className="text-3xl font-semibold text-violet-500" aria-label="Missing tile">?</span>}</div>)}</div>}{current.visual && <div aria-label={current.visual.join(" ")} className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:gap-3 sm:p-5">{current.visual.map((tile, tileIndex) => <div key={tileIndex} className="flex aspect-square items-center justify-center rounded-lg border border-border bg-card text-2xl font-semibold sm:text-4xl">{tileIndex === 8 ? "?" : tile}</div>)}</div>}{current.options.map((option, optionIndex) => <button key={option} type="button" onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }))} aria-pressed={answers[current.id] === optionIndex} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${answers[current.id] === optionIndex ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500" : "border-border hover:bg-muted/60"} ${current.matrixPuzzle ? "min-h-24 justify-center sm:min-h-28" : ""}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{String.fromCharCode(65 + optionIndex)}</span>{current.matrixPuzzle ? <MatrixTile cell={current.matrixPuzzle.options[optionIndex]} className="h-16 w-16 text-foreground sm:h-20 sm:w-20" /> : <span>{option}</span>}</button>)}<div className="rounded-xl border border-border p-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm font-medium">Question navigator</p><p className="text-xs text-muted-foreground">{Object.keys(answers).length}/{questions.length} answered</p></div><div className="grid grid-cols-5 gap-2 sm:grid-cols-8">{questions.map((question, questionIndex) => { const answered = answers[question.id] !== undefined; const active = questionIndex === index; return <button key={question.id} type="button" onClick={() => setIndex(questionIndex)} aria-label={`Go to question ${questionIndex + 1}${answered ? ", answered" : ", unanswered"}${active ? ", current question" : ""}`} aria-current={active ? "step" : undefined} className={`flex h-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${active ? "border-violet-500 bg-violet-500 text-white" : answered ? "border-emerald-500/40 bg-emerald-500/10 text-foreground" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}>{questionIndex + 1}</button>; })}</div><div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500"/>Current</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Answered</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground"/>Unanswered</span></div></div><div className="flex flex-wrap justify-between gap-3 pt-3"><Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}><ArrowLeft className="mr-2 h-4 w-4"/>Previous</Button><Button onClick={() => index === questions.length - 1 ? setFinished(true) : setIndex((i) => i + 1)}>{index === questions.length - 1 ? "Finish test" : "Next question"}<ArrowRight className="ml-2 h-4 w-4"/></Button></div><Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setFinished(true)}>End assessment early</Button></CardContent></Card>}
    {finished && <Card className="mt-6"><CardHeader className="text-center"><div className="mx-auto rounded-full bg-emerald-500/10 p-4 text-emerald-600"><CheckCircle2 className="h-9 w-9"/></div><CardTitle className="text-2xl">Your practice results</CardTitle><CardDescription>Here is how you did on this question set.</CardDescription></CardHeader><CardContent><div className="rounded-2xl bg-muted/50 p-6 text-center"><p className="text-sm text-muted-foreground">Correct answers</p><p className="mt-1 text-4xl font-bold tabular-nums">{score}<span className="text-xl text-muted-foreground"> / {questions.length}</span></p><Progress value={score / questions.length * 100} className="mt-4"/></div>{attemptHistory.length > 0 && <div className="mt-5 space-y-5 rounded-xl border border-border p-4"><div><h3 className="font-semibold">Progress over time</h3><p className="mt-1 text-xs text-muted-foreground">Your latest {Math.min(attemptHistory.length, 8)} saved attempts · stored privately on this device</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Average</p><p className="mt-1 text-xl font-semibold tabular-nums">{Math.round(attemptHistory.slice(0, 8).reduce((sum, item) => sum + item.score / item.total, 0) / Math.min(attemptHistory.length, 8) * 100)}%</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Best attempt</p><p className="mt-1 text-xl font-semibold tabular-nums">{Math.round(Math.max(...attemptHistory.slice(0, 8).map((item) => item.score / item.total)) * 100)}%</p></div><div className="col-span-2 rounded-lg bg-muted/50 p-3 sm:col-span-1"><p className="text-xs text-muted-foreground">Attempts saved</p><p className="mt-1 text-xl font-semibold tabular-nums">{attemptHistory.length}</p></div></div><div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label="Score percentage trend across recent attempts, newest first">{[...attemptHistory].slice(0, 8).reverse().map((attempt, attemptIndex) => { const percentage = Math.round(attempt.score / attempt.total * 100); return <div key={attempt.date + attemptIndex} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] tabular-nums text-muted-foreground">{percentage}%</span><div className="w-full max-w-10 rounded-t-md bg-violet-500/80" style={{ height: `${Math.max(percentage, 4)}%` }} /><span className="text-[10px] text-muted-foreground">{new Date(attempt.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></div>; })}</div><p className="text-[11px] text-muted-foreground">Bars are shown oldest to newest. Percentages compare only the questions in each attempt.</p></div><div><h3 className="font-semibold">Reasoning area progress</h3><p className="mt-1 text-xs text-muted-foreground">Combined accuracy from saved attempts that include area-level results.</p><div className="mt-3 space-y-3">{Object.entries(attemptHistory.slice(0, 8).reduce<Record<string, { correct: number; total: number }>>((totals, attempt) => { Object.entries(attempt.domains ?? {}).forEach(([domain, result]) => { const current = totals[domain] ?? { correct: 0, total: 0 }; current.correct += result.correct; current.total += result.total; totals[domain] = current; }); return totals; }, {})).map(([domain, result]) => <div key={domain}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span>{domain}</span><span className="tabular-nums text-muted-foreground">{result.correct}/{result.total} · {Math.round(result.correct / result.total * 100)}%</span></div><Progress value={result.total ? result.correct / result.total * 100 : 0} /></div>)}</div></div></div>}{attemptHistory.length > 1 && <div className="mt-5 rounded-xl border border-border p-4"><h3 className="font-semibold">Recent attempts</h3><p className="mt-1 text-xs text-muted-foreground">Saved privately on this device · latest 90 attempts</p><div className="mt-3 space-y-2">{attemptHistory.slice(1, 6).map((attempt, attemptIndex) => <div key={attempt.date + attemptIndex} className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{new Date(attempt.date).toLocaleDateString()} · {attempt.mode}</span><Badge variant="secondary">{attempt.score}/{attempt.total} · {Math.round(attempt.score / attempt.total * 100)}%</Badge></div>)}</div></div>}<div className="mt-5 space-y-3"><h3 className="font-semibold">By reasoning area</h3>{Object.entries(domainScores).map(([domain, value])=><div key={domain} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"><span>{domain}</span><Badge variant="secondary">{value.correct}/{value.total} · {Math.round(value.correct / value.total * 100)}%</Badge></div>)}</div><div className="mt-6 space-y-4"><h3 className="font-semibold">Answer explanations</h3>{questions.map((q,i)=><div key={q.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium">{i+1}. {q.prompt}</p><Badge variant={answers[q.id]===q.answer?"default":"destructive"}>{answers[q.id]===q.answer?"Correct":"Review"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{q.explanation}</p><p className="mt-2 text-sm"><span className="text-muted-foreground">Your answer: </span>{answers[q.id] === undefined ? <span className="font-medium">Skipped</span> : <span className="font-medium">{q.options[answers[q.id]]}</span>}</p><p className="mt-1 text-sm"><span className="text-muted-foreground">Correct answer: </span><span className="font-medium">{q.options[q.answer]}</span></p></div>)}</div><p className="mt-5 text-xs leading-5 text-muted-foreground">This is not a certified IQ score, percentile or clinical assessment. No population norm has been applied.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={reset} className="flex-1"><RotateCcw className="mr-2 h-4 w-4"/>Try again</Button><Button asChild variant="outline" className="flex-1"><Link to="/brain">Back to IQ Test</Link></Button></div></CardContent></Card>}
  </div></main>;
}
