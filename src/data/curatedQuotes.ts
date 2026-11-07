export interface CuratedQuote {
  id: string;
  text: string;
  author: string;
  work: string;
  category: 'wisdom' | 'literature' | 'philosophy' | 'courage' | 'poetry';
  language?: string;
  tags: string[];
}

export const CURATED_LITERARY_QUOTES: CuratedQuote[] = [
  {
    id: 'quote-tagore-gitanjali',
    text: 'Where the mind is without fear and the head is held high; Where knowledge is free; Where the world has not been broken up into fragments by narrow domestic walls.',
    author: 'Rabindranath Tagore',
    work: 'Gitanjali',
    category: 'courage',
    language: 'English / Bengali',
    tags: ['Freedom', 'Knowledge', 'Humanity'],
  },
  {
    id: 'quote-premchand-godan',
    text: 'मनुष्य का सबसे बड़ा धर्म यही है कि वह दूसरों के सुख-दुख में हाथ बटाए। विपत्ति में धैर्य और सफलता में विनम्रता ही चरित्र का सच्चा दर्पण है।',
    author: 'Munshi Premchand',
    work: 'Godan (गोदान)',
    category: 'wisdom',
    language: 'Hindi',
    tags: ['Compassion', 'Character', 'Humility'],
  },
  {
    id: 'quote-marcus-aurelius-meditations',
    text: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
    work: 'Meditations',
    category: 'philosophy',
    language: 'Greek / English',
    tags: ['Mindfulness', 'Stoicism', 'Resilience'],
  },
  {
    id: 'quote-ghalib-divan',
    text: 'हज़ारों ख्वाहिशें ऐसी कि हर ख्वाहिश पे दम निकले, बहुत निकले मिरे अरमाँ लेकिन फिर भी कम निकले।',
    author: 'Mirza Ghalib',
    work: 'Diwan-e-Ghalib',
    category: 'poetry',
    language: 'Urdu / Hindi',
    tags: ['Desire', 'Human Nature', 'Poetry'],
  },
  {
    id: 'quote-kautilya-arthashastra',
    text: 'In the happiness of his subjects lies his happiness; in their welfare his welfare. Whatever pleases himself he shall not consider as good, but whatever pleases his subjects he shall consider as good.',
    author: 'Kautilya (Chanakya)',
    work: 'Arthashastra',
    category: 'wisdom',
    language: 'Sanskrit / English',
    tags: ['Leadership', 'Duty', 'Governance'],
  },
  {
    id: 'quote-virginia-woolf-room',
    text: 'Lock up your libraries if you like; but there is no gate, no lock, no bolt that you can set upon the freedom of my mind.',
    author: 'Virginia Woolf',
    work: 'A Room of One’s Own',
    category: 'literature',
    language: 'English',
    tags: ['Freedom', 'Reading', 'Autonomy'],
  },
  {
    id: 'quote-rumi-masnavi',
    text: 'The wound is the place where the Light enters you.',
    author: 'Jalal al-Din Rumi',
    work: 'The Masnavi',
    category: 'philosophy',
    language: 'Persian / English',
    tags: ['Healing', 'Transformation', 'Spirituality'],
  },
  {
    id: 'quote-kabir-dohas',
    text: 'पोथी पढ़ि पढ़ि जग मुआ, पंडित भया न कोय। ढाई आखर प्रेम का, पढ़े सो पंडित होय।',
    author: 'Sant Kabir',
    work: 'Kabir Bijak',
    category: 'wisdom',
    language: 'Braj / Hindi',
    tags: ['Love', 'Wisdom', 'Simplicity'],
  },
  {
    id: 'quote-dostoevsky-brothers',
    text: 'The mystery of human existence lies not in just staying alive, but in finding something to live for.',
    author: 'Fyodor Dostoevsky',
    work: 'The Brothers Karamazov',
    category: 'literature',
    language: 'Russian / English',
    tags: ['Purpose', 'Existence', 'Meaning'],
  },
  {
    id: 'quote-sarojini-naidu-bird-of-time',
    text: 'A country’s greatness lies in its undying ideals of love and sacrifice that inspire the mothers of the race.',
    author: 'Sarojini Naidu',
    work: 'The Bird of Time',
    category: 'poetry',
    language: 'English',
    tags: ['Sacrifice', 'Inspiration', 'Heritage'],
  },
  {
    id: 'quote-bhagavad-gita-karma',
    text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    author: 'Vyasa',
    work: 'The Bhagavad Gita (Chapter 2, Verse 47)',
    category: 'philosophy',
    language: 'Sanskrit',
    tags: ['Duty', 'Detachment', 'Action'],
  },
  {
    id: 'quote-george-orwell-1984',
    text: 'The best books... are those that tell you what you know already.',
    author: 'George Orwell',
    work: '1984',
    category: 'literature',
    language: 'English',
    tags: ['Books', 'Truth', 'Reflection'],
  },
];

