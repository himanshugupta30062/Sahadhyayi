import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Beaker,
  BookOpen,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Filter,
  Flame,
  FlaskConical,
  Gauge,
  HelpCircle,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  Printer,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client-universal";
import { toast } from "sonner";

type Experiment = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: "Physics" | "Chemistry" | "Biology" | "Earth Science" | "Engineering";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration_minutes: number;
  age_guidance: string;
  materials: string[];
  steps: string[];
  science_explanation: string;
  safety_notes: string[];
  image_url: string | null;
  variables_to_test?: string[];
  related_science_id?: string;
  practical_tip?: string;
};

type ExperimentAttempt = {
  id: string;
  experiment_id: string;
  observations: string;
  what_learned: string | null;
  worked: boolean | null;
  created_at: string;
  experiment?: Pick<Experiment, "title" | "slug" | "category"> | null;
};

const CATEGORIES = ["All", "Physics", "Chemistry", "Biology", "Earth Science", "Engineering"] as const;
const DIFFICULTIES = ["All levels", "Beginner", "Intermediate", "Advanced"] as const;
const DURATIONS = [
  { value: "all", label: "Any time" },
  { value: "quick", label: "< 15 min" },
  { value: "medium", label: "15–30 min" },
  { value: "long", label: "30+ min" },
] as const;

