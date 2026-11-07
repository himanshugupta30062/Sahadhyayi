import { Story, StoryPart } from '@/hooks/useStories';

export const STARTER_STORIES: Story[] = [
  {
    id: 'starter-kabuliwala',
    user_id: 'editorial-tagore',
    title: 'The Kabuliwala (काबुलीवाला)',
    description: 'A timeless tale of friendship between five-year-old Mini and an Afghan merchant in Calcutta, exploring love, longing, and fatherhood across distant worlds.',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    genre: 'Classic',
    tags: ['Rabindranath Tagore', 'Friendship', 'Human Connection', 'Classic'],
    author_name: 'Rabindranath Tagore',
    story_type: 'standalone',
    status: 'published',
    completion_status: 'completed',
    published_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    views_count: 1420,
    reads_count: 890,
    likes_count: 324,
    bookmarks_count: 185,
    follows_count: 92,
    parts_count: 1,
    reading_time_minutes: 6,
    user_liked: false,
    user_bookmarked: false,
    user_following: false,
    last_read_part_number: 1,
  },
  {
    id: 'starter-idgah',
    user_id: 'editorial-premchand',
    title: 'Idgah (ईदगाह)',
    description: 'The heartwarming story of four-year-old orphan Hamid who visits the Eid fair with three paise and buys a gift of love and sacrifice for his grandmother Amina.',
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
    genre: 'Drama',
    tags: ['Munshi Premchand', 'Sacrifice', 'Family', 'Classic'],
    author_name: 'Munshi Premchand',
    story_type: 'standalone',
    status: 'published',
    completion_status: 'completed',
    published_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
    views_count: 1890,
    reads_count: 1120,
    likes_count: 450,
    bookmarks_count: 230,
    follows_count: 110,
    parts_count: 1,
    reading_time_minutes: 7,
    user_liked: false,
    user_bookmarked: false,
    user_following: false,
    last_read_part_number: 1,
  },
  {
    id: 'starter-whispers-of-the-monsoon',
    user_id: 'community-ananya',
    title: 'Whispers of the Monsoon',
    description: 'A serialized atmospheric mystery set in a hillside tea estate in Darjeeling, where an ancient journal uncovered during the rains unearths a forgotten secret.',
    cover_image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    genre: 'Mystery',
    tags: ['Darjeeling', 'Mystery', 'Atmospheric', 'Monsoon'],
    author_name: 'Ananya Sen',
    story_type: 'series',
    status: 'published',
    completion_status: 'ongoing',
    published_at: '2026-02-10T00:00:00Z',
    updated_at: '2026-02-18T00:00:00Z',
    views_count: 980,
    reads_count: 610,
    likes_count: 215,
    bookmarks_count: 140,
    follows_count: 88,
    parts_count: 3,
    reading_time_minutes: 12,
    user_liked: false,
    user_bookmarked: false,
    user_following: false,
    last_read_part_number: 1,
  },
  {
    id: 'starter-the-last-station',
    user_id: 'community-vikram',
    title: 'The Last Station at Midnight',
    description: 'A speculative fiction novella about an abandoned railway junction where commuters encounter chapters of their unlived futures before boarding the final train.',
    cover_image_url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80',
    genre: 'Sci-Fi',
    tags: ['Sci-Fi', 'Time Travel', 'Indian Railways', 'Philosophical'],
    author_name: 'Vikram Joshi',
    story_type: 'series',
    status: 'published',
    completion_status: 'completed',
    published_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-25T00:00:00Z',
    views_count: 1140,
    reads_count: 730,
    likes_count: 280,
    bookmarks_count: 165,
    follows_count: 75,
    parts_count: 2,
    reading_time_minutes: 9,
    user_liked: false,
    user_bookmarked: false,
    user_following: false,
    last_read_part_number: 1,
  },
];

