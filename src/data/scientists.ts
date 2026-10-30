export type ScientistRegion = 'india' | 'world';

export interface ScientistSource {
  label: string;
  url: string;
  publisher: string;
}

export interface ScientistPublication {
  title: string;
  year: string;
  venue: string;
  authors: string;
  doi?: string;
  url: string;
  access: 'publisher' | 'open' | 'catalogue';
  note: string;
}

export interface ScientistArchive {
  title: string;
  institution: string;
  url: string;
  material: string;
  note: string;
}

export interface ScientistMilestone {
  year: string;
  title: string;
  description: string;
}

export interface ScientistProfile {
  slug: string;
  name: string;
  initials: string;
  region: ScientistRegion;
  discipline: string;
  lifespan: string;
  headline: string;
  summary: string;
  birthplace: string;
  knownFor: string[];
  lifeStory: string[];
  work: { title: string; description: string }[];
  milestones: ScientistMilestone[];
  publications?: ScientistPublication[];
  archives?: ScientistArchive[];
  legacy: string;
  sources: ScientistSource[];
}

export const scientists: ScientistProfile[] = [
  {
    slug: 'amal-kumar-raychaudhuri',
    name: 'Amal Kumar Raychaudhuri',
    initials: 'AKR',
    region: 'india',
    discipline: 'Physics · Cosmology',
    lifespan: '1923–2005',
    headline: 'The equation that helped explain the shape and fate of the universe.',
    summary: 'An Indian theoretical physicist whose work on general relativity and cosmology became an important foundation for the study of spacetime singularities.',
    birthplace: 'Barisal, Bengal Presidency (now in Bangladesh)',
    knownFor: ['Raychaudhuri equation', 'General relativity', 'Relativistic cosmology'],
    lifeStory: [
      'Amal Kumar Raychaudhuri was born on 14 September 1923. He studied physics at the University of Calcutta and went on to become a respected teacher and researcher at Presidency College in Kolkata.',
      'His research focused on the mathematical structure of general relativity: how families of paths through spacetime converge or diverge under gravity. His work combined deep mathematical reasoning with questions about the large-scale structure of the universe.',
      'Raychaudhuri was also remembered as a dedicated teacher. His influence extended through generations of students who encountered the ideas of modern gravitational physics in his classroom.'
    ],
    work: [
      { title: 'The Raychaudhuri equation', description: 'A relation describing how the expansion of a family of nearby trajectories changes. In relativity, it helps physicists reason about gravitational focusing and the conditions under which spacetime singularities can arise.' },
      { title: 'Relativistic cosmology', description: 'His work supplied a key mathematical ingredient later used in the singularity theorems associated with Roger Penrose and Stephen Hawking.' }
    ],
    milestones: [
      { year: '1923', title: 'Born in Barisal', description: 'Born on 14 September in what was then the Bengal Presidency.' },
      { year: '1960', title: 'D.Sc. from Calcutta', description: 'Received a D.Sc. from the University of Calcutta.' },
      { year: '1987', title: 'Elected INSA Fellow', description: 'Elected a Fellow of the Indian National Science Academy.' },
      { year: '2005', title: 'A lasting scientific legacy', description: 'Died on 18 June; the equation bearing his name remains part of relativistic cosmology.' }
    ],
    legacy: 'The Raychaudhuri equation is now a standard tool in general relativity. Its importance is a reminder that a carefully developed mathematical idea can shape major advances far beyond the setting in which it was first introduced.',
    publications: [
      {
        title: 'Relativistic Cosmology. I',
        year: '1955',
        venue: 'Physical Review, 98(4), 1123–1126',
        authors: 'Amalkumar Raychaudhuri',
        doi: '10.1103/PhysRev.98.1123',
        url: 'https://journals.aps.org/pr/abstract/10.1103/PhysRev.98.1123',
        access: 'publisher',
        note: 'Original research paper introducing the cosmological analysis associated with Raychaudhuri. The publisher page provides the abstract and bibliographic record; full text may require access.'
      }
    ],
    archives: [
      {
        title: 'Deceased Fellow record: Professor A. K. Raychaudhuri',
        institution: 'Indian National Science Academy',
        url: 'https://insaindia.res.in/07062023_no.php?id=N87-0976',
        material: 'Institutional biographical record',
        note: 'An institutional record for biographical verification, not an original research manuscript.'
      }
    ],
    sources: [
      { label: 'Deceased Fellow: Professor A. K. Raychaudhuri', publisher: 'Indian National Science Academy', url: 'https://insaindia.res.in/07062023_no.php?id=N87-0976' },
      { label: 'Amal Kumar Raychaudhuri', publisher: 'India Science · Department of Science and Technology', url: 'https://indiascience.dst.gov.in/videos/amal-kumar-raychaudhuri-e-1' }
    ]
  },
  {
    slug: 'c-v-raman',
    name: 'C. V. Raman',
    initials: 'CVR',
    region: 'india',
    discipline: 'Physics · Optics',
    lifespan: '1888–1970',
    headline: 'The scientist who revealed a new way light interacts with matter.',
    summary: 'Chandrasekhara Venkata Raman was an Indian physicist whose discovery of the Raman Effect earned him the 1930 Nobel Prize in Physics.',
    birthplace: 'Tiruchirappalli, Tamil Nadu, India',
    knownFor: ['Raman Effect', 'Light scattering', 'Acoustics'],
    lifeStory: [
      'C. V. Raman was born on 7 November 1888 in Tiruchirappalli. He studied at Presidency College in Madras and began publishing scientific work while still young.',
      'After joining the Indian Finance Department in 1907, he continued research in his spare time at the Indian Association for the Cultivation of Science in Calcutta. In 1917 he moved into a full-time academic career at the University of Calcutta.',
      'On 28 February 1928, Raman and his collaborators observed a change in the wavelength of a small portion of light scattered by a substance. This discovery became known as the Raman Effect and opened a powerful new way to investigate the molecular composition of materials.'
    ],
    work: [
      { title: 'The Raman Effect', description: 'When light is scattered by a material, a small fraction of the scattered light changes frequency. The shift carries information about the material’s molecular structure and is widely used in spectroscopy.' },
      { title: 'Acoustics and musical instruments', description: 'Raman also made important experimental and theoretical studies of sound, vibrations and the acoustics of musical instruments.' }
    ],
    milestones: [
      { year: '1888', title: 'Born in Tiruchirappalli', description: 'Born on 7 November in southern India.' },
      { year: '1917', title: 'University of Calcutta', description: 'Accepted the Palit Chair of Physics and began a highly productive period of research.' },
      { year: '1928', title: 'Discovery of the Raman Effect', description: 'The discovery was made on 28 February, now observed in India as National Science Day.' },
      { year: '1930', title: 'Nobel Prize in Physics', description: 'Awarded the Nobel Prize for work on the scattering of light.' },
      { year: '1954', title: 'Bharat Ratna', description: 'Received India’s highest civilian award.' }
    ],
    legacy: 'Raman spectroscopy is used across chemistry, materials science, medicine and other fields. The discovery remains one of the most influential contributions to experimental physics made in India.',
    publications: [
      {
        title: 'A New Type of Secondary Radiation',
        year: '1928',
        venue: 'Nature, 121, 501–502',
        authors: 'C. V. Raman and K. S. Krishnan',
        doi: '10.1038/121501c0',
        url: 'https://www.nature.com/articles/121501c0',
        access: 'publisher',
        note: 'Contemporary 1928 communication reporting the modified-frequency component of scattered light; the Nature page provides the original article record.'
      },
      {
        title: 'A New Radiation',
        year: '1928',
        venue: 'Indian Journal of Physics, 2, 387–398',
        authors: 'C. V. Raman',
        url: 'https://repository.ias.ac.in/70648/',
        access: 'open',
        note: 'Repository record with a publisher-version PDF preview. Rights remain with the Indian Association for the Cultivation of Science.'
      },
      {
        title: 'A New Class of Spectra Due to Secondary Radiation. Part I',
        year: '1928',
        venue: 'Indian Journal of Physics, 2, 399–419',
        authors: 'C. V. Raman and K. S. Krishnan',
        url: 'https://repository.ias.ac.in/70550/',
        access: 'catalogue',
        note: 'Institutional repository catalogue record; the repository notes that full text is not available there.'
      }
    ],
    archives: [
      {
        title: 'Publications of C. V. Raman — 1928 records',
        institution: 'Indian Academy of Sciences Repository',
        url: 'https://repository.ias.ac.in/view/year/1928.html',
        material: 'Publication catalogue',
        note: 'A year-filtered institutional bibliography listing multiple 1928 papers by Raman and collaborators.'
      }
    ],
    sources: [
      { label: 'C. V. Raman — Biographical', publisher: 'Nobel Prize', url: 'https://www.nobelprize.org/prizes/physics/1930/raman/biographical/' },
      { label: 'The Raman Effect: International Historic Chemical Landmark', publisher: 'American Chemical Society', url: 'https://www.acs.org/education/whatischemistry/landmarks/ramaneffect.html' },
      { label: 'C. V. Raman — The Master of Light & Sound', publisher: 'New India Samachar · Government of India', url: 'https://newindiasamachar.pib.gov.in/archive/pdf/NIS%20English%20November16-30.pdf' }
    ]
  },
  {
    slug: 'satyendra-nath-bose',
    name: 'Satyendra Nath Bose',
    initials: 'SNB',
    region: 'india',
    discipline: 'Physics · Quantum Mechanics',
    lifespan: '1894–1974',
    headline: 'A new way of counting particles changed quantum physics.',
    summary: 'An Indian physicist whose work on quantum statistics, recognised and extended by Albert Einstein, gave rise to Bose–Einstein statistics and the name boson.',
    birthplace: 'Calcutta (now Kolkata), India',
    knownFor: ['Bose–Einstein statistics', 'Quantum mechanics', 'Bosons'],
    lifeStory: [
      'Satyendra Nath Bose was born in Calcutta on 1 January 1894. He studied at Presidency College and the University of Calcutta, where he developed a strong foundation in mathematics and physics.',
      'In 1924, while working on the derivation of Planck’s law, Bose developed a new statistical treatment of light quanta. He sent his paper to Albert Einstein, who recognised its significance and translated it into German for publication.',
      'Einstein extended the method to material particles. The resulting framework, Bose–Einstein statistics, became one of the foundations of quantum theory. Bose later taught and conducted research in India, including at the University of Dhaka and the University of Calcutta.'
    ],
    work: [
      { title: 'Bose statistics', description: 'Bose’s method treated identical light particles as indistinguishable, producing a new derivation of Planck’s radiation law. Einstein extended the approach to atoms and other particles.' },
      { title: 'Bosons', description: 'Particles that follow Bose–Einstein statistics are called bosons in his honour. The concept is central to quantum field theory and the behaviour of many-particle systems.' }
    ],
    milestones: [
      { year: '1894', title: 'Born in Calcutta', description: 'Born on 1 January in the city now known as Kolkata.' },
      { year: '1915', title: 'Master’s degree', description: 'Completed an M.Sc. in mixed mathematics at the University of Calcutta.' },
      { year: '1924', title: 'Quantum statistics paper', description: 'Sent his paper on Planck’s law to Albert Einstein, beginning a pivotal exchange.' },
      { year: '1974', title: 'Died in Kolkata', description: 'His name continues to be used across modern particle physics.' }
    ],
    legacy: 'The word “boson” carries Bose’s name throughout modern physics. Bose–Einstein statistics helps describe particles that can share the same quantum state and underpins research into phenomena such as Bose–Einstein condensation.',
    publications: [
      {
        title: 'Plancks Gesetz und Lichtquantenhypothese',
        year: '1924',
        venue: 'Zeitschrift für Physik, 26, 178–181',
        authors: 'S. N. Bose',
        doi: '10.1007/BF01327326',
        url: 'https://doi.org/10.1007/BF01327326',
        access: 'publisher',
        note: 'The original German-language journal publication of Bose’s derivation. The surviving manuscript sent to Einstein is described by historical sources as lost; this is the published paper, not that manuscript.'
      },
      {
        title: 'Collected Scientific Papers of S. N. Bose',
        year: 'Collected edition',
        venue: 'S. N. Bose National Centre for Basic Sciences',
        authors: 'S. N. Bose',
        url: 'https://www.bose.res.in/Prof.S.N.Bose-Archive/objects/Collected%20Scientific%20Papers.pdf',
        access: 'open',
        note: 'Institutional collected-papers PDF containing the published German text and other scientific works.'
      }
    ],
    archives: [
      {
        title: 'Satyendra Nath Bose — archival biographical record',
        institution: 'Indian Institute of Astrophysics Archives',
        url: 'https://archives.iiap.res.in/index.php/bose-satyendra-nath',
        material: 'Archival authority record and digitised photograph metadata',
        note: 'An archival description with identity information and digital-object metadata.'
      },
      {
        title: 'Bose–Einstein correspondence and quantum-history exhibit',
        institution: 'Quantum History Wall',
        url: 'https://www.quantum-history.de/',
        material: 'Historical correspondence exhibit',
        note: 'Describes Bose’s 1924 letter to Einstein and the publication history; it is an interpretive exhibit, not the original manuscript.'
      }
    ],
    sources: [
      { label: 'BoseStat@100: Centenary of Bose Statistics', publisher: 'S. N. Bose National Centre for Basic Sciences', url: 'https://www.bose.res.in/sevents/bosestat100/index.jsp' },
      { label: 'Satyendra Nath Bose', publisher: 'West Bengal Tourism', url: 'https://wbtourism.gov.in/legends-view-byId/63e0acbe50952a1a1b0e9609/SATYENDRA%20NATH%20BOSE%20%281894%20-%201974%29' }
    ]
  },
  {
    slug: 'srinivasa-ramanujan',
    name: 'Srinivasa Ramanujan',
    initials: 'SR',
    region: 'india',
    discipline: 'Mathematics · Number Theory',
    lifespan: '1887–1920',
    headline: 'An extraordinary mathematical imagination, expressed through notebooks full of ideas.',
    summary: 'An Indian mathematician whose original work transformed number theory, infinite series, continued fractions and the study of mathematical functions.',
    birthplace: 'Erode, Tamil Nadu, India',
    knownFor: ['Number theory', 'Infinite series', 'Partitions', 'Mock theta functions'],
    lifeStory: [
      'Srinivasa Ramanujan was born on 22 December 1887 in Erode and grew up in Kumbakonam. He showed an exceptional aptitude for mathematics from a young age and explored advanced results largely through independent study.',
      'His intense focus on mathematics made formal education difficult: he lost a college scholarship after neglecting subjects outside mathematics. He later worked as a clerk in Madras while continuing to develop and record original mathematical results.',
      'In 1913 he wrote to the Cambridge mathematician G. H. Hardy. Hardy recognised the originality of the work and helped bring Ramanujan to Cambridge in 1914. Their collaboration produced influential papers, though Ramanujan’s health deteriorated and he returned to India in 1919.'
    ],
    work: [
      { title: 'Number theory and partitions', description: 'Ramanujan developed deep results on integer partitions, prime numbers and arithmetic functions, often discovering identities through striking patterns and intuition.' },
      { title: 'Infinite series and continued fractions', description: 'His notebooks contain formulas and identities that continue to inspire work in analysis, combinatorics and mathematical physics.' },
      { title: 'Mock theta functions', description: 'In his final work, Ramanujan described functions that later became important in the theory of modular forms and related areas.' }
    ],
    milestones: [
      { year: '1887', title: 'Born in Erode', description: 'Born on 22 December in present-day Tamil Nadu.' },
      { year: '1912', title: 'Madras Port Trust', description: 'Worked as a clerk while pursuing independent mathematical research.' },
      { year: '1913', title: 'Letter to G. H. Hardy', description: 'Sent a letter containing mathematical results that led to an important collaboration.' },
      { year: '1914', title: 'Arrived at Cambridge', description: 'Began working with Hardy at Trinity College.' },
      { year: '1918', title: 'Fellow of the Royal Society', description: 'Elected a Fellow of the Royal Society and a Fellow of Trinity College.' },
      { year: '1920', title: 'Died in India', description: 'Died on 26 April, aged 32.' }
    ],
    legacy: 'Ramanujan’s notebooks remain a rich source of mathematical research. His work is studied across number theory and mathematical analysis, and his life continues to inspire people who discover mathematics outside conventional paths.',
    publications: [
      {
        title: 'Highly Composite Numbers',
        year: '1915',
        venue: 'Proceedings of the London Mathematical Society, 2(14), 347–409',
        authors: 'S. Ramanujan',
        url: 'https://ramanujan.sirinudi.org/Volumes/published/ram15.pdf',
        access: 'open',
        note: 'Digitised copy of a major original paper, available through the Ramanujan research archive.'
      },
      {
        title: 'Published papers of Srinivasa Ramanujan',
        year: '1911–1920',
        venue: 'Multiple mathematical journals',
        authors: 'Srinivasa Ramanujan',
        url: 'https://ramanujan.sirinudi.org/html/published_papers.html',
        access: 'catalogue',
        note: 'A bibliography of published papers with journal and page details; individual scans are linked where available.'
      }
    ],
    archives: [
      {
        title: 'Letters from Srinivasa Ramanujan to G. H. Hardy',
        institution: 'Trinity College, University of Cambridge Archives',
        url: 'https://archives.trin.cam.ac.uk/index.php/informationobject/browse?levels=232&onlyMedia=1&query=Srinivasa+Ramanujan&sf_culture=en&sort=alphabetic&sortDir=asc&sq0=Srinivasa+Ramanujan&topLod=0',
        material: 'Archival correspondence catalogue',
        note: 'Catalogue records identify surviving correspondence and related manuscript collections; not every item is digitised.'
      }
    ],
    sources: [
      { label: 'Srinivasa Ramanujan (1887–1920)', publisher: 'MacTutor History of Mathematics · University of St Andrews', url: 'https://mathshistory.st-andrews.ac.uk/Biographies/Ramanujan/' },
      { label: 'Srinivasa Ramanujan', publisher: 'Explore Trinity · University of Cambridge', url: 'https://explore.trin.cam.ac.uk/assets/ramanujan/' }
    ]
  },
  {
    slug: 'marie-curie',
    name: 'Marie Curie',
    initials: 'MC',
    region: 'world',
    discipline: 'Physics · Chemistry',
    lifespan: '1867–1934',
    headline: 'A pioneering researcher who transformed the study of radioactivity.',
    summary: 'A physicist and chemist whose research on radioactivity led to the discovery of polonium and radium and two Nobel Prizes.',
    birthplace: 'Warsaw, Poland',
    knownFor: ['Radioactivity', 'Polonium', 'Radium', 'Two Nobel Prizes'],
    lifeStory: [
      'Marie Skłodowska was born in Warsaw in 1867. She moved to Paris to continue her education, studying at the Sorbonne, where she met physicist Pierre Curie.',
      'Working with Pierre, she investigated radioactive materials and helped identify two new elements, polonium and radium. After Pierre’s death in 1906, she continued the research and became a leading figure in the emerging field.',
      'During the First World War, Curie helped organise mobile X-ray units to support medical care near the front. Her scientific career crossed physics, chemistry and practical public service.'
    ],
    work: [
      { title: 'Research on radioactivity', description: 'Curie helped establish radioactivity as a field of research and developed methods for studying radioactive substances.' },
      { title: 'Polonium and radium', description: 'The Curies identified polonium and radium through painstaking investigations of radioactive minerals.' }
    ],
    milestones: [
      { year: '1867', title: 'Born in Warsaw', description: 'Born Maria Skłodowska on 7 November.' },
      { year: '1898', title: 'Polonium and radium', description: 'The Curies announced the discovery of the two elements.' },
      { year: '1903', title: 'Nobel Prize in Physics', description: 'Shared the prize for research on radiation phenomena.' },
      { year: '1911', title: 'Nobel Prize in Chemistry', description: 'Awarded for the discovery of radium and polonium, and the isolation of radium.' },
      { year: '1914–1918', title: 'Mobile X-ray units', description: 'Helped bring radiological services to wounded soldiers during the First World War.' }
    ],
    legacy: 'Curie’s work reshaped physics and chemistry and helped establish methods that remain important in medicine and scientific research. She was the first person to receive Nobel Prizes in two different scientific disciplines.',
    sources: [
      { label: 'Marie Curie — Facts', publisher: 'Nobel Prize', url: 'https://www.nobelprize.org/prizes/physics/1903/marie-curie/facts/' }
    ]
  },
  {
    slug: 'albert-einstein',
    name: 'Albert Einstein',
    initials: 'AE',
    region: 'world',
    discipline: 'Physics · Relativity',
    lifespan: '1879–1955',
    headline: 'A new understanding of space, time, gravity and light.',
    summary: 'A theoretical physicist whose work reshaped modern physics, including relativity and the explanation of the photoelectric effect.',
    birthplace: 'Ulm, German Empire (now Germany)',
    knownFor: ['Special and general relativity', 'Photoelectric effect', 'Brownian motion'],
    lifeStory: [
      'Albert Einstein was born in Ulm in 1879 and studied at the Swiss Federal Polytechnic in Zurich. After graduating, he worked at the Swiss Patent Office in Bern.',
      'In 1905, while working at the patent office, Einstein published several papers that transformed physics. They addressed the photoelectric effect, Brownian motion, special relativity and the equivalence of mass and energy.',
      'He later developed general relativity, describing gravity as the curvature of spacetime. After the Nazi rise to power, he settled in the United States and worked at the Institute for Advanced Study in Princeton.'
    ],
    work: [
      { title: 'Special and general relativity', description: 'Special relativity changed the understanding of space and time; general relativity described gravity through the geometry of spacetime.' },
      { title: 'Photoelectric effect', description: 'Einstein explained how light energy is carried in discrete quanta, helping establish the quantum theory of light. This work was recognised by the 1921 Nobel Prize in Physics.' },
      { title: 'Brownian motion', description: 'His analysis provided strong evidence for the molecular-kinetic theory of matter.' }
    ],
    milestones: [
      { year: '1879', title: 'Born in Ulm', description: 'Born on 14 March in the German Empire.' },
      { year: '1905', title: 'Annus mirabilis', description: 'Published landmark papers on light quanta, Brownian motion and special relativity.' },
      { year: '1915', title: 'General relativity', description: 'Presented the field equations of general relativity.' },
      { year: '1921', title: 'Nobel Prize in Physics', description: 'Recognised especially for the discovery of the law of the photoelectric effect.' },
      { year: '1933', title: 'Moved to the United States', description: 'Settled in Princeton after leaving Germany.' }
    ],
    legacy: 'Einstein’s ideas remain central to modern physics, from GPS timing corrections to cosmology and quantum theory. His work changed not only scientific models but also how people think about the universe.',
    sources: [
      { label: 'Albert Einstein — Facts', publisher: 'Nobel Prize', url: 'https://www.nobelprize.org/prizes/physics/1921/einstein/facts/' }
    ]
  },
  {
    slug: 'katherine-johnson',
    name: 'Katherine Johnson',
    initials: 'KJ',
    region: 'world',
    discipline: 'Mathematics · Spaceflight',
    lifespan: '1918–2020',
    headline: 'The mathematician whose calculations helped guide humans into space.',
    summary: 'An American mathematician at NASA whose calculations supported early human spaceflight, including the Mercury and Apollo programmes.',
    birthplace: 'White Sulphur Springs, West Virginia, United States',
    knownFor: ['Orbital mechanics', 'Mercury programme', 'Apollo programme'],
    lifeStory: [
      'Katherine Coleman Goble Johnson was born in West Virginia in 1918. Her talent for mathematics was evident early: she advanced through school quickly and graduated from West Virginia State College in 1937.',
      'She joined the National Advisory Committee for Aeronautics (NACA) in 1953, working in the segregated West Area Computing section at Langley. Her work involved analysing flight-test data and calculating trajectories.',
      'As the agency became NASA, Johnson contributed to the mathematics behind early human spaceflight. Her calculations supported Alan Shepard’s 1961 flight and John Glenn’s 1962 orbital mission; Glenn asked for her to verify the computer’s numbers.'
    ],
    work: [
      { title: 'Human spaceflight trajectories', description: 'Johnson calculated trajectories and launch windows for early crewed missions, helping engineers understand where a spacecraft would travel and return.' },
      { title: 'Apollo and the Space Shuttle', description: 'Her work also contributed to the Apollo programme, the Space Shuttle and Earth-observation missions.' }
    ],
    milestones: [
      { year: '1918', title: 'Born in West Virginia', description: 'Born on 26 August in White Sulphur Springs.' },
      { year: '1953', title: 'Joined NACA', description: 'Started work at Langley Research Center as a research mathematician.' },
      { year: '1961', title: 'Freedom 7 mission', description: 'Calculated the trajectory for Alan Shepard’s first American human spaceflight.' },
      { year: '1962', title: 'John Glenn’s orbital flight', description: 'Verified the calculations used for the Friendship 7 mission.' },
      { year: '2015', title: 'Presidential Medal of Freedom', description: 'Received the United States’ highest civilian honour.' }
    ],
    legacy: 'Johnson’s career helped expand the role of women and Black mathematicians in aerospace research. Her work is part of the story of how careful mathematical analysis made early human spaceflight possible.',
    sources: [
      { label: 'Katherine Johnson (1918–2020)', publisher: 'NASA Science', url: 'https://science.nasa.gov/people/katherine-johnson/' },
      { label: 'Katherine Johnson Biography', publisher: 'NASA', url: 'https://www.nasa.gov/centers-and-facilities/langley/katherine-johnson-biography/' }
    ]
  }
];

export const getScientistBySlug = (slug: string) =>
  scientists.find((scientist) => scientist.slug === slug);
