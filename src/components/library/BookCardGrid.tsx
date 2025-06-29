import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
}

const mockBooks: Book[] = [
  {
    id: 1,
    title: "Learning React",
    author: "John Doe",
    description:
      "A practical guide to building modern user interfaces with React.",
  },
  {
    id: 2,
    title: "JavaScript Patterns",
    author: "Jane Smith",
    description:
      "Best practices for writing maintainable and efficient JavaScript code.",
  },
  {
    id: 3,
    title: "CSS Mastery",
    author: "Alex Johnson",
    description:
      "Advanced tips for developing responsive and accessible web designs.",
  },
];

const BookCardGrid: React.FC = () => {
  const [readIds, setReadIds] = useState<number[]>([]);

  const markAsRead = (id: number) => {
    if (!readIds.includes(id)) {
      setReadIds([...readIds, id]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockBooks.map((book) => (
          <Card key={book.id} className="flex flex-col">
            <CardContent className="flex-1 space-y-1 p-6">
              <h3 className="text-lg font-semibold">{book.title}</h3>
              <p className="text-sm text-gray-500">{book.author}</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {book.description}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Link to={`/books/${book.id}`} className="ml-auto">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  About
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookCardGrid;
