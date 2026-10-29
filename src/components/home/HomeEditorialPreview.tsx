import React from "react";
import { ArrowRight, BookOpenText, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

const editorialStories = [
  {
    category: "READING CULTURE",
    title: "Ideas and updates from the world of books",
    description: "Editorial stories, literary news, author updates and reading culture, published by Sahadhyayi.",
    href: "/blog",
    action: "Explore Blogs",
    Icon: Newspaper,
  },
  {
    category: "COMMUNITY WRITING",
    title: "Learn from fellow readers",
    description: "Discover book reviews, thoughtful essays and perspectives contributed by the Sahadhyayi community.",
    href: "/articles",
    action: "Explore Articles",
    Icon: BookOpenText,
  },
];

const HomeEditorialPreview = () => (
  <section
    aria-labelledby="home-editorial-heading"
    className="bg-[#F8F8F2] px-4 py-12 text-[#1C201D] transition-colors duration-300 dark:bg-[#0B0D0C] dark:text-[#F3F0E7] sm:px-6 sm:py-16 lg:px-8"
  >
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 max-w-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8F681C] dark:text-[#D5B16D]">
          Read, reflect, discover
        </p>
        <h2 id="home-editorial-heading" className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
          From the reading world and our community
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6] sm:text-base">
          Editorial updates from Sahadhyayi and original writing from readers—two clear ways to explore ideas.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {editorialStories.map(({ category, title, description, href, action, Icon }) => (
          <article
            key={href}
            className="group rounded-2xl border border-[#E3DED4] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#B9CDBD] hover:shadow-md dark:border-[#29332D] dark:bg-[#111614] dark:hover:border-[#45664F] sm:p-7"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-[#8F681C] dark:text-[#D5B16D]">{category}</p>
            <h3 className="mt-2 font-serif text-xl font-bold leading-snug sm:text-2xl">{title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">{description}</p>
            <Link
              to={href}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-[#1C442D] transition-colors hover:text-[#8F681C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 dark:text-[#D5B16D] dark:hover:text-[#E4C688] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#111614]"
            >
              {action}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default HomeEditorialPreview;
