export type ServerScienceQuestion = {
  id: string;
  domain: string;
  prompt: string;
  referenceAnswer: string;
  keyConcepts: string[];
  correctExplanation: string;
};

export const SCIENCE_QUESTION_SET_VERSION = "everyday-science-v1";

/**
 * Canonical answers stay on the server. Never move this file into src/ or
 * return referenceAnswer/keyConcepts in the public question response.
 */
export const SERVER_SCIENCE_QUESTIONS: ServerScienceQuestion[] = [
  {
    id: "fan-cooling",
    domain: "Physics",
    prompt: "Why does a ceiling fan make us feel cooler even though it usually does not significantly lower the room's air temperature?",
    referenceAnswer: "A fan circulates air across the skin. The moving air increases convective heat transfer from the body and helps sweat evaporate faster. Both processes can increase heat loss and make a person feel cooler. A normal ceiling fan does not cool the room air; its motor actually adds a small amount of heat.",
    keyConcepts: ["does not substantially lower room air temperature", "increases air movement over skin", "increases convective heat loss", "helps sweat evaporate", "evaporation removes heat"],
    correctExplanation: "A ceiling fan makes you feel cooler by moving air across your skin. That airflow increases heat transfer from your body and helps sweat evaporate, which removes heat. The fan does not normally lower the room's air temperature; its motor adds a little heat.",
  },
  {
    id: "air-conditioner",
    domain: "Technology & engineering",
    prompt: "How does an air conditioner move heat out of a room, and why does its outdoor unit release warm air?",
    referenceAnswer: "In the evaporator, low-pressure refrigerant absorbs heat from indoor air as it evaporates. The compressor raises the refrigerant's pressure and temperature. In the outdoor condenser, the refrigerant releases the absorbed indoor heat plus heat associated with compressor work to outside air. An expansion device lowers pressure before the cycle repeats.",
    keyConcepts: ["refrigerant absorbs indoor heat in evaporator", "compressor raises pressure and temperature", "condenser releases heat outdoors", "outdoor heat includes compressor work", "expansion device lowers pressure"],
    correctExplanation: "An air conditioner is a heat-moving system. Refrigerant absorbs heat at the indoor evaporator, the compressor raises its pressure, and the outdoor condenser releases that heat—plus energy added by the compressor—to the outside air. An expansion device then lowers the refrigerant pressure so the cycle can repeat.",
  },
  {
    id: "bus-braking",
    domain: "Physics",
    prompt: "Why do passengers tend to lean or move forward when a moving bus brakes suddenly?",
    referenceAnswer: "This is an example of inertia, described by Newton's first law. When the bus slows, a passenger's body tends to keep moving at its previous velocity. The feet or seat are slowed by contact with the bus, while the upper body may continue forward briefly, making the passenger lean forward.",
    keyConcepts: ["inertia", "Newton's first law", "body tends to maintain its motion", "bus slows before the passenger's body fully slows", "contact force from bus changes motion"],
    correctExplanation: "Your body has inertia: it tends to keep moving at the speed it had just before the bus braked. The bus and your feet slow first, while the upper part of your body keeps moving forward briefly. That is why you lean forward.",
  },
  {
    id: "pressure-cooker",
    domain: "Chemistry",
    prompt: "Why does food generally cook faster in a pressure cooker than in an ordinary open pot of boiling water?",
    referenceAnswer: "The sealed cooker allows steam pressure to rise above atmospheric pressure. Higher pressure raises water's boiling temperature, so the hot water and steam can be hotter than in an open pot at the same altitude. The higher cooking temperature speeds up many chemical and physical processes in food. A pressure regulator or safety valve controls excess pressure.",
    keyConcepts: ["pressure rises in sealed vessel", "boiling point rises with pressure", "water and steam reach a higher temperature", "higher temperature speeds cooking", "safety valve/regulator controls pressure"],
    correctExplanation: "Pressure builds inside a sealed pressure cooker. That higher pressure raises water's boiling point, allowing the water and steam to become hotter than they would in an open pot. The higher temperature speeds up the processes that soften and cook food. The regulator and safety valve help control pressure.",
  },
  {
    id: "refrigerator",
    domain: "Technology & engineering",
    prompt: "A refrigerator does not create cold from nothing. Explain how it keeps the inside cool and where the removed heat goes.",
    referenceAnswer: "A refrigerator uses a refrigeration cycle to move heat from its insulated cabinet to the surrounding room. Refrigerant absorbs heat as it evaporates in the indoor evaporator, the compressor raises its pressure, and the condenser releases heat to the room. The compressor uses electrical energy, so the heat released to the room is greater than the heat removed from the cabinet.",
    keyConcepts: ["moves heat rather than creating cold", "evaporator absorbs heat inside", "compressor uses electrical energy", "condenser releases heat to room", "released heat includes compressor work"],
    correctExplanation: "A refrigerator pumps heat from its insulated interior into the room. Refrigerant absorbs heat in the evaporator, the compressor uses electrical energy to move it around the cycle, and the condenser releases the heat at the back or underneath the appliance. The room receives the removed heat plus the compressor's input energy.",
  },
  {
    id: "airplane-lift",
    domain: "Physics",
    prompt: "How does an airplane wing generate lift and help an aircraft stay in the air?",
    referenceAnswer: "A wing generates lift through the pressure distribution around it and by turning the airflow downward. Wing shape, angle of attack, speed and the surrounding airflow all matter. The airfoil and its angle of attack create a pressure difference, while the wing deflects air downward; the resulting aerodynamic force includes an upward lift component. The simplified equal-transit-time explanation is not a valid general explanation.",
    keyConcepts: ["airfoil shape and angle of attack", "pressure distribution around the wing", "airflow is deflected downward", "lift depends on speed and airflow", "avoid equal-transit-time myth"],
    correctExplanation: "A wing produces lift through the pressure forces created by the airflow around it and by turning air downward. Its shape, angle of attack and speed all matter. The wing pushes air downward, and the air exerts an upward force on the wing. The common claim that air over and under the wing must meet at the trailing edge at the same time is a misconception.",
  },
  {
    id: "microwave-oven",
    domain: "Technology & engineering",
    prompt: "How does a microwave oven heat food, and why can ordinary metal objects cause problems inside it?",
    referenceAnswer: "A microwave oven produces electromagnetic waves, commonly around 2.45 GHz, that cause dielectric heating in materials containing polar molecules and ions, especially water. The alternating electric field makes these molecules respond and energy is dissipated as heat. Metal reflects microwaves; sharp edges or thin metal can concentrate electric fields and cause arcing. Some metal is intentionally used in microwave designs, so the advice is to follow the appliance manual rather than assume every metal shape behaves identically.",
    keyConcepts: ["microwaves are electromagnetic waves", "dielectric heating", "polar molecules/ions respond to alternating field", "metal reflects microwaves", "arcing can occur at sharp edges", "follow the appliance manual"],
    correctExplanation: "Microwaves create an alternating electric field that makes polar molecules and ions in food respond, producing heat through dielectric heating. Metal reflects microwaves, and sharp edges or thin pieces can concentrate electric fields and cause sparks. Some appliances use designed metal components, so always follow the oven manufacturer's instructions.",
  },
  {
    id: "cold-glass",
    domain: "Earth & space science",
    prompt: "On a humid day, tiny water droplets appear on the outside of a cold glass. Where does that water come from?",
    referenceAnswer: "Water vapour already present in the surrounding air cools when it touches the cold glass. If the nearby air is cooled below its dew point, some vapour condenses into liquid droplets on the outside surface. The water is not leaking through the glass.",
    keyConcepts: ["water vapour is in surrounding air", "air near glass cools", "temperature falls below dew point", "vapour condenses to liquid droplets", "water does not pass through the glass"],
    correctExplanation: "The droplets come from water vapour in the surrounding air. Air next to the cold glass cools; when it reaches a temperature below its dew point, some of the vapour condenses into liquid water on the outside surface. The glass is not leaking.",
  },
  {
    id: "iron-rusting",
    domain: "Chemistry",
    prompt: "Why does an iron gate or bicycle chain tend to rust faster when it is exposed to damp air?",
    referenceAnswer: "Rusting is an electrochemical corrosion process in which iron is oxidized in the presence of oxygen and water. A thin film of water acts as an electrolyte that allows electrochemical reactions to proceed. Dissolved salts increase conductivity and often accelerate corrosion. The product is hydrated iron oxides/oxyhydroxides commonly called rust.",
    keyConcepts: ["iron is oxidized", "oxygen is involved", "water enables electrochemical reaction", "water film acts as electrolyte", "salts can accelerate corrosion"],
    correctExplanation: "Rust forms when iron corrodes in the presence of oxygen and water. A thin film of water helps electrochemical reactions occur on the metal surface. Salt dissolved in that water can make the process faster. The reddish-brown material is a mixture of hydrated iron oxides and oxyhydroxides.",
  },
  {
    id: "seasons",
    domain: "Earth & space science",
    prompt: "Why does Earth experience different seasons, and why are they mainly caused by Earth's axial tilt rather than its changing distance from the Sun?",
    referenceAnswer: "Earth's rotational axis is tilted about 23.5 degrees relative to the plane of its orbit. As Earth orbits the Sun, each hemisphere alternately tilts toward or away from the Sun. This changes the angle at which sunlight arrives and the length of daylight, changing the energy received per unit area and producing seasons. The hemispheres have opposite seasons; Earth's distance from the Sun is not the main cause.",
    keyConcepts: ["Earth's axis is tilted about 23.5 degrees", "hemisphere tilts toward/away from Sun during orbit", "sunlight angle changes", "day length changes", "hemispheres have opposite seasons", "distance is not the primary cause"],
    correctExplanation: "Earth's axis is tilted about 23.5 degrees. As Earth travels around the Sun, each hemisphere takes a turn leaning toward the Sun, receiving more direct sunlight and longer days, then leaning away and receiving less direct sunlight and shorter days. That change in sunlight angle and day length causes the seasons—not Earth's changing distance from the Sun.",
  },
];
