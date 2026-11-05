
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { toSeoDescription } from '@/utils/seoText';
import DOMPurify from 'dompurify';
import { blogPostDetails } from '@/data/blogPostDetails';

const BlogPost = () => {
  const { slug } = useParams();

  

  const post = blogPostDetails[slug as keyof typeof blogPostDetails];

  // Build a lightweight table of contents from the article's existing H2/H3 headings.
  // This keeps every article's content as the source of truth and avoids hard-coded section lists.
  const sectionCounts: Record<string, number> = {};
  const articleSections: Array<{ id: string; title: string; level: number }> = [];
  const articleHtml = post?.content.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (heading, tag, attributes, innerHtml) => {
    const title = innerHtml.replace(/<[^>\r\n]{0,2048}>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    const baseId = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    sectionCounts[baseId] = (sectionCounts[baseId] || 0) + 1;
    const id = sectionCounts[baseId] === 1 ? baseId : `${baseId}-${sectionCounts[baseId]}`;
    articleSections.push({ id, title, level: tag.toLowerCase() === 'h2' ? 2 : 3 });
    return `<${tag}${attributes} id="${id}" class="scroll-mt-24">${innerHtml}</${tag}>`;
  }) || '';

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${post.title} | Sahadhyayi Blog`}
        description={slug === 'best-indian-books-to-read' ? 'Discover 25 remarkable Indian books across English and Indian-language literary traditions, including classics, regional fiction, mythology, and social thought.' : toSeoDescription(post.content)}
        canonical={`https://sahadhyayi.com/blog/${slug}`}
        keywords={slug === 'best-indian-books-to-read' ? ['Indian books to read', 'Indian literature', 'regional Indian literature', 'Sahadhyayi', 'book recommendations'] : ['Sahadhyayi', 'reading community', 'digital library', 'book lovers']}
      />
      
      <main className="min-h-screen bg-[#F7F5EF] text-[#202820]">
        <header className="relative isolate overflow-hidden bg-[#101A13]">
          <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url('${post.image}')` }} />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#101A13] via-[#101A13]/90 to-[#101A13]/45" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#101A13]/70 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pb-16 lg:px-8">
            <Link to="/blog" className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-medium text-white/85 transition hover:border-[#D5B16D]/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]">
              <ArrowLeft className="h-4 w-4" /> Back to Journal
            </Link>
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/40 bg-black/25 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E4C17B] backdrop-blur-sm">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Sahadhyayi Journal · Editor-published
              </div>
              <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-[#FBF7EF] sm:text-4xl md:text-5xl lg:text-6xl">{post.title}</h1>
              {(post as { description?: string }).description && <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{(post as { description?: string }).description}</p>}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/70 sm:text-sm">
                <span className="inline-flex items-center gap-2"><User className="h-4 w-4 text-[#D5B16D]" />{post.author}</span>
                <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-[#D5B16D]" />{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-[#D5B16D]" />{post.readTime}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-14">
          <article className="min-w-0 overflow-hidden rounded-2xl border border-[#E4DFD4] bg-white shadow-sm">
            <img src={post.image} alt={post.title} loading="eager" className="aspect-[16/7] w-full object-cover" />
            <div className="px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
              {articleSections.length >= 3 && (
                <nav aria-label="Article contents" className="mb-9 rounded-2xl border border-[#DDE2D7] bg-[#F4F6F0] p-5 sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold text-[#202820]">
                    <span aria-hidden="true" className="text-[#526B54]">☷</span> In this story
                  </h2>
                  <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {articleSections.map((section, index) => (
                      <li key={section.id} className={section.level === 3 ? "sm:ml-4" : ""}>
                        <a href={`#${section.id}`} className="text-sm leading-6 text-[#536153] underline-offset-4 transition-colors hover:text-[#1C442D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D]">
                          {section.level === 2 ? `${index + 1}. ` : "– "}{section.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <div
                className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#202820] prose-h2:mt-10 prose-h2:border-b prose-h2:border-[#E9E5DC] prose-h2:pb-2 prose-h3:mt-8 prose-p:leading-8 prose-p:text-[#4F5A50] prose-a:text-[#1C442D] prose-a:underline-offset-4 prose-li:text-[#4F5A50] prose-strong:text-[#273629] prose-blockquote:border-[#789078] prose-blockquote:bg-[#F4F6F0] prose-blockquote:rounded-r-xl prose-blockquote:py-2"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(articleHtml) }}
              />
              <div className="mt-10 border-t border-[#E9E5DC] pt-5 text-xs leading-5 text-[#737B70]">
                Published by the Sahadhyayi editorial team. This is an official journal story; readers can read and share it, but cannot edit its content.
              </div>
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-[#DDE2D7] bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71816F]">Keep reading</p>
              <h2 className="mt-2 font-serif text-xl font-bold text-[#202820]">Follow your curiosity.</h2>
              <p className="mt-2 text-sm leading-6 text-[#687168]">Explore a book on the topic, or find readers to exchange ideas with.</p>
              <Link to="/library" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#1C442D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#173824]">Explore the Library <ArrowRight className="ml-2 h-4 w-4" /></Link>
              <Link to="/articles" className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-[#DDE2D7] bg-[#F7F8F4] px-4 py-3 text-sm font-semibold text-[#294632] transition hover:bg-[#EDF1E8]">Community Articles</Link>
            </div>
            <div className="rounded-2xl bg-[#EAEDE5] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#526B54]">The Journal</p>
              <p className="mt-2 text-sm leading-6 text-[#596558]">Official updates and curated reading stories from Sahadhyayi. Published content is read-only for community members.</p>
              <Link to="/blog" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline">Browse all stories <ArrowLeft className="h-4 w-4 rotate-180" /></Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
};

export default BlogPost;