export const STARTER_STORY_PARTS: Record<string, StoryPart[]> = {
  'starter-kabuliwala': [
    {
      id: 'part-kabuliwala-1',
      story_id: 'starter-kabuliwala',
      part_number: 1,
      title: 'Mini and Rahmat',
      content: `Mini, my five-year-old daughter, is a great chatterbox. She simply cannot keep silent for even a minute. Her mother often scolds her for her incessant babbling, but I can never bring myself to stop her. One morning, as I was writing the seventeenth chapter of my novel, Mini came into my room and chattered about everything from our servant calling a crow a raven to elephants pouring water from trunks in the clouds.

Suddenly, she looked out the open window and shouted, "A Kabuliwala! A Kabuliwala!"

Down on the street below walked a tall Afghan vendor in loose soiled clothing, wearing a turban and carrying a sack on his shoulder and boxes of dry grapes in his hand. Mini called out to him, but when he turned and began ascending our stairs, she grew terrified, believing the Afghan’s sack contained stolen children, and ran straight to her mother for protection.

I called the Kabuliwala in and purchased some almonds and raisins. He spoke kindly, smiling under his weathered beard. A few days later, to my amazement, I found Mini sitting on a bench near our front door, laughing and conversing freely with the tall Afghan sitting at her feet. He had given her pistachios, and they had struck up a wonderful friendship.

"Well, Little One," Rahmat would ask with a hearty laugh, "when are you going to your in-laws' house?" Most Bengali children were familiar with the phrase, but Mini asked in innocence, "Are you going there, Kabuliwala?"

Years passed. Mini grew into a lovely young woman, and the day of her wedding arrived. Amidst the flute music and the bustling ceremony in our house, a man entered and bowed respectfully. It was Rahmat, freshly released after long years in prison following a sudden street altercation.

I gently told him that there were ceremonies in the house and he should come back another day. He looked crestfallen, then pulled from his pocket a small piece of crumpled paper. Carefully unfolding it, he placed it on my writing table.

Upon it was the inked imprint of a tiny hand—the hand of his own little daughter far away in the mountain valleys of Afghanistan, whom he held in his memory while he traded in Calcutta.

Tears welled in my eyes. I realized then that he and I were not different: he was a father, and I was a father. I called Mini into the room in her bridal silk. Rahmat looked upon her in wonder, realizing that his own child in Kabul must have grown into womanhood too.

I pressed bank notes into his hand and said, "Go home to your daughter in your mountains, Rahmat, and may your reunion bring blessing upon my own child."`,
      status: 'published',
      published_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  'starter-idgah': [
    {
      id: 'part-idgah-1',
      story_id: 'starter-idgah',
      part_number: 1,
      title: 'Hamid’s Chimta',
      content: `After thirty long days of fasting, Eid had arrived at last. The village was stirring with joyful excitement. Everyone was preparing to go to the Idgah.

Among the children, none was happier than four-year-old Hamid. Hamid was an orphan. His father had succumbed to cholera the previous year, and his mother had quietly wasted away soon after. Now Hamid lived with his elderly grandmother, Amina, and slept happily in her embrace. Amina told him that his father had gone to earn money and would return with sacks of silver, and that his mother had gone to Allah to bring back beautiful gifts. Hamid believed her with all his innocent heart.

While the other children received ten or twelve paise from their parents, poor Amina had only three paise to give Hamid. She worried about sending him alone into the crowd, fearing he might get lost, but Hamid said reassuringly, "Do not fear, Dadi. I will return before anyone else."

At the Idgah, thousands bowed together in prayer in long, reverent rows—a magnificent spectacle of brotherhood where neither wealth nor status separated one man from another. When prayers concluded, the children raced to the bustling fairground.

Mahmood bought a clay policeman in khaki with a red turban. Mohsin bought a cheerful water-carrier. Noorey chose an upright lawyer in a black gown. Each toy cost two paise. Hamid gazed at them with longing eyes as the clay toys shone brightly. Then came the sweet shops: gulab jamun, halwa, rewri. Hamid had only three paise, and he held on to them tightly.

Beyond the sweet shops lay hardware stalls selling cast-iron utensils, nails, and tongs. Suddenly, Hamid stopped in front of a pair of iron tongs—a chimta.

He remembered how every day when his grandmother baked rotis over the earthen stove, the iron griddle burnt her fingers because she had no tongs. Her hands were scarred with painful blisters.

"How much for this chimta?" Hamid asked the shopkeeper.
"Six paise," replied the merchant.
Hamid’s heart sank, but he braced himself. "Will you take three?" he asked boldly and began walking away so as not to hear an angry reply.

To his astonishment, the shopkeeper called him back and handed him the chimta for three paise!

Hamid placed the iron tongs proudly across his shoulder like a rifle and marched triumphantly toward his friends. When the other boys mocked him, Hamid retorted with brilliant wit: "Your clay toys will shatter if they fall to the floor! My chimta is made of steel—it can endure fire, water, and storms without breaking!" One by one, the other boys looked with envy at Hamid’s indomitable tool.

When Hamid reached home, Amina rushed to embrace him. Then she saw the tongs in his hand.
"Where did you get this chimta? How much did you spend?"
"Three paise. I bought it at the fair."

Amina struck her forehead in distress. "What an unlucky child! It is afternoon and you haven't eaten a morsel or had a drop of water. And of all things at the fair, you bought an iron chimta?"

Hamid looked down and said in a soft, gentle voice: "Your fingers burned every day on the tava when you baked rotis. That is why I bought it for you."

The old woman's anger melted into boundless love. Tears streamed down her aged cheeks. Hamid, the child, had acted as Hamid the elder, while Amina, the elder, wept like a little girl. She raised her hands to heaven, showering blessings upon her grandson who had sacrificed his own fairground joys to protect her hands.`,
      status: 'published',
      published_at: '2026-01-05T00:00:00Z',
      created_at: '2026-01-05T00:00:00Z',
      updated_at: '2026-01-05T00:00:00Z',
    },
  ],
  'starter-whispers-of-the-monsoon': [
    {
      id: 'part-monsoon-1',
      story_id: 'starter-whispers-of-the-monsoon',
      part_number: 1,
      title: 'Chapter 1: The Cedar Chest',
      content: `The rain in Darjeeling does not simply fall; it inhabits the town. It wraps the cedar slopes in thick, milky mist, dripping rhythmically from corrugated roofs and softening the whistling climb of the Himalayan toy train.

I had arrived at Glenquin Manor in late July to catalog the estate library left by my grand-uncle, a botanist and surveyor who spent forty years documenting rare alpine rhododendrons. The manor was quiet, save for the crackle of pine logs in the hearth and the muffled thud of tea workers returning along the misty ridges.

In the attic room behind the herbarium shelves stood an iron-strapped cedar chest. The brass padlock had rusted into stillness, but with a drop of linseed oil and the heavy skeleton key found in my uncle's desk drawer, the tumbler clicked.

Inside, wrapped in oilcloth, was a handwritten leather notebook stamped 1948. On the first page, in faded sepia ink, were coordinates and an inscription:
"To whoever reads this when the monsoon returns: The third garden is not on the map."`,
      status: 'published',
      published_at: '2026-02-10T00:00:00Z',
      created_at: '2026-02-10T00:00:00Z',
      updated_at: '2026-02-10T00:00:00Z',
    },
    {
      id: 'part-monsoon-2',
      story_id: 'starter-whispers-of-the-monsoon',
      part_number: 2,
      title: 'Chapter 2: The Tea Planter’s Ledger',
      content: `The following morning, the cloud broke just enough to reveal the icy shoulders of Kanchenjunga gleaming through the pines. I carried the notebook down to the village tea post, where old Mr. Dorjee was inspecting freshly rolled silver needle leaves.

When I showed him the seal on the ledger, his spectacles slipped an inch down his nose.
"Glenquin Third Garden?" he whispered, glancing around the wooden tasting counter. "Everyone knows Glenquin has only two divisions: East Slope and Valley View. But sixty years ago, before the landslide of '52, there was an experimental terraced terrace behind Batasia Loop."

He leaned closer. "Your grand-uncle did not grow tea there. He was preserving seeds brought back by Tibetan pilgrims. The elders called it the Garden of Solace."`,
      status: 'published',
      published_at: '2026-02-14T00:00:00Z',
      created_at: '2026-02-14T00:00:00Z',
      updated_at: '2026-02-14T00:00:00Z',
    },
    {
      id: 'part-monsoon-3',
      story_id: 'starter-whispers-of-the-monsoon',
      part_number: 3,
      title: 'Chapter 3: The Hidden Terrace',
      content: `Equipped with a compass, rain boots, and uncle's field notes, I set off along the old ridge path where wild hydrangeas spilled over lichen-covered stone walls. The air smelled of wet earth and crushed pine needles.

At the exact milestone marked with an inverted crescent, the undergrowth parted into an overgrown stone staircase descending into an amphitheater of sheltered terraced soil. There, shielded from harsh northern winds, bloomed rows of blue Himalayan poppies—meconopsis grandis—rare flowers thought to have vanished from the sub-Himalayan valleys decades ago.

Beside the stone bench lay a carved slate tablet:
"What we preserve in quiet dedication outlasts the storms that tear the hillsides."

Standing in the gentle rain with the bells of Ghoom Monastery chiming in the valley below, I understood what my uncle had left behind. Not merely a surveyor's ledger, but a sanctuary of endurance.`,
      status: 'published',
      published_at: '2026-02-18T00:00:00Z',
      created_at: '2026-02-18T00:00:00Z',
      updated_at: '2026-02-18T00:00:00Z',
    },
  ],
  'starter-the-last-station': [
    {
      id: 'part-station-1',
      story_id: 'starter-the-last-station',
      part_number: 1,
      title: 'Part 1: The Platform Where Clocks Run Backwards',
      content: `If you fall asleep on the suburban local past midnight, between the salt marshes of Bhayandar and the dark mangroves of Naigaon, there is an unscheduled signal called platform 0.

The station board is painted in faded enamel: "Nirantar Junction — All Destinations." The ticket counter does not accept rupees; the clerk, an elderly gentleman wearing vintage brass-rimmed spectacles, asks only for a memory you are willing to let go.

"One unfulfilled promise," he told me when I found myself standing on the damp platform under yellow halogen lamps. "Or a conversation you wish had turned out differently."

Along the platform sat travelers of every era: a student holding an unmailed examination form from 1994, a violinist tuning silent strings, and a woman watching the rain glisten on the steel tracks. Every five minutes, an electric bell rang, announcing trains destined for 'What Might Have Been' and 'What Still Remains'.`,
      status: 'published',
      published_at: '2026-02-20T00:00:00Z',
      created_at: '2026-02-20T00:00:00Z',
      updated_at: '2026-02-20T00:00:00Z',
    },
    {
      id: 'part-station-2',
      story_id: 'starter-the-last-station',
      part_number: 2,
      title: 'Part 2: The Departure',
      content: `The loudspeaker crackled to life with the familiar hum of an Indian Railways chime:
"Train number zero-zero-infinity, the Morning Return Express, is now arriving on platform zero. Passengers holding tickets for second chances, please board immediately."

I stood before the open carriage door. The interior was warm, illuminated by gentle amber light, smelling faintly of old books and cardamom tea. Through the window, I caught sight of my own reflection—not burdened by regrets or hurried deadlines, but calm and observant.

"You don't have to change your past to live your future," the conductor said, stamping my ticket with an ink mark shaped like a compass rose. "You only have to decide which station you choose to disembark at today."

The whistle blew. As the train slipped smoothly forward into the dawn, the mangroves faded into the familiar morning skyline of Mumbai. I opened my eyes in my seat just as the local pulled into Churchgate station. The sun was rising over the Arabian Sea, and for the first time in months, I felt completely awake.`,
      status: 'published',
      published_at: '2026-02-25T00:00:00Z',
      created_at: '2026-02-25T00:00:00Z',
      updated_at: '2026-02-25T00:00:00Z',
    },
  ],
};

