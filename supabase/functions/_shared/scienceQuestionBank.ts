import {
  SCIENCE_PROMPTS,
  SCIENCE_QUESTION_SET_VERSION,
  type SciencePrompt,
} from "./sciencePrompts.ts";

export { SCIENCE_QUESTION_SET_VERSION };

export type ServerScienceQuestion = SciencePrompt & {
  referenceAnswer: string;
  keyConcepts: string[];
  correctExplanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};

type PrivateScienceRubric = Pick<
  ServerScienceQuestion,
  "referenceAnswer" | "keyConcepts" | "correctExplanation"
>;

/**
 * Correct answers and evaluation concepts stay on the server. The public
 * prompts are shared with the frontend so wording can never drift between
 * what a learner sees and what Gemini evaluates.
 */
const PRIVATE_SCIENCE_RUBRICS: Record<string, PrivateScienceRubric> = {
  "fan-cooling": {
    referenceAnswer: "A fan circulates air across the skin. The moving air increases convective heat transfer from the body and helps sweat evaporate faster. Both processes can increase heat loss and make a person feel cooler. A normal ceiling fan does not cool the room air; its motor actually adds a small amount of heat.",
    keyConcepts: ["does not substantially lower room air temperature", "increases air movement over skin", "increases convective heat loss", "helps sweat evaporate", "evaporation removes heat"],
    correctExplanation: "A ceiling fan makes you feel cooler by moving air across your skin. That airflow increases heat transfer from your body and helps sweat evaporate, which removes heat. The fan does not normally lower the room's air temperature; its motor adds a little heat.",
  },
  "air-conditioner": {
    referenceAnswer: "In the evaporator, low-pressure refrigerant absorbs heat from indoor air as it evaporates. The compressor raises the refrigerant's pressure and temperature. In the outdoor condenser, the refrigerant releases the absorbed indoor heat plus heat associated with compressor work to outside air. An expansion device lowers pressure before the cycle repeats.",
    keyConcepts: ["refrigerant absorbs indoor heat in evaporator", "compressor raises pressure and temperature", "condenser releases heat outdoors", "outdoor heat includes compressor work", "expansion device lowers pressure"],
    correctExplanation: "An air conditioner is a heat-moving system. Refrigerant absorbs heat at the indoor evaporator, the compressor raises its pressure, and the outdoor condenser releases that heat—plus energy added by the compressor—to the outside air. An expansion device then lowers the refrigerant pressure so the cycle can repeat.",
  },
  "bus-braking": {
    referenceAnswer: "This is an example of inertia, described by Newton's first law. When the bus slows, a passenger's body tends to keep moving at its previous velocity. The feet or seat are slowed by contact with the bus, while the upper body may continue forward briefly, making the passenger lean forward.",
    keyConcepts: ["inertia", "Newton's first law", "body tends to maintain its motion", "bus slows before the passenger's body fully slows", "contact force from bus changes motion"],
    correctExplanation: "Your body has inertia: it tends to keep moving at the speed it had just before the bus braked. The bus and your feet slow first, while the upper part of your body keeps moving forward briefly. That is why you lean forward.",
  },
  "pressure-cooker": {
    referenceAnswer: "The sealed cooker allows steam pressure to rise above atmospheric pressure. Higher pressure raises water's boiling temperature, so the hot water and steam can be hotter than in an open pot at the same altitude. The higher cooking temperature speeds up many chemical and physical processes in food. A pressure regulator or safety valve controls excess pressure.",
    keyConcepts: ["pressure rises in sealed vessel", "boiling point rises with pressure", "water and steam reach a higher temperature", "higher temperature speeds cooking", "safety valve/regulator controls pressure"],
    correctExplanation: "Pressure builds inside a sealed pressure cooker. That higher pressure raises water's boiling point, allowing the water and steam to become hotter than they would in an open pot. The higher temperature speeds up the processes that soften and cook food. The regulator and safety valve help control pressure.",
  },
  "refrigerator": {
    referenceAnswer: "A refrigerator uses a refrigeration cycle to move heat from its insulated cabinet to the surrounding room. Refrigerant absorbs heat as it evaporates in the indoor evaporator, the compressor raises its pressure, and the condenser releases heat to the room. The compressor uses electrical energy, so the heat released to the room is greater than the heat removed from the cabinet.",
    keyConcepts: ["moves heat rather than creating cold", "evaporator absorbs heat inside", "compressor uses electrical energy", "condenser releases heat to room", "released heat includes compressor work"],
    correctExplanation: "A refrigerator pumps heat from its insulated interior into the room. Refrigerant absorbs heat in the evaporator, the compressor uses electrical energy to move it around the cycle, and the condenser releases the heat at the back or underneath the appliance. The room receives the removed heat plus the compressor's input energy.",
  },
  "airplane-lift": {
    referenceAnswer: "A wing generates lift through the pressure distribution around it and by turning the airflow downward. Wing shape, angle of attack, speed and the surrounding airflow all matter. The airfoil and its angle of attack create a pressure difference, while the wing deflects air downward; the resulting aerodynamic force includes an upward lift component. The simplified equal-transit-time explanation is not a valid general explanation.",
    keyConcepts: ["airfoil shape and angle of attack", "pressure distribution around the wing", "airflow is deflected downward", "lift depends on speed and airflow", "avoid equal-transit-time myth"],
    correctExplanation: "A wing produces lift through the pressure forces created by the airflow around it and by turning air downward. Its shape, angle of attack and speed all matter. The wing pushes air downward, and the air exerts an upward force on the wing. The common claim that air over and under the wing must meet at the trailing edge at the same time is a misconception.",
  },
  "microwave-oven": {
    referenceAnswer: "A microwave oven produces electromagnetic waves, commonly around 2.45 GHz, that cause dielectric heating in materials containing polar molecules and ions, especially water. The alternating electric field makes these molecules respond and energy is dissipated as heat. Metal reflects microwaves; sharp edges or thin metal can concentrate electric fields and cause arcing. Some metal is intentionally used in microwave designs, so the advice is to follow the appliance manual rather than assume every metal shape behaves identically.",
    keyConcepts: ["microwaves are electromagnetic waves", "dielectric heating", "polar molecules/ions respond to alternating field", "metal reflects microwaves", "arcing can occur at sharp edges", "follow the appliance manual"],
    correctExplanation: "Microwaves create an alternating electric field that makes polar molecules and ions in food respond, producing heat through dielectric heating. Metal reflects microwaves, and sharp edges or thin pieces can concentrate electric fields and cause sparks. Some appliances use designed metal components, so always follow the oven manufacturer's instructions.",
  },
  "cold-glass": {
    referenceAnswer: "Water vapour already present in the surrounding air cools when it touches the cold glass. If the nearby air is cooled below its dew point, some vapour condenses into liquid droplets on the outside surface. The water is not leaking through the glass.",
    keyConcepts: ["water vapour is in surrounding air", "air near glass cools", "temperature falls below dew point", "vapour condenses to liquid droplets", "water does not pass through the glass"],
    correctExplanation: "The droplets come from water vapour in the surrounding air. Air next to the cold glass cools; when it reaches a temperature below its dew point, some of the vapour condenses into liquid water on the outside surface. The glass is not leaking.",
  },
  "iron-rusting": {
    referenceAnswer: "Rusting is an electrochemical corrosion process in which iron is oxidized in the presence of oxygen and water. A thin film of water acts as an electrolyte that allows electrochemical reactions to proceed. Dissolved salts increase conductivity and often accelerate corrosion. The product is hydrated iron oxides/oxyhydroxides commonly called rust.",
    keyConcepts: ["iron is oxidized", "oxygen is involved", "water enables electrochemical reaction", "water film acts as electrolyte", "salts can accelerate corrosion"],
    correctExplanation: "Rust forms when iron corrodes in the presence of oxygen and water. A thin film of water helps electrochemical reactions occur on the metal surface. Salt dissolved in that water can make the process faster. The reddish-brown material is a mixture of hydrated iron oxides and oxyhydroxides.",
  },
  "seasons": {
    referenceAnswer: "Earth's rotational axis is tilted about 23.5 degrees relative to the plane of its orbit. As Earth orbits the Sun, each hemisphere alternately tilts toward or away from the Sun. This changes the angle at which sunlight arrives and the length of daylight, changing the energy received per unit area and producing seasons. The hemispheres have opposite seasons; Earth's distance from the Sun is not the main cause.",
    keyConcepts: ["Earth's axis is tilted about 23.5 degrees", "hemisphere tilts toward/away from Sun during orbit", "sunlight angle changes", "day length changes", "hemispheres have opposite seasons", "distance is not the primary cause"],
    correctExplanation: "Earth's axis is tilted about 23.5 degrees. As Earth travels around the Sun, each hemisphere takes a turn leaning toward the Sun, receiving more direct sunlight and longer days, then leaning away and receiving less direct sunlight and shorter days. That change in sunlight angle and day length causes the seasons—not Earth's changing distance from the Sun.",
  },
  "rainbow-formation": {
    referenceAnswer: "Sunlight entering a water droplet is refracted and dispersed into colours because different wavelengths bend by different amounts. Light reflects internally and is refracted again as it exits. Many droplets send different colours toward the observer, producing the arc.",
    keyConcepts: ["refraction at droplet surface","dispersion separates wavelengths","internal reflection","second refraction on exit","many droplets contribute"],
    correctExplanation: "Sunlight entering a water droplet is refracted and dispersed into colours because different wavelengths bend by different amounts. Light reflects internally and is refracted again as it exits. Many droplets send different colours toward the observer, producing the arc.",
  },
  "echo-formation": {
    referenceAnswer: "An echo is reflected sound arriving after enough delay to be perceived separately. A distant wall or cliff provides a longer path difference; soft furnishings absorb sound and irregular surfaces scatter it, reducing a distinct reflection.",
    keyConcepts: ["sound reflection","sufficient time delay and distance","soft furnishings absorb sound","irregular surfaces scatter sound"],
    correctExplanation: "An echo is reflected sound arriving after enough delay to be perceived separately. A distant wall or cliff provides a longer path difference; soft furnishings absorb sound and irregular surfaces scatter it, reducing a distinct reflection.",
  },
  "solar-panel-current": {
    referenceAnswer: "Photons absorbed in a semiconductor can create electron-hole pairs. The built-in electric field at a p-n junction separates charge carriers, producing a voltage and current through an external circuit. Shading, orientation, irradiance and temperature affect output.",
    keyConcepts: ["photons absorbed by semiconductor","electron-hole pairs","p-n junction electric field separates charge","external circuit current","irradiance orientation shade and temperature"],
    correctExplanation: "Photons absorbed in a semiconductor can create electron-hole pairs. The built-in electric field at a p-n junction separates charge carriers, producing a voltage and current through an external circuit. Shading, orientation, irradiance and temperature affect output.",
  },
  "soap-cleaning": {
    referenceAnswer: "Soap molecules are amphiphilic: their nonpolar tails associate with oils while their charged or polar heads interact with water. They form micelles or emulsified droplets that can be suspended and rinsed away.",
    keyConcepts: ["amphiphilic molecule","hydrophobic tail associates with grease","hydrophilic head interacts with water","micelles or emulsification","rinsing removes suspended oil"],
    correctExplanation: "Soap molecules are amphiphilic: their nonpolar tails associate with oils while their charged or polar heads interact with water. They form micelles or emulsified droplets that can be suspended and rinsed away.",
  },
  "coastal-breeze": {
    referenceAnswer: "Land usually heats faster than the sea during daytime. Warmer air over land expands and rises, lowering surface pressure; cooler, denser air from over the sea flows inland to replace it, with a return flow aloft.",
    keyConcepts: ["land heats faster than water","warm air rises over land","surface pressure gradient","cooler marine air flows inland","circulation has return flow aloft"],
    correctExplanation: "Land usually heats faster than the sea during daytime. Warmer air over land expands and rises, lowering surface pressure; cooler, denser air from over the sea flows inland to replace it, with a return flow aloft.",
  },
  "bicycle-gears": {
    referenceAnswer: "Gears change the ratio between crank rotation and wheel rotation. A lower gear gives greater wheel torque for a given rider torque but requires more pedal rotations per distance; a higher gear increases distance per pedal turn but demands more torque.",
    keyConcepts: ["gear ratio changes torque and angular speed","lower gear increases wheel torque","lower gear needs more pedal turns per distance","higher gear increases distance per pedal turn","mechanical trade-off"],
    correctExplanation: "Gears change the ratio between crank rotation and wheel rotation. A lower gear gives greater wheel torque for a given rider torque but requires more pedal rotations per distance; a higher gear increases distance per pedal turn but demands more torque.",
  },
  "floating-ship": {
    referenceAnswer: "A floating object displaces water whose weight balances the object's weight. A hollow ship encloses a large volume, making its average density (including air inside) lower than water; the hull displaces enough water before the ship is fully submerged.",
    keyConcepts: ["Archimedes principle","buoyant force equals weight of displaced fluid","ship displaces large water volume","average density includes enclosed air","nail displaces too little water before sinking"],
    correctExplanation: "A floating object displaces water whose weight balances the object's weight. A hollow ship encloses a large volume, making its average density (including air inside) lower than water; the hull displaces enough water before the ship is fully submerged.",
  },
  "battery-energy": {
    referenceAnswer: "A rechargeable cell uses reversible electrochemical reactions. During discharge, oxidation at one electrode releases electrons to the external circuit while reduction consumes them at the other; charging applies external electrical work to drive the reactions in reverse.",
    keyConcepts: ["reversible redox reactions","oxidation and electron release at anode during discharge","reduction at cathode","ions move through electrolyte","charger drives reverse reaction using energy"],
    correctExplanation: "A rechargeable cell uses reversible electrochemical reactions. During discharge, oxidation at one electrode releases electrons to the external circuit while reduction consumes them at the other; charging applies external electrical work to drive the reactions in reverse.",
  },
  "water-filter": {
    referenceAnswer: "A filter medium can physically trap particles by size exclusion. Activated carbon can adsorb some dissolved organic compounds and reduce taste or odour; other technologies such as ion exchange or membranes target different contaminants. Effectiveness depends on design and maintenance.",
    keyConcepts: ["physical particle filtration","activated carbon adsorption","different media target different contaminants","not all filters remove microbes or dissolved chemicals","maintenance and certification matter"],
    correctExplanation: "A filter medium can physically trap particles by size exclusion. Activated carbon can adsorb some dissolved organic compounds and reduce taste or odour; other technologies such as ion exchange or membranes target different contaminants. Effectiveness depends on design and maintenance.",
  },
  "moon-phases": {
    referenceAnswer: "Half the Moon is illuminated by the Sun at any time. As the Moon orbits Earth, the fraction of its sunlit half visible from Earth changes, producing phases. The phases are not normally caused by Earth's shadow; that alignment causes lunar eclipses.",
    keyConcepts: ["Sun illuminates half the Moon","Moon orbits Earth","visible fraction of lit hemisphere changes","phases are not Earth's shadow","lunar eclipse is a different alignment"],
    correctExplanation: "Half the Moon is illuminated by the Sun at any time. As the Moon orbits Earth, the fraction of its sunlit half visible from Earth changes, producing phases. The phases are not normally caused by Earth's shadow; that alignment causes lunar eclipses.",
  },
  "heat-pump-efficiency": {
    referenceAnswer: "A heat pump moves thermal energy from a colder source to a warmer sink by using work to drive a refrigerant cycle. The delivered heat equals heat extracted outdoors plus compressor work, so the heating coefficient of performance can exceed one without violating energy conservation. Efficiency falls as the temperature lift grows.",
    keyConcepts: ["moves heat rather than creates it","refrigerant evaporates at low temperature and condenses at higher temperature","compressor work drives cycle","delivered heat equals extracted heat plus work","COP can exceed one; larger temperature lift reduces performance"],
    correctExplanation: "A heat pump moves thermal energy from a colder source to a warmer sink by using work to drive a refrigerant cycle. The delivered heat equals heat extracted outdoors plus compressor work, so the heating coefficient of performance can exceed one without violating energy conservation. Efficiency falls as the temperature lift grows.",
  },
  "sonic-boom": {
    referenceAnswer: "An aircraft generates pressure disturbances that propagate at the speed of sound. At supersonic speed, disturbances cannot propagate ahead and their wavefronts form a Mach cone; the shock pressure change sweeps over observers along the ground track, heard as a boom. The aircraft does not create a single explosion at Mach 1.",
    keyConcepts: ["pressure disturbances travel at sound speed","supersonic motion forms Mach cone","shock wave pressure change","boom heard as shock passes observer","not a one-time explosion at Mach 1"],
    correctExplanation: "An aircraft generates pressure disturbances that propagate at the speed of sound. At supersonic speed, disturbances cannot propagate ahead and their wavefronts form a Mach cone; the shock pressure change sweeps over observers along the ground track, heard as a boom. The aircraft does not create a single explosion at Mach 1.",
  },
  "catalytic-converter": {
    referenceAnswer: "A three-way catalyst uses platinum-group metal surfaces to accelerate reactions that oxidize carbon monoxide and unburned hydrocarbons while reducing nitrogen oxides to nitrogen. Near-stoichiometric air-fuel control supports simultaneous oxidation and reduction.",
    keyConcepts: ["catalyst surface lowers activation barrier","oxidation of CO and hydrocarbons","reduction of NOx to nitrogen","platinum-group catalysts","near-stoichiometric air-fuel ratio"],
    correctExplanation: "A three-way catalyst uses platinum-group metal surfaces to accelerate reactions that oxidize carbon monoxide and unburned hydrocarbons while reducing nitrogen oxides to nitrogen. Near-stoichiometric air-fuel control supports simultaneous oxidation and reduction.",
  },
  "greenhouse-effect": {
    referenceAnswer: "Earth absorbs much incoming shortwave solar radiation and emits energy as infrared radiation. Greenhouse gases absorb and re-emit infrared in all directions, reducing the rate at which energy escapes to space from the surface-troposphere system until a warmer equilibrium is reached. This is not simply heat trapped by a solid glass barrier.",
    keyConcepts: ["shortwave solar radiation mostly passes through atmosphere","Earth emits infrared radiation","greenhouse gases absorb and re-emit infrared","reduces outgoing energy at a given temperature","warming to energy-balance equilibrium"],
    correctExplanation: "Earth absorbs much incoming shortwave solar radiation and emits energy as infrared radiation. Greenhouse gases absorb and re-emit infrared in all directions, reducing the rate at which energy escapes to space from the surface-troposphere system until a warmer equilibrium is reached. This is not simply heat trapped by a solid glass barrier.",
  },
  "induction-cooktop": {
    referenceAnswer: "An alternating current in a coil creates a changing magnetic field that induces eddy currents in a compatible pan. Electrical resistance in the pan converts these currents into heat; magnetic hysteresis can also contribute in ferromagnetic materials. Coupling depends on pan material, geometry and position.",
    keyConcepts: ["alternating coil current creates changing magnetic field","electromagnetic induction and eddy currents","resistive heating in pan","ferromagnetic hysteresis may contribute","pan compatibility and coupling"],
    correctExplanation: "An alternating current in a coil creates a changing magnetic field that induces eddy currents in a compatible pan. Electrical resistance in the pan converts these currents into heat; magnetic hysteresis can also contribute in ferromagnetic materials. Coupling depends on pan material, geometry and position.",
  },
  "bridge-resonance": {
    referenceAnswer: "A structure has natural modes and frequencies. Periodic forcing near a mode can produce large response if energy input exceeds damping. Modern bridges are designed and monitored for dynamic loads; failures involve structural, aerodynamic, fatigue and control factors, not merely people marching in step.",
    keyConcepts: ["natural modes and frequencies","periodic forcing near natural frequency","energy input versus damping","aerodynamic and structural coupling","failure is multi-factorial"],
    correctExplanation: "A structure has natural modes and frequencies. Periodic forcing near a mode can produce large response if energy input exceeds damping. Modern bridges are designed and monitored for dynamic loads; failures involve structural, aerodynamic, fatigue and control factors, not merely people marching in step.",
  },
  "electrolysis": {
    referenceAnswer: "Electrical energy drives non-spontaneous redox reactions. At the cathode, reduction produces hydrogen; at the anode, oxidation produces oxygen. The balanced overall reaction is 2H2O to 2H2 plus O2, so hydrogen and oxygen form in a 2:1 mole and ideal gas volume ratio at equal temperature and pressure.",
    keyConcepts: ["requires external electrical energy","cathode reduction produces hydrogen","anode oxidation produces oxygen","balanced reaction 2 water to 2 hydrogen plus oxygen","2:1 gas volume ratio"],
    correctExplanation: "Electrical energy drives non-spontaneous redox reactions. At the cathode, reduction produces hydrogen; at the anode, oxidation produces oxygen. The balanced overall reaction is 2H2O to 2H2 plus O2, so hydrogen and oxygen form in a 2:1 mole and ideal gas volume ratio at equal temperature and pressure.",
  },
  "urban-heat-island": {
    referenceAnswer: "Urban materials often absorb and store solar energy and release it slowly at night. Reduced vegetation lowers evaporative cooling; street canyons alter longwave radiation and airflow; dark surfaces lower albedo; buildings, vehicles and air conditioning add waste heat. Relative importance varies by city and weather.",
    keyConcepts: ["surface albedo and absorbed solar energy","thermal storage and night-time release","reduced evapotranspiration","urban geometry changes radiation and ventilation","anthropogenic waste heat"],
    correctExplanation: "Urban materials often absorb and store solar energy and release it slowly at night. Reduced vegetation lowers evaporative cooling; street canyons alter longwave radiation and airflow; dark surfaces lower albedo; buildings, vehicles and air conditioning add waste heat. Relative importance varies by city and weather.",
  },
  "regenerative-braking": {
    referenceAnswer: "During deceleration, traction motors operate as generators. Vehicle kinetic energy drives the motor, inducing electrical power that is sent to the battery or electrical storage. Conversion losses, battery state-of-charge, temperature, traction and low-speed limits mean friction brakes are still needed.",
    keyConcepts: ["motor acts as generator","kinetic energy converted to electrical energy","battery accepts limited charge power","conversion losses and operating constraints","friction brakes supplement regeneration"],
    correctExplanation: "During deceleration, traction motors operate as generators. Vehicle kinetic energy drives the motor, inducing electrical power that is sent to the battery or electrical storage. Conversion losses, battery state-of-charge, temperature, traction and low-speed limits mean friction brakes are still needed.",
  },
  "turbulent-flow": {
    referenceAnswer: "The Reynolds number compares inertial with viscous effects, commonly Re = rho v L / mu. At sufficiently high Reynolds number, disturbances can grow and create fluctuating eddies, but transition depends on geometry, surface roughness, inlet disturbances and flow conditions; no single critical speed applies universally.",
    keyConcepts: ["Reynolds number compares inertia and viscosity","velocity density length scale and viscosity","disturbances and eddies","geometry and boundary conditions matter","transition is not one universal speed"],
    correctExplanation: "The Reynolds number compares inertial with viscous effects, commonly Re = rho v L / mu. At sufficiently high Reynolds number, disturbances can grow and create fluctuating eddies, but transition depends on geometry, surface roughness, inlet disturbances and flow conditions; no single critical speed applies universally.",
  },
};

export const SERVER_SCIENCE_QUESTIONS: ServerScienceQuestion[] = SCIENCE_PROMPTS.map((prompt) => ({
  ...prompt,
  ...PRIVATE_SCIENCE_RUBRICS[prompt.id],
}));