const FALLBACK_EXPERIMENTS: Experiment[] = [
  {
    id: "paper-bridge",
    slug: "paper-bridge",
    title: "Build a Strong Paper Bridge",
    summary: "Discover how geometric folds and shapes allow a simple sheet of paper to support surprising weight.",
    category: "Engineering",
    difficulty: "Beginner",
    duration_minutes: 15,
    age_guidance: "Ages 7+; younger children may want adult help with coin counting.",
    materials: ["3 sheets of standard copy paper", "Two books of equal height", "20–40 coins or small uniform weights", "Ruler"],
    steps: [
      "Place two equal-height books 15 cm apart on a flat table.",
      "Lay one flat sheet across the gap. Predict how many coins it can carry before collapsing.",
      "Add coins one by one near the center. Note the weight that causes failure.",
      "Fold a second sheet into an accordion / zigzag pattern (about 1.5 cm folds).",
      "Place the pleated sheet across the same gap and load coins again. Record the difference.",
      "Try adding a flat sheet on top of the accordion to create a sandwich beam (corrugation).",
    ],
    science_explanation: "Flat paper bends easily because it has a low area moment of inertia. Folding creates vertical flanges that resist bending and compressive forces. This is the exact engineering principle behind corrugated cardboard boxes and steel I-beams in bridges.",
    safety_notes: ["Use only light, safe objects as weights (coins or plastic counters).", "Keep the bridge low over a table to avoid falling object hazards."],
    variables_to_test: [
      "What if you increase the fold height from 1 cm to 2 cm?",
      "What happens if the span between books is doubled to 30 cm?",
      "Does a cylindrical paper tube carry more weight than an accordion fold?",
    ],
    related_science_id: "bridge-resonance",
    practical_tip: "Make your folds as crisp and even as possible using the edge of a ruler.",
    image_url: null,
  },
  {
    id: "balloon-static",
    slug: "balloon-static",
    title: "Bend Water with Static Electricity",
    summary: "Use an electrically charged balloon to bend a stream of flowing water without touching it.",
    category: "Physics",
    difficulty: "Beginner",
    duration_minutes: 10,
    age_guidance: "Ages 6+ with adult supervision near sinks.",
    materials: ["1 inflated latex balloon", "Dry clean hair or woollen fabric", "Tap with a narrow, steady stream of water", "Dry paper towel"],
    steps: [
      "Turn on the tap so it produces the thinnest unbroken stream of water possible.",
      "Rub the inflated balloon vigorously against dry hair or a wool sweater for 15–20 seconds.",
      "Slowly bring the rubbed side of the balloon within 1–2 cm of the water stream without letting it touch the water.",
      "Observe the water curving towards the balloon.",
      "Test how far away the balloon can be while still visibly pulling the stream.",
    ],
    science_explanation: "Rubbing the balloon transfers electrons from hair/wool to the rubber, giving the balloon a negative electrostatic charge. Water molecules (H₂O) are polar—their hydrogen ends have a slight positive charge. The negatively charged balloon attracts the positive ends of the water molecules, pulling the lightweight stream sideways.",
    safety_notes: ["Keep the balloon and wet hands away from all electrical sockets and appliances.", "Avoid balloons if someone has a latex allergy."],
    variables_to_test: [
      "Does a comb or plastic ruler bend the water as strongly as a balloon?",
      "What happens if the water stream is wider and heavier?",
      "Does rubbing for 40 seconds bend the water more than rubbing for 10 seconds?",
    ],
    related_science_id: "fan-cooling",
    practical_tip: "Ensure hands and the balloon are completely dry; moisture dissipates static charge immediately.",
    image_url: null,
  },
  {
    id: "rainbow-density",
    slug: "rainbow-density",
    title: "Make a Layered Liquid Density Tower",
    summary: "Layer everyday kitchen liquids of different densities to create a colorful floating column.",
    category: "Chemistry",
    difficulty: "Beginner",
    duration_minutes: 20,
    age_guidance: "Ages 8+; do not ingest any liquids.",
    materials: ["Tall clear narrow glass or plastic cup", "Honey or maple syrup (50 ml)", "Dish soap (50 ml)", "Water with food colouring (50 ml)", "Vegetable oil (50 ml)", "Spoon", "Small objects: grape, plastic Lego brick, coin"],
    steps: [
      "Pour honey or syrup into the center of the container bottom without touching the sides.",
      "Carefully pour dish soap on top of the honey layer.",
      "Mix food colouring into water, then slowly drizzle the water over the back of a spoon against the inside wall of the glass.",
      "Finally, slowly drizzle vegetable oil down the side over the spoon.",
      "Let the liquid settle for 2 minutes to see 4 distinct, stable layers.",
      "Gently drop in a coin, a fresh grape, and a plastic Lego brick to see where each object floats.",
    ],
    science_explanation: "Density is mass per unit volume (D = m/V). Denser liquids sink beneath less dense ones. In order of decreasing density: Honey (~1.4 g/ml) > Dish soap (~1.06 g/ml) > Colored water (~1.0 g/ml) > Vegetable oil (~0.92 g/ml). The water and oil do not mix because water is polar and oil is non-polar.",
    safety_notes: ["Do not taste or drink the liquids once mixed.", "Clean up oil spills immediately to prevent slipping.", "Adult supervision advised when handling glassware."],
    variables_to_test: [
      "What happens if you stir the layers gently? Which ones remix and which re-separate?",
      "Can you add rubbing alcohol (colored differently) on top of the oil?",
      "Where does an ice cube float in the column?",
    ],
    related_science_id: "soap-cleaning",
    practical_tip: "Pouring over the back of a tilted spoon prevents the incoming liquid from breaking the surface boundary of the layer below.",
    image_url: null,
  },
  {
    id: "seed-germination",
    slug: "seed-germination",
    title: "Watch a Seed Wake Up: Track Germination",
    summary: "Observe seed imbibition, root emergence and geotropism in a clear observation jar.",
    category: "Biology",
    difficulty: "Beginner",
    duration_minutes: 10,
    age_guidance: "All ages. Great multi-day family science project.",
    materials: ["4–6 dry bean or pea seeds (chickpeas, kidney beans, or mung beans)", "Clear glass jar or plastic cup", "Paper towels", "Water", "Notebook or ruler"],
    steps: [
      "Dampen paper towels until moist but not soggy, and crumple them inside the jar.",
      "Wedge seeds between the damp paper towel and the clear glass wall at varying orientations.",
      "Keep the jar in a warm spot with indirect room light.",
      "Moisten the towels slightly every 1–2 days so they never dry out completely.",
      "Record day-by-day: Day 1 (swelling/imbibition), Day 2–3 (radicle root emergence), Day 4–5 (root hairs & shoot).",
      "Notice how roots always grow downward toward gravity, regardless of how the seed was oriented.",
    ],
    science_explanation: "Dry seeds are in dormancy. Absorbing water (imbibition) triggers enzymes that convert stored starches into sugars for growth. The root (radicle) emerges first, guided downward by gravity sensors (statoliths) in root cells—a phenomenon known as positive gravitropism.",
    safety_notes: ["Wash hands after handling damp seeds.", "Discard seeds if fuzzy mold appears; do not sniff mold closely."],
    variables_to_test: [
      "Does pre-soaking seeds in warm water for 4 hours accelerate germination?",
      "Do seeds germinate faster in complete darkness vs indirect light?",
      "What happens if you turn the jar upside down once the root starts growing?",
    ],
    related_science_id: "sea-breeze",
    practical_tip: "Mung beans or black-eyed peas sprout reliably within 48 hours at room temperature.",
    image_url: null,
  },
  {
    id: "paper-chromatography",
    slug: "paper-chromatography",
    title: "Separate the Secret Colours in Ink",
    summary: "Use paper chromatography and capillary action to reveal the hidden dye pigments inside black and brown markers.",
    category: "Chemistry",
    difficulty: "Beginner",
    duration_minutes: 20,
    age_guidance: "Ages 7+ with adult supervision.",
    materials: ["Water-based washable markers (black, brown, green, purple)", "White coffee filter or paper towel strips", "Clear glass or cup", "Pencil", "Water", "Ruler"],
    steps: [
      "Cut a coffee filter into a rectangular strip about 3 cm wide and 12 cm long.",
      "Use a pencil to draw a faint reference line 2 cm from the bottom edge.",
      "Make a dark, concentrated dot with a black marker on the pencil line.",
      "Pour a shallow layer of water (about 1 cm) into the glass.",
      "Hang the paper strip inside the glass so only the very bottom touches the water—keep the ink dot above water level.",
      "Watch water wick upward by capillary action, separating the black ink into blue, red, and yellow dyes as it travels.",
    ],
    science_explanation: "Paper chromatography is a separation technique. The paper is the stationary phase, and water is the mobile phase. Different dye pigments have different molecular sizes and different chemical attractions to water versus paper fibres. More soluble pigments travel faster and farther, separating into distinct bands.",
    safety_notes: ["Use only washable, water-based markers; avoid toxic solvent markers.", "Do not drink the colored water."],
    variables_to_test: [
      "Compare two different brands of black markers—do they use the same pigment blend?",
      "What happens if you use warm water instead of cold water?",
      "Can rubbing alcohol separate permanent Sharpie markers that water cannot?",
    ],
    related_science_id: "rainbow-formation",
    practical_tip: "Take the strip out when the water front is about 1 cm from the top edge and let it dry on a plate.",
    image_url: null,
  },
  {
    id: "shadow-clock",
    slug: "shadow-clock",
    title: "Build a Backyard Sun & Shadow Clock",
    summary: "Chart the Sun's apparent path and Earth's axial rotation with a calibrated shadow clock.",
    category: "Earth Science",
    difficulty: "Beginner",
    duration_minutes: 30,
    age_guidance: "Ages 7+; outdoor activity with sunny weather.",
    materials: ["Straight stick or unsharpened pencil (20–30 cm)", "Modelling clay or small pot of soil", "Chalk or large paper sheet with small stones", "Ruler or compass", "Clock / phone time"],
    steps: [
      "Find a flat outdoor spot that receives uninterrupted sunlight between 10 AM and 3 PM.",
      "Stand the stick straight up in clay on the paper sheet or pavement.",
      "Starting on the hour, mark the exact tip of the shadow and record the time next to it.",
      "Repeat the measurement every 30 or 60 minutes for at least 4 hours.",
      "Measure the length of each shadow line and observe its changing direction.",
      "Note the time when the shadow was the shortest—that is your local solar noon.",
    ],
    science_explanation: "Earth rotates 360° on its axis every 24 hours, or approximately 15° per hour from west to east. To an observer on Earth, the Sun appears to track from east to west, casting shadows that move in the opposite direction. Shadow length depends on solar altitude: highest sun produces the shortest shadow.",
    safety_notes: ["Never look directly at the Sun.", "Wear a hat and sunscreen for extended outdoor observation."],
    variables_to_test: [
      "Compare your shadow clock readings in summer versus winter at the exact same hour.",
      "Does solar noon match 12:00 PM on your clock (considering daylight saving and longitude)?",
      "What if you tilt the gnomon (stick) to match your city's latitude angle?",
    ],
    related_science_id: "moon-phases",
    practical_tip: "Ensure your stick is perpendicular to the ground using a small square or book edge.",
    image_url: null,
  },
  {
    id: "parachute",
    slug: "parachute",
    title: "Test a Mini Parachute: Air Resistance vs Gravity",
    summary: "Design and drop miniature parachutes to measure how canopy surface area and vents affect terminal velocity.",
    category: "Physics",
    difficulty: "Beginner",
    duration_minutes: 25,
    age_guidance: "Ages 8+ with adult help with scissors.",
    materials: ["Plastic grocery bag or tissue paper", "String or sewing thread", "Small paper cup or metal paperclip weight", "Scissors", "Ruler", "Timer / phone stopwatch"],
    steps: [
      "Cut a square canopy of 20 cm × 20 cm from lightweight plastic.",
      "Cut four equal pieces of string, each 25 cm long.",
      "Tape or tie one string to each corner of the square canopy.",
      "Gather the four loose ends and tie them to the same paperclip or small weight.",
      "Hold the parachute high over your head (or from safe stairs under adult supervision) and drop it.",
      "Time how many seconds it takes to reach the floor over 3 drops and calculate the average.",
      "Cut a second canopy that is 35 cm × 35 cm, attach identical strings and weight, and compare descent times.",
    ],
    science_explanation: "A falling object accelerates due to Earth's gravity (9.8 m/s²). As speed increases, upward air resistance (drag) increases until it balances gravity. At this point, the object reaches terminal velocity. A larger canopy displaces more air, creating greater drag at lower speeds and resulting in a gentler descent.",
    safety_notes: ["Never lean over balcony railings or climb on unstable furniture.", "Drop only onto a clear floor away from pets and fragile items."],
    variables_to_test: [
      "What happens if you cut a small 2 cm circular hole in the center of the canopy (a vent)?",
      "Does a circular canopy drift less than a square canopy?",
      "How does doubling the payload weight affect the drop time?",
    ],
    related_science_id: "bus-braking",
    practical_tip: "Drop the parachute without throwing it downward; release with fingers spread so the canopy opens immediately.",
    image_url: null,
  },
  {
    id: "water-filter-model",
    slug: "water-filter-model",
    title: "Build a Multi-Layer Model Water Filter",
    summary: "Construct a gravity-fed water purification model using gravel, sand, and charcoal layers.",
    category: "Earth Science",
    difficulty: "Intermediate",
    duration_minutes: 25,
    age_guidance: "Ages 9+ with adult supervision.",
    materials: ["1 clear 1-liter plastic bottle", "Clean coarse gravel or small pebbles", "Clean fine sand", "Coffee filter or cotton balls", "Dirty water sample (water mixed with garden soil and dried leaves)", "Scissors", "Collection bowl"],
    steps: [
      "With adult assistance, carefully cut off the bottom third of the plastic bottle.",
      "Turn the top portion upside down into the collection container like a funnel.",
      "Stuff a cotton ball or coffee filter into the neck of the bottle.",
      "Pour in a 3 cm layer of clean fine sand.",
      "Pour in a 3 cm layer of clean coarse gravel on top.",
      "Stir your murky soil-water mixture, then slowly pour it into the top gravel layer.",
      "Observe the filtration rate and examine the clarity of the water collected below.",
    ],
    science_explanation: "This demonstrates mechanical filtration. Coarse gravel traps large debris (leaves, twigs). Finer sand particles trap small silt grains through smaller pores. In nature, rainwater undergoes this same natural filtration as it percolates through soil layers into underground aquifers.",
    safety_notes: ["NEVER drink the filtered water—mechanical filtration does not kill bacteria, viruses, or dissolved chemicals.", "Wash hands thoroughly after handling soil water."],
    variables_to_test: [
      "What happens if you add an activated aquarium charcoal layer between sand and cotton?",
      "Does pouring muddy water through a second time improve clarity?",
      "Compare flow rate through pure sand versus pure gravel.",
    ],
    related_science_id: "water-filter",
    practical_tip: "Rinse gravel and sand with clean tap water before building the filter to remove dust.",
    image_url: null,
  },
  {
    id: "cabbage-ph-indicator",
    slug: "cabbage-ph-indicator",
    title: "Red Cabbage Kitchen pH Indicator",
    summary: "Extract anthocyanin dye from red cabbage to test the acidity or alkalinity of common household liquids.",
    category: "Chemistry",
    difficulty: "Beginner",
    duration_minutes: 25,
    age_guidance: "Ages 8+ with adult help for warm water preparation.",
    materials: ["2–3 leaves of red cabbage", "Warm water (1 cup)", "Small clear glasses or plastic cups (4–6)", "Household test liquids: Lemon juice, Vinegar, Baking soda solution, Tap water, Clear soda, Hand soap"],
    steps: [
      "Tear cabbage leaves into small pieces and steep in 1 cup of hot water for 10 minutes until deep purple.",
      "Strain the cabbage pieces out and let the purple liquid cool to room temperature.",
      "Set out 5 clear glasses and pour 2 tablespoons of cabbage juice into each.",
      "Glass 1: Add 1 teaspoon of lemon juice (turns bright pink/red—strongly acidic).",
      "Glass 2: Add 1 teaspoon of vinegar (turns pinkish-purple—moderately acidic).",
      "Glass 3: Add tap water (remains neutral purple—pH ~7).",
      "Glass 4: Add 1 teaspoon of baking soda solution (turns blue/green—weakly alkaline).",
      "Glass 5: Add soapy water (turns greenish-yellow—alkaline).",
    ],
    science_explanation: "Red cabbage contains a pigment class called anthocyanins. In acidic environments (high H⁺ concentration), anthocyanin molecules adopt a conformation that reflects red/pink light. In neutral environments, they reflect purple. In alkaline environments (high OH⁻ concentration), they gain charge and reflect blue, green, and yellow light.",
    safety_notes: ["Do not taste any mixtures once mixed with soaps or cleaners.", "Avoid using harsh chemicals like bleach or oven cleaners."],
    variables_to_test: [
      "What color does milk turn when tested?",
      "Can you add vinegar to the green baking soda glass to bring it back to purple/pink (neutralization)?",
      "Does steep time or temperature change the indicator strength?",
    ],
    related_science_id: "battery-energy",
    practical_tip: "A white plate or sheet of paper under the glasses makes the color transitions dramatically clearer.",
    image_url: null,
  },
  {
    id: "periscope-reflection",
    slug: "periscope-reflection",
    title: "Build a Simple Periscope with Two Mirrors",
    summary: "Harness the Law of Reflection with two 45° angled mirrors to see around corners and over walls.",
    category: "Physics",
    difficulty: "Intermediate",
    duration_minutes: 25,
    age_guidance: "Ages 9+ with adult help with craft knife.",
    materials: ["Tall cardboard box (e.g. empty foil box or milk carton)", "2 small flat pocket mirrors of equal size", "Tape or glue", "Pencil & ruler", "Scissors or craft knife"],
    steps: [
      "Cut viewing windows on opposite sides of the box: one near the top facing forward, one near the bottom facing backward.",
      "Carefully cut 45° diagonal slots opposite each window.",
      "Slide the first mirror into the top slot with its reflective side facing downward at 45°.",
      "Slide the second mirror into the bottom slot with its reflective side facing upward at 45°.",
      "Secure both mirrors with tape so they remain parallel to each other.",
      "Look into the bottom window—you can now see over a tabletop, around a doorway, or over high obstacles.",
    ],
    science_explanation: "Light travels in straight lines until it hits a reflective surface. The Law of Reflection states that the angle of incidence equals the angle of reflection (θᵢ = θᵣ). When incoming light hits the top mirror at 45°, it reflects 90° downward. The bottom mirror, tilted at 45°, reflects the beam another 90° into your eye, preserving the image orientation.",
    safety_notes: ["Handle mirrors by their edges to prevent cuts.", "An adult should assist with cutting thick cardboard."],
    variables_to_test: [
      "What happens if one mirror is tilted to 30° instead of 45°?",
      "Can you build a periscope that looks around a corner (90° horizontal) instead of upward?",
      "How does periscope tube length affect your field of view?",
    ],
    related_science_id: "rainbow-formation",
    practical_tip: "Aligning the two mirrors strictly parallel to each other prevents distorted or cropped images.",
    image_url: null,
  },
  {
    id: "celery-capillary-action",
    slug: "celery-capillary-action",
    title: "Celery Capillary Action & Plant Transpiration",
    summary: "Track the movement of colored water through xylem tubes in a celery stalk to visualize plant vascular transport.",
    category: "Biology",
    difficulty: "Beginner",
    duration_minutes: 15,
    age_guidance: "Ages 6+ with adult cutting stalk.",
    materials: ["Fresh crisp celery stalk with leaves attached", "Clear tall glass", "Water", "Red or blue liquid food colouring (15–20 drops)", "Knife (with adult help)"],
    steps: [
      "Fill the glass half full with room-temperature water.",
      "Add 15–20 drops of vibrant blue or red food colouring and stir.",
      "With adult help, trim 1 cm off the bottom of the celery stalk with a clean cut.",
      "Place the stalk upright into the colored water.",
      "Check after 2 hours, 6 hours, and overnight.",
      "Observe colored veins running up the stalk and dye appearing on leaf edges.",
      "Cut across the middle of the stalk to inspect the colored circular dots (xylem bundles).",
    ],
    science_explanation: "Plants lack a heart to pump fluid; they rely on capillary action and transpiration pull. Water molecules cohere to one another (cohesion) and adhere to xylem cell walls (adhesion). As water evaporates from microscopic leaf pores (stomata) during transpiration, it pulls the continuous water column upward against gravity.",
    safety_notes: ["Food coloring can stain countertops and clothes—place the glass on a plate.", "Adults should perform the knife cuts."],
    variables_to_test: [
      "Does a stalk placed in a warm, sunny breeze transport dye faster than one in a cool, humid room?",
      "What happens if you cut the stalk vertically in half at the base and put one half in blue and one in red?",
      "Does a stalk with leaves removed transport water at the same rate?",
    ],
    related_science_id: "fan-cooling",
    practical_tip: "Fresh, crisp celery stalks with plenty of leafy tops produce the fastest and most dramatic results.",
    image_url: null,
  },
  {
    id: "mini-greenhouse",
    slug: "mini-greenhouse",
    title: "Mini Greenhouse in a Jar: Thermal Radiation",
    summary: "Simulate atmospheric heat trapping by comparing temperature changes in an open versus closed glass chamber under sunlight.",
    category: "Earth Science",
    difficulty: "Intermediate",
    duration_minutes: 30,
    age_guidance: "Ages 9+ with sunny outdoor or desk lamp setup.",
    materials: ["2 identical clear glass jars", "1 jar lid or plastic wrap with rubber band", "2 identical thermometers", "Sunlight or warm incandescent desk lamp", "Timer & notebook"],
    steps: [
      "Place one thermometer face-up inside Jar A (Open) and one inside Jar B (Sealed).",
      "Seal Jar B tightly with its lid or plastic wrap; leave Jar A completely open to the air.",
      "Record starting baseline temperatures for both jars in the shade.",
      "Place both jars side-by-side in direct sunlight or 25 cm under a warm desk lamp.",
      "Record the temperature of both jars every 5 minutes for 30 minutes.",
      "Graph the two temperature curves to compare warming rates and maximum temperature.",
    ],
    science_explanation: "Incoming shortwave solar radiation passes through the clear glass and is absorbed by the jar interior, warming it. The warmed surfaces re-radiate energy as longwave infrared (heat). Glass is relatively opaque to infrared radiation and prevents convective heat escape, trapping thermal energy inside. On Earth, atmospheric gases (CO₂, H₂O, CH₄) perform a similar radiative absorption role.",
    safety_notes: ["Glass jars can get warm in direct sun—handle gently.", "Do not use heating elements that could shatter glass."],
    variables_to_test: [
      "What happens if you place a small damp sponge inside the sealed jar (adding water vapor)?",
      "Does a jar painted black on the bottom warm faster than a clear one?",
      "How quickly do the two jars cool down once moved back into the shade?",
    ],
    related_science_id: "greenhouse-effect",
    practical_tip: "Shield the thermometer bulbs from direct bulb reflection by placing them on a small piece of cardboard inside.",
    image_url: null,
  },
  {
    id: "electromagnet",
    slug: "electromagnet",
    title: "Build a Controlled Electromagnet with a Bolt",
    summary: "Wrap insulated wire around an iron core to generate a switchable magnetic field from electric current.",
    category: "Physics",
    difficulty: "Intermediate",
    duration_minutes: 20,
    age_guidance: "Ages 9+ with adult supervision. Batteries can warm up during short circuits.",
    materials: ["Large iron bolt or steel nail (8–10 cm long)", "1.5–2 meters of thin insulated copper wire (magnet wire or craft wire)", "1 fresh 1.5V D or AA battery", "Electrical tape", "Box of metal paperclips", "Sandpaper or scissors to strip wire tips"],
    steps: [
      "Leave about 10 cm of wire loose at one end, then tightly wrap the wire around the bolt in neat, tight coils (50–60 turns).",
      "Keep all windings moving in the same direction without reversing.",
      "Leave 10 cm of loose wire at the other end and tape the coil securely.",
      "Use sandpaper or scissors to scrape off the protective coating from both wire ends (1.5 cm).",
      "Tape one bare end to the negative terminal of the battery.",
      "Briefly touch the other bare end to the positive terminal while bringing the bolt tip near paperclips.",
      "Observe the bolt picking up paperclips like a magnet. Disconnect the wire and observe the paperclips drop.",
    ],
    science_explanation: "An electric current flowing through a conductor creates a magnetic field around it (Ampere's Law). Coiling the wire concentrates and aligns the magnetic field lines. The iron bolt acts as a ferromagnetic core, multiplying the magnetic field strength by hundreds of times. Breaking the circuit stops the current, collapsing the magnetic field.",
    safety_notes: ["Disconnect the battery after 10–15 seconds of testing—continuous current causes the wire and battery to get hot.", "Use only standard 1.5V AA or D batteries; never use 9V or wall outlets."],
    variables_to_test: [
      "Compare 30 coils versus 70 coils—how many more paperclips does it lift?",
      "What happens if you remove the iron bolt and test only the hollow wire coil?",
      "Does reversing the battery terminals reverse the magnetic poles?",
    ],
    related_science_id: "induction-cooktop",
    practical_tip: "Tight, neat coils without overlapping give the strongest, most uniform magnetic field.",
    image_url: null,
  },
  {
    id: "baking-soda-endothermic",
    slug: "baking-soda-endothermic",
    title: "Baking Soda & Vinegar: Gas Inflation & Cold Reaction",
    summary: "Observe an endothermic chemical reaction that absorbs heat while producing carbon dioxide to inflate a balloon.",
    category: "Chemistry",
    difficulty: "Intermediate",
    duration_minutes: 20,
    age_guidance: "Ages 8+ with adult supervision.",
    materials: ["Empty plastic water bottle (500 ml)", "Baking soda (2 tablespoons)", "White vinegar (1/2 cup)", "1 uninflated balloon", "Funnel", "Kitchen thermometer (optional)"],
    steps: [
      "Pour 1/2 cup of vinegar into the empty plastic bottle.",
      "If you have a thermometer, measure and record the starting temperature of the vinegar.",
      "Use a dry funnel to add 2 tablespoons of baking soda inside the uninflated balloon.",
      "Stretch the mouth of the balloon over the bottle neck without dropping the baking soda in yet.",
      "Lift the balloon upright so all the baking soda falls into the vinegar below.",
      "Watch rapid bubbling (effervescence) as carbon dioxide gas inflates the balloon.",
      "Feel the bottom of the bottle—notice that it gets noticeably cold to the touch.",
    ],
    science_explanation: "Acetic acid in vinegar reacts with sodium bicarbonate (NaHCO₃) to produce water, sodium acetate, and carbon dioxide gas (CO₂): CH₃COOH + NaHCO₃ → NaCH₃COO + H₂O + CO₂↑. This reaction is endothermic: breaking and rearranging chemical bonds absorbs thermal energy from the liquid, causing the temperature to drop by several degrees Celsius.",
    safety_notes: ["Wear safety glasses or keep faces away when balloon inflates.", "Ensure bottle neck seal is secure so vinegar mist does not spray."],
    variables_to_test: [
      "What happens if you use warm vinegar versus cold vinegar on reaction speed?",
      "Does doubling baking soda double the balloon volume if vinegar is limited?",
      "Measure the exact temperature drop with a digital kitchen thermometer.",
    ],
    related_science_id: "pressure-cooker",
    practical_tip: "Twist the balloon neck once after filling so no powder drops prematurely before the seal is secured.",
    image_url: null,
  },
  {
    id: "yeast-respiration",
    slug: "yeast-respiration",
    title: "Yeast Respiration: Sugar Consumption & Gas Production",
    summary: "Feed baker's yeast different sugar amounts to observe cellular respiration and carbon dioxide inflation.",
    category: "Biology",
    difficulty: "Intermediate",
    duration_minutes: 25,
    age_guidance: "Ages 8+ with warm water prep.",
    materials: ["2 packets of dry active baker's yeast", "2 identical small plastic bottles (300–500 ml)", "Warm water (about 40°C / bath-warm)", "Sugar (2 teaspoons for Bottle A, none for Bottle B)", "2 balloons", "Measuring spoon"],
    steps: [
      "Fill both bottles one-third full with warm water (~40°C).",
      "Add 2 teaspoons of sugar to Bottle A and swirl until dissolved. Leave Bottle B with plain water.",
      "Add one packet (or 1 teaspoon) of dry yeast to both bottles and swirl gently.",
      "Quickly stretch a balloon over the mouth of each bottle.",
      "Place both bottles in a warm spot and observe every 10 minutes for 30–40 minutes.",
      "Bottle A with sugar produces foam and inflates the balloon with CO₂; Bottle B stays flat.",
    ],
    science_explanation: "Yeast cells are living single-celled fungi. In the presence of warmth and food (sugar), they carry out cellular respiration and fermentation. Yeast enzymes break down glucose (C₆H₁₂O₆) to produce energy (ATP), releasing ethanol and carbon dioxide gas (CO₂). Without sugar, the yeast remains dormant.",
    safety_notes: ["Water should be comfortably warm, not boiling—water above 50°C kills yeast cells.", "Do not drink the yeast mixture."],
    variables_to_test: [
      "Does honey, maple syrup, or artificial sweetener produce the same gas volume as table sugar?",
      "Compare ice-cold water versus warm water versus boiling water.",
      "What if you add salt to Bottle A along with sugar?",
    ],
    related_science_id: "battery-energy",
    practical_tip: "Check water temperature on your inner wrist; it should feel pleasantly warm like baby bath water.",
    image_url: null,
  },
  {
    id: "catapult-elastic-energy",
    slug: "catapult-elastic-energy",
    title: "Popsicle Stick Catapult: Potential to Kinetic Energy",
    summary: "Build a class-3 lever catapult using wooden craft sticks and rubber bands to study trajectory and projectile range.",
    category: "Engineering",
    difficulty: "Beginner",
    duration_minutes: 20,
    age_guidance: "Ages 7+ with adult supervision during launches.",
    materials: ["8–10 wooden popsicle sticks", "4–5 rubber bands", "1 plastic bottle cap", "Craft glue or strong double-sided tape", "Light projectiles (marshmallow, crumpled foil ball, cotton ball)"],
    steps: [
      "Stack 6–7 craft sticks together and bind both ends tightly with rubber bands to form the fulcrum stack.",
      "Take 2 remaining sticks and bind them together tightly at only one end.",
      "Gently pry the open end apart and slide the thick fulcrum stack between them.",
      "Wrap another rubber band in an 'X' pattern around the cross junction to lock the fulcrum in place.",
      "Glue or tape a plastic bottle cap onto the top stick tip to serve as the launch bucket.",
      "Load a light marshmallow or foil ball, pull back the lever arm, and release.",
      "Measure the horizontal launch distance and adjust fulcrum placement to optimize range.",
    ],
    science_explanation: "Bending the wooden lever arm stores elastic potential energy. Upon release, this stored energy rapidly converts into kinetic energy of the projectile. Moving the fulcrum closer to or farther from the bucket changes mechanical advantage, lever arm length, and launch speed.",
    safety_notes: ["Launch ONLY soft objects (marshmallows, cotton balls, light foil). NEVER use rocks, metal, or sharp objects.", "Never aim at faces, people, or pets."],
    variables_to_test: [
      "What happens to range if the fulcrum stack is placed closer to the tied end vs closer to the bucket?",
      "Does a 45° launch angle achieve maximum horizontal distance?",
      "Compare launch distance of a lightweight cotton ball versus a slightly heavier foil ball.",
    ],
    related_science_id: "bus-braking",
    practical_tip: "Wrap rubber bands as tightly as possible; loose bands allow the frame to wobble and dissipate launch energy.",
    image_url: null,
  },
  {
    id: "hydraulic-syringes",
    slug: "hydraulic-syringes",
    title: "Two-Syringe Hydraulic Lift: Pascal's Principle",
    summary: "Connect two syringes of different sizes with water tubing to demonstrate force multiplication through hydraulic pressure.",
    category: "Engineering",
    difficulty: "Intermediate",
    duration_minutes: 30,
    age_guidance: "Ages 9+ with adult supervision.",
    materials: ["2 plastic syringes without needles (one small 5 ml or 10 ml, one large 20 ml or 30 ml)", "30 cm flexible clear aquarium or vinyl tubing that fits syringe tips snugly", "Water with a drop of food color", "Small bowl", "Tape or cardboard stand", "Small weights (e.g. toy car, coins)"],
    steps: [
      "Submerge the small syringe in water and fill it completely without air bubbles.",
      "Connect the tubing to the filled syringe underwater to ensure the tube has zero trapped air.",
      "Submerge the second (large) syringe and connect the other end of the tube.",
      "Push the small syringe plunger in—observe the large plunger extend outward.",
      "Push the large plunger in—observe the small plunger extend outward.",
      "Place a heavy weight on the large syringe and try lifting it by pressing the small syringe.",
    ],
    science_explanation: "Pascal's Principle states that pressure applied to an enclosed, incompressible fluid is transmitted equally in all directions throughout the fluid (P = F₁/A₁ = F₂/A₂). Because the large syringe has a larger piston area (A₂), the force is multiplied (F₂ = F₁ × A₂/A₁). You trade distance for force—pushing the small piston a long distance lifts a heavy weight a small distance, exactly like hydraulic brakes and car jacks.",
    safety_notes: ["Use only medical or craft plastic syringes WITHOUT needles.", "Keep pressures moderate so tubing does not pop off."],
    variables_to_test: [
      "What happens if air bubbles are trapped in the tube compared to pure water? (Compressibility of air vs water)",
      "Compare force multiplication using equal-size syringes versus different-size syringes.",
      "Measure how many centimeters the small piston moves for 1 cm of large piston movement.",
    ],
    related_science_id: "pressure-cooker",
    practical_tip: "Bleeding all air out under a bowl of water ensures instant hydraulic response with zero spongy lag.",
    image_url: null,
  },
  {
    id: "dna-strawberry",
    slug: "dna-strawberry",
    title: "Extract Real Visible DNA from a Strawberry",
    summary: "Lyse strawberry cell membranes with household detergent and salt, then precipitate visible strands of real DNA with cold alcohol.",
    category: "Biology",
    difficulty: "Intermediate",
    duration_minutes: 30,
    age_guidance: "Ages 10+ with adult supervision for rubbing alcohol.",
    materials: ["1 fresh or frozen ripe strawberry", "Clear rubbing alcohol (70% or 91% isopropyl alcohol, chilled in freezer for 1 hour)", "Dish soap (2 teaspoons)", "Table salt (1/2 teaspoon)", "Water (1/2 cup)", "Zip-top plastic bag", "Small clear glass or shot glass", "Coffee filter or fine strainer", "Wooden toothpick or skewer"],
    steps: [
      "Chill rubbing alcohol in the freezer for at least 1 hour before starting.",
      "Mix extraction buffer: 1/2 cup water, 2 teaspoons dish soap, and 1/2 teaspoon salt. Stir gently without making bubbles.",
      "Remove green leafy cap from strawberry and place it inside the zip-top bag.",
      "Add 3 tablespoons of extraction buffer to the bag, seal tightly, and mash the strawberry thoroughly with fingers for 2 minutes.",
      "Place a coffee filter over a small glass and pour the mashed mixture through to collect clear strawberry liquid.",
      "Tilt the glass and very slowly drizzle an equal amount of ice-cold rubbing alcohol down the side so it forms a clear layer on top of the red juice.",
      "Watch white, cloudy, mucous-like threads precipitate out at the boundary—that is real strawberry DNA!",
      "Use a wooden toothpick to gently twirl and lift the spool of DNA threads out of the liquid.",
    ],
    science_explanation: "Strawberries are octoploid (they have 8 copies of each chromosome), making their DNA exceptionally abundant. Dish soap breaks open lipid bilayers in cell membranes and nuclear envelopes (lysis). Salt helps neutralize negative charges on DNA phosphate backbones, causing strands to clump together. DNA is soluble in water but insoluble in cold alcohol, causing it to precipitate out as visible fibers.",
    safety_notes: ["Rubbing alcohol is flammable and toxic if swallowed—keep away from heat, eyes, and mouth.", "Wash hands after completing the experiment."],
    variables_to_test: [
      "Can you extract visible DNA from a banana or kiwi using the exact same protocol?",
      "What happens if room-temperature alcohol is used instead of ice-cold alcohol?",
      "Why does dish soap alone without salt fail to precipitate visible fibers?",
    ],
    related_science_id: "battery-energy",
    practical_tip: "Do not shake or stir the alcohol into the strawberry juice; letting it float as a calm layer creates the cleanest DNA spool.",
    image_url: null,
  },
  {
    id: "sound-resonance-bottle",
    slug: "sound-resonance-bottle",
    title: "Measure Standing Waves & Sound Resonance in Bottles",
    summary: "Blow across bottle openings with varying water levels to discover acoustic resonance and pitch-wavelength relationships.",
    category: "Physics",
    difficulty: "Advanced",
    duration_minutes: 30,
    age_guidance: "Ages 10+.",
    materials: ["3–5 identical glass bottles (e.g. soda or juice bottles)", "Water", "Ruler", "Tuning app or musical instrument for comparison", "Spoon to gently tap glass"],
    steps: [
      "Line up 4 identical glass bottles in a row.",
      "Leave Bottle 1 empty. Fill Bottle 2 one-quarter full, Bottle 3 half full, and Bottle 4 three-quarters full.",
      "Measure the height of the air column in each bottle using a ruler.",
      "Rest your lower lip on the rim of Bottle 1 and blow gently across the top edge until a clear musical tone resonates.",
      "Repeat across all 4 bottles and compare the pitch (frequency) of the sound produced.",
      "Notice that the bottle with the shortest air column produces the highest pitch when blown.",
      "Now gently tap each bottle with a metal spoon—notice that tapping produces the opposite pitch pattern! Investigate why.",
    ],
    science_explanation: "When you blow across the bottle, you create a vortex that excites the air column inside (Helmholtz resonance and closed-pipe standing waves). A shorter air column supports a shorter standing wavelength (λ = 4L), producing a higher fundamental frequency (f = v/λ). When you tap the bottle with a spoon, you vibrate the liquid-glass system—more water mass vibrates more slowly, producing a lower frequency.",
    safety_notes: ["Tap gently with a spoon; do not strike glass hard enough to risk breakage.", "Keep bottles stable on a flat surface."],
    variables_to_test: [
      "Can you tune 5 bottles to play an exact pentatonic musical scale (Do, Re, Mi, Sol, La)?",
      "Does changing the liquid to cooking oil change the resonant pitch?",
      "Measure the resonant frequency using a free acoustic tuner phone app and calculate the speed of sound.",
    ],
    related_science_id: "bridge-resonance",
    practical_tip: "Angle your breath slightly downward across the far edge of the bottle opening rather than blowing directly into the hole.",
    image_url: null,
  },
  {
    id: "earthquake-tower",
    slug: "earthquake-tower",
    title: "Earthquake-Resistant Tower: Cross-Bracing & Base Isolation",
    summary: "Construct multi-story straw towers with different bracing architectures and test stability on a simulated earthquake shake table.",
    category: "Engineering",
    difficulty: "Advanced",
    duration_minutes: 40,
    age_guidance: "Ages 10+.",
    materials: ["Paper or plastic drinking straws (30–40)", "Modelling clay or tape", "Scissors", "Flat baking sheet or cardboard base", "4 marbles or rubber balls (for base isolation)", "Ruler"],
    steps: [
      "Build Tower A: A 3-story cube tower (at least 30 cm tall) using only square frames without diagonal bracing.",
      "Build Tower B: An identical 3-story tower, but add diagonal cross-braces ('X' patterns) across each square face.",
      "Mount each tower on a cardboard base.",
      "Place the base on a smooth table and simulate side-to-side harmonic ground shaking by sliding back and forth.",
      "Observe that Tower A twists and buckles easily due to shear forces, while Tower B resists lateral deformation.",
      "Create Tower C with base isolation: Place 4 marbles under a dual-layer cardboard plate beneath the tower so the ground shakes while the tower stays still.",
    ],
    science_explanation: "Triangles are structurally rigid: their angles cannot deform without changing side lengths, whereas squares easily deform into parallelograms under shear. Diagonal cross-bracing converts lateral earthquake forces into tension and compression along the diagonals. Base isolation decouples the building superstructure from ground acceleration, absorbing ground motion before it enters the tower.",
    safety_notes: ["Cut straws carefully away from face.", "Avoid marble hazards around small children."],
    variables_to_test: [
      "What is the maximum height-to-base ratio your braced tower can achieve before toppling?",
      "Add a small weight (pendulum mass) suspended at the top of the tower—does it act as a tuned mass damper?",
      "Compare stability under low-frequency slow shaking versus high-frequency fast shaking.",
    ],
    related_science_id: "bridge-resonance",
    practical_tip: "Joints are the most common points of failure; ensure cross-brace intersections are firmly secured with tape.",
    image_url: null,
  },
];

