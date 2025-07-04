
import AuthorProfile from "./AuthorProfile";

interface Author {
  id: number;
  name: string;
  genre: string;
  books: string[];
  rating: number;
  followers: number;
  bio: string;
  image: string;
  availableSlots: string[];
  nextSession: string;
}

interface AuthorGridProps {
  authors: Author[];
}

const AuthorGrid = ({ authors }: AuthorGridProps) => {
  return (
    <section aria-labelledby="authors-grid-heading" className="mb-20">
      <div className="text-center mb-12">
        <h2 id="authors-grid-heading" className="text-4xl font-bold text-gray-900 mb-6">Featured Authors</h2>
        <p className="text-xl text-gray-600">Meet the talented writers in our community</p>
        <p className="text-sm text-gray-500 mt-2">{authors.length} author{authors.length !== 1 && 's'} found</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {authors.map((author) => (
          <AuthorProfile key={author.id} author={author} />
        ))}
      </div>
    </section>
  );
};

export default AuthorGrid;
