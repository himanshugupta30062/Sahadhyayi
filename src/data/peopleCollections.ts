export interface PersonStorySource {
  label: string;
  publisher: string;
  url: string;
}

export interface PersonStory {
  slug: string;
  name: string;
  lifespan: string;
  origin: string;
  role: string;
  summary: string;
  story: string[];
  milestones: { date: string; title: string; description: string }[];
  themes: string[];
  sources: PersonStorySource[];
}

export interface PeopleCollection {
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  accent: "gold" | "green" | "indigo";
  people: PersonStory[];
}

export const peopleCollections: Record<string, PeopleCollection> = {
  "social-activists": {
    title: "Social Activists",
    eyebrow: "People who organised for change",
    description: "Explore the lives and work of people who challenged injustice and helped communities claim their rights.",
    intro: "Activism takes many forms: organising workers, defending the environment, expanding access to information and protecting children. These profiles link to sources that document the work.",
    accent: "green",
    people: [
      {
        slug: "kailash-satyarthi",
        name: "Kailash Satyarthi",
        lifespan: "Born 1954",
        origin: "Vidisha, Madhya Pradesh, India",
        role: "Children's rights activist · Nobel Peace Prize laureate",
        summary: "He founded Bachpan Bachao Andolan in 1980 and has campaigned against child labour, trafficking and exploitation, while advocating education for every child.",
        story: [
          "Kailash Satyarthi trained as an electrical engineer but turned to child-rights activism. In 1980, he founded Bachpan Bachao Andolan, a movement focused on rescuing children from exploitative labour and helping them access education and rehabilitation.",
          "He helped build wider networks against child labour, including the Global March Against Child Labour. His advocacy contributed to international attention on the worst forms of child labour and the importance of education.",
          "In 2014, he shared the Nobel Peace Prize with Malala Yousafzai for their struggle against the suppression of children and young people and for the right of all children to education."
        ],
        milestones: [
          { date: "1980", title: "Bachpan Bachao Andolan", description: "Founded the Save the Childhood Movement." },
          { date: "1998", title: "Global March", description: "Helped lead an international mobilisation against child labour." },
          { date: "2014", title: "Nobel Peace Prize", description: "Shared the Nobel Peace Prize with Malala Yousafzai." }
        ],
        themes: ["Children's rights", "Education", "Human rights"],
        sources: [
          { label: "Kailash Satyarthi — biographical", publisher: "Nobel Prize", url: "https://www.nobelprize.org/prizes/peace/2014/satyarthi/biographical/" },
          { label: "Kailash Satyarthi — facts", publisher: "Nobel Prize", url: "https://www.nobelprize.org/laureate/913" }
        ]
      },
      {
        slug: "ela-bhatt",
        name: "Ela Bhatt",
        lifespan: "1933–2022",
        origin: "Ahmedabad, Gujarat, India",
        role: "Women's rights activist · Cooperative organiser",
        summary: "Ela Bhatt founded the Self-Employed Women's Association (SEWA), organising women workers in the informal economy around work, income security and dignity.",
        story: [
          "Ela Bhatt worked with textile workers before turning her attention to the challenges faced by self-employed women and workers in the informal economy. She believed women needed to organise collectively to improve their economic security.",
          "In 1972, she founded the Self-Employed Women's Association. SEWA combined trade-union organising with cooperative and financial services, including a cooperative bank founded in 1973.",
          "Her work connected women's economic independence with non-violence, self-reliance and grassroots organisation. She later became a founding member of The Elders, a group of independent global leaders."
        ],
        milestones: [
          { date: "1972", title: "Founded SEWA", description: "Established the Self-Employed Women's Association." },
          { date: "1973", title: "Women's cooperative bank", description: "Helped establish SEWA's cooperative bank." },
          { date: "2007", title: "The Elders", description: "Became a founding member of The Elders." }
        ],
        themes: ["Women's rights", "Workers' rights", "Cooperatives"],
        sources: [
          { label: "Ela Bhatt", publisher: "The Elders", url: "https://theelders.org/profile/ela-bhatt" },
          { label: "Ela Bhatt — oral history", publisher: "Harvard Business School, Baker Library", url: "https://www.library.hbs.edu/special-collections-and-archives/collections/collection-areas/oral-histories/creating-emerging-markets/interviews/ela-bhatt" }
        ]
      },
      {
        slug: "medha-patkar",
        name: "Medha Patkar",
        lifespan: "Born 1954",
        origin: "Mumbai, Maharashtra, India",
        role: "Social activist · Environmental justice organiser",
        summary: "A central organiser in the Narmada Bachao Andolan, Medha Patkar became known for peaceful campaigns focused on displacement, livelihoods and the social impacts of large dams.",
        story: [
          "Medha Patkar studied social work and became involved in grassroots organising with communities affected by development projects. In 1985, she began working with the Narmada Bachao Andolan.",
          "The movement questioned the costs of large dam projects for communities whose homes, farms and forests were at risk of submergence. Patkar helped organise marches, public campaigns and non-violent protests.",
          "Her work has remained part of wider debates about development, environmental protection, rehabilitation and the rights of communities affected by infrastructure projects."
        ],
        milestones: [
          { date: "1985", title: "Narmada Bachao Andolan", description: "Began organising with communities affected by the Narmada Valley projects." },
          { date: "1992", title: "Goldman Environmental Prize", description: "Received the Goldman Environmental Prize for work on freshwater and community impacts." }
        ],
        themes: ["Environmental justice", "Displacement", "Community rights"],
        sources: [
          { label: "Medha Patkar — 1992 Goldman Prize", publisher: "Goldman Environmental Prize", url: "https://www.goldmanprize.org/recipient/medha-patkar/" },
          { label: "Medha Patkar saga: From Narmada movement to many causes", publisher: "The Indian Express", url: "https://indianexpress.com/article/political-pulse/medha-patkar-saga-narmada-anti-dam-movement-fighter-causes-8292896/" }
        ]
      },
      {
        slug: "aruna-roy",
        name: "Aruna Roy",
        lifespan: "Born 1946",
        origin: "India",
        role: "Social activist · Transparency and right-to-information campaigner",
        summary: "After leaving the Indian Administrative Service, Aruna Roy worked with rural communities and helped build MKSS, a grassroots movement central to the campaign for the Right to Information.",
        story: [
          "Aruna Roy left the Indian Administrative Service in 1975 and moved into rural development work. In Rajasthan, she worked alongside communities organising around wages, accountability and access to public information.",
          "She and fellow activists helped establish the Mazdoor Kisan Shakti Sangathan (MKSS). Public hearings and demands for access to government records became important parts of the wider right-to-information movement.",
          "Her activism connected local struggles for fair wages and public services with national campaigns for transparency and accountability in government."
        ],
        milestones: [
          { date: "1975", title: "Left the civil service", description: "Resigned from the Indian Administrative Service to work with rural communities." },
          { date: "1990", title: "MKSS", description: "Helped form the Mazdoor Kisan Shakti Sangathan." },
          { date: "2000", title: "Ramon Magsaysay Award", description: "Recognised for advocacy of transparency and people's right to information." }
        ],
        themes: ["Right to information", "Rural rights", "Public accountability"],
        sources: [
          { label: "Aruna Roy", publisher: "Ramon Magsaysay Award Foundation", url: "https://rmaward.asia/rmawardees/roy-aruna/" },
          { label: "Aruna Roy — profile", publisher: "McGill Global Governance Lab", url: "https://globalgovernance.lab.mcgill.ca/people/aruna-roy/" }
        ]
      }
    ]
  },
  "freedom-fighters": {
    title: "Freedom Fighters",
    eyebrow: "Lives from India's freedom struggle",
    description: "Discover the people, movements and difficult choices that shaped India's long struggle against colonial rule.",
    intro: "The freedom movement was diverse and contested, involving constitutional politics, mass protest, revolutionary organising and many regional struggles. These profiles offer a starting point, not a complete history.",
    accent: "indigo",
    people: [
      {
        slug: "subhas-chandra-bose",
        name: "Subhas Chandra Bose",
        lifespan: "1897–1945",
        origin: "Cuttack, Odisha, India",
        role: "Nationalist leader · Indian National Army",
        summary: "A prominent nationalist leader, Bose rejected the pace and strategy of some Congress colleagues and sought international military support for India's independence during the Second World War.",
        story: [
          "Subhas Chandra Bose studied in India and Britain and prepared for the Indian Civil Services, but left that path to join the national movement. He became a leading figure in the Indian National Congress and was elected its president in 1938 and 1939.",
          "After differences with the Congress leadership over strategy, Bose pursued a different route to independence. During the Second World War he sought support from Axis powers and took command of the Indian National Army in Southeast Asia.",
          "The INA's military campaign did not achieve its objective, but its soldiers, trials and public legacy became an important part of the final phase of the independence movement. Accounts of Bose's death in 1945 have remained the subject of historical investigation and debate."
        ],
        milestones: [
          { date: "1897", title: "Born in Cuttack", description: "Born on 23 January in Cuttack, present-day Odisha." },
          { date: "1938–1939", title: "Congress president", description: "Elected president of the Indian National Congress for two consecutive terms." },
          { date: "1943", title: "Indian National Army", description: "Took command of the INA in Southeast Asia." }
        ],
        themes: ["National movement", "Indian National Army", "Anti-colonial politics"],
        sources: [
          { label: "Netaji Subhas Chandra Bose", publisher: "Ministry of Culture, Government of India", url: "https://culture.gov.in/netaji-subhas-chandra-bose" }
        ]
      },
      {
        slug: "bhagat-singh",
        name: "Bhagat Singh",
        lifespan: "1907–1931",
        origin: "Punjab, British India",
        role: "Revolutionary · Anti-colonial organiser",
        summary: "Bhagat Singh became a prominent revolutionary voice in the independence movement. His letters and prison writings remain important historical sources for understanding his political thought.",
        story: [
          "Bhagat Singh was drawn into the nationalist movement while still young. He left college to join political activity and became associated with the Hindustan Socialist Republican Association.",
          "He and B. K. Dutt threw bombs in the Central Legislative Assembly in April 1929 as a protest intended to make political arguments heard. He was later tried in the Lahore Conspiracy Case in connection with the killing of police officer J. P. Saunders.",
          "Bhagat Singh, Rajguru and Sukhdev were executed on 23 March 1931. His surviving letters, diary and writings offer a record of his political ideas and his reflections while imprisoned."
        ],
        milestones: [
          { date: "1907", title: "Born in Punjab", description: "Born into a family involved in anti-colonial activity." },
          { date: "1929", title: "Central Legislative Assembly", description: "Arrested after the protest with B. K. Dutt in the Assembly." },
          { date: "23 March 1931", title: "Executed", description: "Executed with Rajguru and Sukhdev following the Lahore Conspiracy Case." }
        ],
        themes: ["Revolutionary movement", "Political writing", "Anti-colonial resistance"],
        sources: [
          { label: "Guide to Microfilms of Indian Collection — Bhagat Singh papers", publisher: "National Archives of India", url: "https://nationalarchives.nic.in/sites/default/files/2026-01/10.Guide%20to%20Microfilms%20of%20Indian%20Collection.pdf" }
        ]
      },
      {
        slug: "sarojini-naidu",
        name: "Sarojini Naidu",
        lifespan: "1879–1949",
        origin: "Hyderabad, India",
        role: "Poet · Women's rights campaigner · Freedom fighter",
        summary: "Sarojini Naidu linked poetry and public speaking with campaigns for women's rights and Indian self-rule. In 1925, she became the first Indian woman to preside over the Indian National Congress.",
        story: [
          "Sarojini Naidu studied in India and England, where she encountered the women's suffrage movement. She became involved in the Indian nationalist movement and campaigned for women's education, political participation and social welfare.",
          "She worked closely with leaders of the independence movement, took part in the Salt Satyagraha and was repeatedly imprisoned by the colonial authorities. Her speeches helped connect the cause of freedom with the demand for women's public and political rights.",
          "After independence, she became the first woman governor of the United Provinces. Her public life combined political leadership with a literary career that earned her the name 'Nightingale of India'."
        ],
        milestones: [
          { date: "1879", title: "Born in Hyderabad", description: "Born on 13 February in Hyderabad." },
          { date: "1925", title: "Congress president", description: "Became the first Indian woman to preside over the Indian National Congress." },
          { date: "1947", title: "Governor", description: "Appointed governor of the United Provinces after independence." }
        ],
        themes: ["Women's rights", "Poetry", "National movement"],
        sources: [
          { label: "Sarojini Naidu", publisher: "King's College London", url: "https://www.kcl.ac.uk/people/sarojini-naidu" },
          { label: "Mrs. Sarojini Naidu", publisher: "Indian National Congress", url: "https://inc.in/leadership/past-party-presidents/mrs-sarojini-naidu" }
        ]
      },
      {
        slug: "rani-lakshmibai",
        name: "Rani Lakshmibai",
        lifespan: "19th century · Died 1858",
        origin: "Jhansi, Bundelkhand, India",
        role: "Queen of Jhansi · Leader in the Revolt of 1857",
        summary: "Rani Lakshmibai became one of the best-known leaders associated with the 1857 uprising. Her resistance in Jhansi made her a lasting symbol of anti-colonial courage.",
        story: [
          "Lakshmibai became the queen of Jhansi after her marriage to Raja Gangadhar Rao. Following the annexation of Jhansi by the East India Company, she pursued a legal challenge and later became a central figure in the events of 1857.",
          "During the uprising, Indian fighters approached her to lead the resistance in Jhansi. She organised the defence of the city and fought British forces in 1858.",
          "The details of her life have been retold in history, literature and public memory. Government heritage material in Jhansi documents the palace where she lived and the events surrounding the 1857 revolt."
        ],
        milestones: [
          { date: "1842", title: "Queen of Jhansi", description: "Married Raja Gangadhar Rao and became queen of Jhansi." },
          { date: "1853–1854", title: "Annexation dispute", description: "Jhansi was annexed under the Doctrine of Lapse; Lakshmibai pursued a legal challenge." },
          { date: "1857–1858", title: "Revolt and resistance", description: "Led resistance in Jhansi during the uprising; died in 1858." }
        ],
        themes: ["1857 uprising", "Women in history", "Anti-colonial resistance"],
        sources: [
          { label: "Palace of Rani Lakshmi Bai", publisher: "District Jhansi, Government of Uttar Pradesh", url: "https://jhansi.nic.in/tourist-place/palace-of-rani-lakshmi-bai/" },
          { label: "Rani Lakshmi Bai", publisher: "UP NRI Department, Government of Uttar Pradesh", url: "https://www.nri.up.gov.in/article/en/jhansi2" }
        ]
      },
      {
        slug: "mahatma-gandhi",
        name: "Mahatma Gandhi",
        lifespan: "1869–1948",
        origin: "Porbandar, Gujarat, India",
        role: "Political and social leader · Advocate of satyagraha",
        summary: "Gandhi developed and mobilised methods of non-violent resistance that became central to major campaigns against British rule, including the Salt March.",
        story: [
          "Mohandas Karamchand Gandhi studied law in London and worked in South Africa before returning to India in January 1915. His political practice developed around satyagraha: organised resistance grounded in truth and non-violence.",
          "In India, he supported campaigns including Champaran and Kheda and helped lead mass movements such as the Non-Cooperation Movement, Civil Disobedience and Quit India. The 1930 Salt March became one of the defining public actions of the independence struggle.",
          "Gandhi's legacy is influential and debated. His writings, campaigns and the many people who worked with or challenged him remain essential to understanding India's modern history."
        ],
        milestones: [
          { date: "1893", title: "South Africa", description: "Travelled to South Africa, where his political activism developed." },
          { date: "1915", title: "Returned to India", description: "Returned to India from South Africa in January." },
          { date: "1930", title: "Salt March", description: "Led the 385-kilometre march from Sabarmati to Dandi against the salt tax." }
        ],
        themes: ["Satyagraha", "Non-violent resistance", "Mass movements"],
        sources: [
          { label: "Mahatma Gandhi Chronology", publisher: "Gandhi Heritage Portal", url: "https://www.gandhiheritageportal.org/chronology" },
          { label: "Life & Times of Mahatma Gandhi", publisher: "Gandhi Heritage Portal", url: "https://www.gandhiheritageportal.org/" }
        ]
      }
    ]
  }
};
