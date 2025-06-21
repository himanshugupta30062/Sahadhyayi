import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  image: string;
}

const mockBooks: Book[] = [
  {
    id: 1,
    title: "Learning React",
    author: "John Doe",
    description:
      "A practical guide to building modern user interfaces with React.",
    image: "/lovable-uploads/3f0d5de6-4956-4feb-937f-90f70f359001.png",
  },
  {
    id: 2,
    title: "JavaScript Patterns",
    author: "Jane Smith",
    description:
      "Best practices for writing maintainable and efficient JavaScript code.",
    image: "/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png",
  },
  {
    id: 3,
    title: "CSS Mastery",
    author: "Alex Johnson",
    description:
      "Advanced tips for developing responsive and accessible web designs.",
    image: "/lovable-uploads/3f0d5de6-4956-4feb-937f-90f70f359001.png",
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
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Featured Books
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockBooks.map((book) => (
          <Card
            key={book.id}
            className="flex flex-col bg-white/80 backdrop-blur-sm border-amber-200 overflow-hidden shadow-md"
          >
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-40 object-cover"
            />
            <CardContent className="flex-1 space-y-1 p-6">
              <h3 className="text-lg font-semibold">{book.title}</h3>
              <p className="text-sm text-gray-500">{book.author}</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {book.description}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                size="sm"
                onClick={() => markAsRead(book.id)}
                disabled={readIds.includes(book.id)}
                className="ml-auto bg-amber-600 hover:bg-amber-700"
              >
                {readIds.includes(book.id) ? "Read" : "Mark as Read"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookCardGrid;