const difficultyTone: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Intermediate: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Advanced: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const categoryVisuals: Record<string, { bg: string; text: string }> = {
  Physics: { bg: "from-violet-500/15 via-indigo-500/10 to-background", text: "text-violet-600/80 dark:text-violet-400/80" },
  Chemistry: { bg: "from-amber-500/15 via-orange-500/10 to-background", text: "text-amber-600/80 dark:text-amber-400/80" },
  Biology: { bg: "from-emerald-500/15 via-teal-500/10 to-background", text: "text-emerald-600/80 dark:text-emerald-400/80" },
  "Earth Science": { bg: "from-sky-500/15 via-blue-500/10 to-background", text: "text-sky-600/80 dark:text-sky-400/80" },
  Engineering: { bg: "from-teal-500/15 via-cyan-500/10 to-background", text: "text-teal-600/80 dark:text-teal-400/80" },
};

export default function ScienceLab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [experiments, setExperiments] = useState<Experiment[]>(FALLBACK_EXPERIMENTS);
  const [attempts, setAttempts] = useState<ExperimentAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<"discover" | "community" | "mine">("discover");
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("All levels");
  const [duration, setDuration] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [observations, setObservations] = useState("");
  const [whatLearned, setWhatLearned] = useState("");
  const [worked, setWorked] = useState("yes");
  const [sharePublic, setSharePublic] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  // Interactive experiment tracker state
  const [checkedMaterials, setCheckedMaterials] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Timer tick effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catalogResult, communityResult] = await Promise.all([
      supabase.from("science_experiments" as any).select("*").eq("is_published", true).order("created_at", { ascending: false }),
      supabase.from("science_experiment_attempts" as any).select("id,experiment_id,observations,what_learned,worked,created_at,experiment:science_experiments(title,slug,category)").eq("share_public", true).order("created_at", { ascending: false }).limit(30),
    ]);
    if (!catalogResult.error && Array.isArray(catalogResult.data) && catalogResult.data.length) {
      setExperiments(catalogResult.data as unknown as Experiment[]);
    }
    if (!communityResult.error && Array.isArray(communityResult.data)) {
      setAttempts(communityResult.data as unknown as ExperimentAttempt[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // Deep-link to experiment via query param ?experiment=slug
  useEffect(() => {
    const targetSlug = searchParams.get("experiment");
    if (!targetSlug || !experiments.length) return;
    const found = experiments.find((exp) => exp.slug === targetSlug || exp.id === targetSlug);
    if (found) {
      setSelected(found);
      setCheckedMaterials({});
      setCheckedSteps({});
      setTimerSeconds(0);
      setTimerRunning(false);
      setShowLog(false);
    }
  }, [searchParams, experiments]);

  const handleOpenExperiment = (exp: Experiment) => {
    setSelected(exp);
    setCheckedMaterials({});
    setCheckedSteps({});
    setTimerSeconds(0);
    setTimerRunning(false);
    setShowLog(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("experiment", exp.slug);
      return next;
    });
  };

  const handleCloseExperiment = () => {
    setSelected(null);
    setShowLog(false);
    setTimerRunning(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("experiment");
      return next;
    });
  };

  const filteredExperiments = useMemo(() => experiments.filter((experiment) => {
    const matchesCategory = category === "All" || experiment.category === category;
    const matchesDifficulty = difficulty === "All levels" || experiment.difficulty === difficulty;
    const matchesDuration =
      duration === "all" ||
      (duration === "quick" && experiment.duration_minutes < 15) ||
      (duration === "medium" && experiment.duration_minutes >= 15 && experiment.duration_minutes <= 30) ||
      (duration === "long" && experiment.duration_minutes > 30);
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [experiment.title, experiment.summary, experiment.category, experiment.science_explanation, ...experiment.materials].join(" ").toLowerCase().includes(query);
    return matchesCategory && matchesDifficulty && matchesDuration && matchesSearch;
  }), [experiments, category, difficulty, duration, search]);

  const loadMyAttempts = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      toast.error("Sign in to view your experiment journal.");
      return;
    }
    const { data, error } = await supabase.from("science_experiment_attempts" as any)
      .select("id,experiment_id,observations,what_learned,worked,created_at,experiment:science_experiments(title,slug,category)")
      .eq("user_id", authData.user.id).order("created_at", { ascending: false }).limit(50);
    if (error) { toast.error("Could not load your experiment journal."); return; }
    setAttempts(data as unknown as ExperimentAttempt[]);
    setActiveTab("mine");
  };

  const startLogging = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      toast.error("Please sign in to record your experiment.");
      window.location.assign("/signin?redirect=" + encodeURIComponent("/science-lab"));
      return;
    }
    setShowLog(true);
  };

  const submitAttempt = async () => {
    if (!selected || observations.trim().length < 10) {
      toast.error("Please add at least a short observation (10 characters).");
      return;
    }
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setSaving(false);
      toast.error("Your session has expired. Please sign in again.");
      return;
    }
    const { error } = await supabase.from("science_experiment_attempts" as any).insert({
      experiment_id: selected.id,
      user_id: authData.user.id,
      observations: observations.trim(),
      what_learned: whatLearned.trim() || null,
      worked: worked === "yes" ? true : worked === "no" ? false : null,
      share_public: sharePublic,
      status: "completed",
    });
    setSaving(false);
    if (error) { toast.error("Your experiment could not be saved. Please try again."); return; }
    toast.success(sharePublic ? "Experiment saved and shared with the community!" : "Experiment saved to your journal.");
    setShowLog(false);
    setObservations("");
    setWhatLearned("");
    handleCloseExperiment();
    await loadData();
  };

  const submitRequest = async () => {
    if (requestTitle.trim().length < 5) { toast.error("Please describe the experiment you want to try."); return; }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      toast.error("Sign in to request an experiment.");
      window.location.assign("/signin?redirect=" + encodeURIComponent("/science-lab"));
      return;
    }
    const { error } = await supabase.from("science_experiment_requests" as any).insert({
      user_id: authData.user.id, title: requestTitle.trim(), reason: requestReason.trim() || null,
    });
    if (error) { toast.error("Your request could not be submitted."); return; }
    toast.success("Thanks! Your experiment idea has been sent for review.");
    setRequestTitle("");
    setRequestReason("");
    setShowRequest(false);
  };

  const resetFilters = () => {
    setCategory("All");
    setDifficulty("All levels");
    setDuration("all");
    setSearch("");
  };

  const stepsDoneCount = useMemo(() => {
    if (!selected) return 0;
    return selected.steps.filter((_, idx) => checkedSteps[idx]).length;
  }, [selected, checkedSteps]);

  const materialsGatheredCount = useMemo(() => {
    if (!selected) return 0;
    return selected.materials.filter((_, idx) => checkedMaterials[idx]).length;
  }, [selected, checkedMaterials]);

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Science Lab | Hands-on Experiments | Sahadhyayi"
        description="Try safe, hands-on science experiments with household materials. Record what you observe, test hypotheses, and explore everyday science with the Sahadhyayi community."
        canonical="https://sahadhyayi.com/science-lab"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 p-6 sm:p-10 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-16 h-72 w-72 rounded-full border-[32px] border-emerald-500/10 blur-2xl" />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <FlaskConical className="mr-1.5 h-3.5 w-3.5" /> Hands-on Science Lab
              </Badge>
              <Badge variant="outline" className="text-xs">
                {experiments.length} Safe Kitchen Experiments
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Don't just read science. <span className="text-emerald-600 dark:text-emerald-400">Experience it.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Explore hands-on experiments using simple household materials. Test hypotheses, observe cause and effect in real time, and connect what you build with deep scientific principles.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={() => document.getElementById("experiment-discovery")?.scrollIntoView({ behavior: "smooth" })}>
                <Beaker className="mr-2 h-4 w-4" /> Explore experiments
              </Button>
              <Button asChild variant="outline">
                <Link to="/science-around-you">
                  <Sparkles className="mr-2 h-4 w-4 text-sky-600 dark:text-sky-400" />
                  Test with Explain Science Around You
                </Link>
              </Button>
              <Button variant="ghost" onClick={() => setShowRequest(true)}>
                Request an experiment
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Safe household materials</span>
              <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-sky-600" /> 10–40 min activities</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-amber-600" /> Community observation journal</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-purple-600" /> Connects to verified theory</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={activeTab === "discover" ? "default" : "ghost"} onClick={() => setActiveTab("discover")}>
              <Beaker className="mr-1.5 h-3.5 w-3.5" /> Discover Experiments ({experiments.length})
            </Button>
            <Button size="sm" variant={activeTab === "community" ? "default" : "ghost"} onClick={() => setActiveTab("community")}>
              <Users className="mr-1.5 h-3.5 w-3.5" /> Community Discoveries ({attempts.length})
            </Button>
            <Button size="sm" variant={activeTab === "mine" ? "default" : "ghost"} onClick={() => void loadMyAttempts()}>
              <BookOpen className="mr-1.5 h-3.5 w-3.5" /> My Experiment Journal
            </Button>
          </div>
          <Button asChild size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground">
            <Link to="/science-around-you">
              Explain Science Around You <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Discover Tab */}
        {activeTab === "discover" && (
          <section id="experiment-discovery" className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Find an experiment to try</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a topic, grab kitchen materials, and observe real physics, chemistry, biology, and engineering.
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search materials or topics..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Comprehensive Multi-Filter Bar */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" /> Filter by:
                </div>
                {(category !== "All" || difficulty !== "All levels" || duration !== "all" || search) && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={resetFilters}>
                    <RotateCcw className="mr-1 h-3 w-3" /> Reset all filters
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium mr-1">Category:</span>
                {CATEGORIES.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={category === item ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>

              {/* Difficulty & Duration Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium mr-1">Difficulty:</span>
                  {DIFFICULTIES.map((item) => (
                    <Button
                      key={item}
                      size="sm"
                      variant={difficulty === item ? "secondary" : "ghost"}
                      className={`h-7 text-xs ${difficulty === item ? "font-semibold shadow-xs" : ""}`}
                      onClick={() => setDifficulty(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium mr-1">Duration:</span>
                  {DURATIONS.map((item) => (
                    <Button
                      key={item.value}
                      size="sm"
                      variant={duration === item.value ? "secondary" : "ghost"}
                      className={`h-7 text-xs ${duration === item.value ? "font-semibold shadow-xs" : ""}`}
                      onClick={() => setDuration(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results count pill */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Showing <strong>{filteredExperiments.length}</strong> of {experiments.length} experiments</span>
              {category !== "All" && <span>Category: {category}</span>}
            </div>

            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && filteredExperiments.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-14 text-center">
                  <FlaskConical className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                  <p className="text-base font-medium">No experiments match your filters</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try clearing your search query or broadening the difficulty filters.</p>
                  <Button className="mt-4" variant="outline" onClick={resetFilters}>
                    Clear all filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Experiment Cards Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExperiments.map((experiment) => {
                const visual = categoryVisuals[experiment.category] || {
                  bg: "from-emerald-500/10 via-cyan-500/10 to-background",
                  text: "text-emerald-600/70 dark:text-emerald-400/70",
                };
                return (
                  <Card
                    key={experiment.id}
                    className="group flex h-full flex-col overflow-hidden border-border/80 transition-all hover:border-emerald-500/40 hover:shadow-lg"
                  >
                    <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${visual.bg}`}>
                      <FlaskConical className={`h-14 w-14 transition-transform group-hover:scale-110 ${visual.text}`} />
                      <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-background/90 backdrop-blur shadow-2xs">
                        {experiment.category}
                      </span>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className={"rounded-full border px-2 py-0.5 text-xs font-medium " + (difficultyTone[experiment.difficulty] || "")}>
                          {experiment.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="h-3 w-3" /> {experiment.duration_minutes} min
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {experiment.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs leading-5">
                        {experiment.summary}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="mt-auto space-y-3 pt-2">
                      <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground leading-5">
                        <strong className="text-foreground font-medium">Materials: </strong>
                        {experiment.materials.slice(0, 3).join(", ")}
                        {experiment.materials.length > 3 && ` +${experiment.materials.length - 3} more`}
                      </div>

                      <Button
                        className="w-full gap-1.5"
                        variant="outline"
                        onClick={() => handleOpenExperiment(experiment)}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        View experiment & steps
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Community & My Journal Tabs */}
        {activeTab !== "discover" && (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {activeTab === "community" ? "What the community observed" : "Your personal experiment journal"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeTab === "community"
                  ? "Real results, unexpected quirks, and discoveries shared by fellow Sahadhyayi readers."
                  : "Keep a permanent private log of every hands-on experiment you try."}
              </p>
            </div>

            {attempts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FlaskConical className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                  <p className="text-base font-semibold">No experiment notes recorded yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try an experiment at home, observe what happens, and record your findings here.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("discover")}>
                    <Beaker className="mr-2 h-4 w-4" /> Discover experiments to try
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {attempts.map((attempt) => (
                  <Card key={attempt.id} className="overflow-hidden border-border/80">
                    <CardHeader className="pb-2 bg-muted/20">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary">{attempt.experiment?.category || "Science"}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(attempt.created_at).toLocaleDateString()}</span>
                      </div>
                      <CardTitle className="text-base font-semibold">{attempt.experiment?.title || "Science experiment"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observations</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{attempt.observations}</p>
                      </div>
                      {attempt.what_learned && (
                        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Key Takeaway</p>
                          <p className="mt-0.5 text-xs text-foreground/90 leading-5">{attempt.what_learned}</p>
                        </div>
                      )}
                      {attempt.worked !== null && (
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {attempt.worked ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span className="text-emerald-700 dark:text-emerald-300">The experiment worked as expected</span>
                            </>
                          ) : (
                            <>
                              <Lightbulb className="h-4 w-4 text-amber-600" />
                              <span className="text-amber-700 dark:text-amber-300">Observed a different / unexpected outcome (Great science!)</span>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Cross-Link Banner: Connect Practice to Theory */}
        <div className="mt-12 rounded-3xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-background to-teal-500/10 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Theory + Practice
              </Badge>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Want to test your conceptual scientific understanding?
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                In addition to hands-on experiments, try our <strong>Explain Science Around You</strong> assessment. Explain 10 everyday phenomena in your own words and receive AI feedback on accuracy, reasoning, and key concepts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button asChild size="lg" className="bg-sky-600 hover:bg-sky-700 text-white">
                <Link to="/science-around-you">
                  Explain Science Around You <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setShowRequest(true)}>
                Suggest an experiment idea
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Experiment Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="experiment-title"
        >
          <div className="mx-auto my-4 max-w-3xl rounded-3xl border border-border bg-background shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3.5 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{selected.category}</Badge>
                <span className={"rounded-full border px-2 py-0.5 text-xs font-medium " + (difficultyTone[selected.difficulty] || "")}>
                  {selected.difficulty}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
                  <Clock3 className="h-3.5 w-3.5" /> {selected.duration_minutes} min
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => window.print()}
                  title="Print experiment guide"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Close experiment"
                  onClick={handleCloseExperiment}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-8">
              {/* Title & Intro */}
              <div>
                <h2 id="experiment-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {selected.title}
                </h2>
                <p className="mt-2 text-base text-muted-foreground leading-7">{selected.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  <strong>Guidance:</strong> {selected.age_guidance}
                </p>
              </div>

              {/* Built-in Experiment Stopwatch / Timer */}
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-primary" /> Experiment Timer
                    </p>
                    <p className="text-2xl font-bold tracking-tight tabular-nums mt-0.5">
                      {formatTimer(timerSeconds)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={timerRunning ? "secondary" : "default"}
                      onClick={() => setTimerRunning((running) => !running)}
                      className="gap-1.5 text-xs"
                    >
                      {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {timerRunning ? "Pause" : "Start timer"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}
                      className="text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTimerSeconds((sec) => sec + 60)}
                      className="text-xs"
                    >
                      +1m
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTimerSeconds((sec) => sec + 300)}
                      className="text-xs"
                    >
                      +5m
                    </Button>
                  </div>
                </div>
              </div>

              {/* Materials Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-emerald-600" />
                    What you'll need ({materialsGatheredCount}/{selected.materials.length} gathered)
                  </h3>
                  <span className="text-xs text-muted-foreground">Click to check off</span>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {selected.materials.map((material, idx) => {
                    const isChecked = Boolean(checkedMaterials[idx]);
                    return (
                      <li
                        key={material}
                        onClick={() => setCheckedMaterials((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors ${
                          isChecked ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200" : "border-border/70 hover:bg-muted/50"
                        }`}
                      >
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 transition-colors ${isChecked ? "text-emerald-600" : "text-muted-foreground/50"}`}
                        />
                        <span className={isChecked ? "line-through opacity-80" : ""}>{material}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Interactive Step-by-Step Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">
                    Step-by-step instructions ({stepsDoneCount}/{selected.steps.length} done)
                  </h3>
                  <span className="text-xs text-muted-foreground">Check each step as you do it</span>
                </div>
                <Progress
                  value={selected.steps.length ? (stepsDoneCount / selected.steps.length) * 100 : 0}
                  className="mb-3.5 h-1.5"
                />
                <ol className="space-y-3">
                  {selected.steps.map((step, index) => {
                    const isDone = Boolean(checkedSteps[index]);
                    return (
                      <li
                        key={step}
                        onClick={() => setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }))}
                        className={`flex gap-3 rounded-2xl border p-3.5 text-sm leading-6 cursor-pointer transition-colors ${
                          isDone ? "border-emerald-500/40 bg-emerald-500/5 text-foreground" : "border-border/70 hover:bg-muted/40"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            isDone ? "bg-emerald-600 text-white" : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                        </span>
                        <span className={`pt-0.5 ${isDone ? "opacity-80" : ""}`}>{step}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Practical Tip */}
              {selected.practical_tip && (
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs text-sky-950 dark:text-sky-200">
                  <p className="font-semibold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5" /> Practical Tip for Best Results
                  </p>
                  <p className="mt-1 leading-5">{selected.practical_tip}</p>
                </div>
              )}

              {/* What's the Science Explanation */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-300">
                  <Lightbulb className="h-4 w-4 text-emerald-600" /> What's the science?
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">{selected.science_explanation}</p>

                {/* Cross-Link to Explain Science Around You assessment */}
                <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                    Test your verbal explanation of these principles in our learning assessment:
                  </span>
                  <Button asChild size="sm" variant="outline" className="border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs h-7">
                    <Link to="/science-around-you">
                      Explain Science Around You <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Variables to Test (Scientific Method Inquiry) */}
              {selected.variables_to_test && selected.variables_to_test.length > 0 && (
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-300 text-sm">
                    <HelpCircle className="h-4 w-4 text-purple-600" /> Try changing variables: "What if you...?"
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Real scientists test hypotheses by changing one variable at a time. Try these variations:
                  </p>
                  <ul className="space-y-1.5 pl-4 text-xs leading-5 text-muted-foreground">
                    {selected.variables_to_test.map((v, i) => (
                      <li key={i} className="list-disc">{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety First */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300 text-sm">
                  <ShieldCheck className="h-4 w-4 text-amber-600" /> Safety first
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                  {selected.safety_notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              {/* Observation Logger / Journal */}
              {!showLog ? (
                <Button className="w-full gap-2 py-6 text-sm" onClick={() => void startLogging()}>
                  <Beaker className="h-4 w-4" /> I've tried this — record my observations
                </Button>
              ) : (
                <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" /> Record your experiment results
                  </h3>

                  <div>
                    <label className="mb-2 block text-sm font-medium" htmlFor="science-observations">
                      What did you observe? *
                    </label>
                    <Textarea
                      id="science-observations"
                      value={observations}
                      onChange={(event) => setObservations(event.target.value.slice(0, 3000))}
                      placeholder="Describe what happened step-by-step. Include anything unexpected or surprising..."
                      rows={4}
                      maxLength={3000}
                    />
                    <p className="mt-1 text-right text-xs text-muted-foreground">{observations.length}/3000</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium" htmlFor="science-learning">
                      What did this help you understand? (optional)
                    </label>
                    <Textarea
                      id="science-learning"
                      value={whatLearned}
                      onChange={(event) => setWhatLearned(event.target.value.slice(0, 1500))}
                      placeholder="What scientific principle did this demonstrate in real life?"
                      rows={3}
                      maxLength={1500}
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-medium">Did it work as expected?</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "yes", label: "Yes, as expected" },
                        { value: "no", label: "No / Different result (Curious!)" },
                        { value: "unsure", label: "Not sure" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          size="sm"
                          type="button"
                          variant={worked === option.value ? "default" : "outline"}
                          onClick={() => setWorked(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={sharePublic}
                      onChange={(event) => setSharePublic(event.target.checked)}
                      className="mt-0.5 rounded"
                    />
                    <span>
                      Share my observations with the Sahadhyayi community. If unchecked, keep this entry private in my journal.
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={saving} onClick={() => void submitAttempt()}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Save experiment to journal
                    </Button>
                    <Button variant="ghost" onClick={() => setShowLog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Experiment Modal */}
      {showRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-experiment-title"
        >
          <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="request-experiment-title" className="text-xl font-bold">
                Suggest an experiment
              </h2>
              <Button size="icon" variant="ghost" aria-label="Close request form" onClick={() => setShowRequest(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Have a hands-on activity or phenomenon you'd like to investigate? Suggest it for our science team to test and design safety guidelines for.
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="request-title" className="mb-1.5 block text-sm font-medium">
                  What would you like to investigate? *
                </label>
                <Input
                  id="request-title"
                  value={requestTitle}
                  onChange={(event) => setRequestTitle(event.target.value)}
                  placeholder="e.g. Build an electric lemon battery"
                  maxLength={160}
                />
              </div>
              <div>
                <label htmlFor="request-reason" className="mb-1.5 block text-sm font-medium">
                  What are you curious about? (optional)
                </label>
                <Textarea
                  id="request-reason"
                  value={requestReason}
                  onChange={(event) => setRequestReason(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe the scientific question you want this experiment to answer."
                />
              </div>
              <Button className="w-full" onClick={() => void submitRequest()}>
                <Send className="mr-2 h-4 w-4" />
                Submit experiment suggestion
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
