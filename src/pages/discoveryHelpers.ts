export const trendingBooks = [
  { id: 1, title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.7 },
  { id: 2, title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6 },
  { id: 3, title: 'Educated', author: 'Tara Westover', rating: 4.5 },
];

export const curatedLists = [
  {
    title: "If you liked 'Dune', try these",
    books: [
      { id: 4, title: 'Hyperion', author: 'Dan Simmons' },
      { id: 5, title: 'Foundation', author: 'Isaac Asimov' },
    ],
  },
  {
    title: 'Books about Space Exploration',
    books: [
      { id: 6, title: 'The Martian', author: 'Andy Weir' },
      { id: 7, title: 'Packing for Mars', author: 'Mary Roach' },
    ],
  },
];

export interface Review {
  id: number;
  user: string;
  text: string;
  votes: number;
}

export const implementEnhancedDiscovery = () => {
  // Placeholder function for future integration
  return true;
};
