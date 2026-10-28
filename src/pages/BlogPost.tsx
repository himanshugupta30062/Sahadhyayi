import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import SEO from '@/components/SEO';
import DOMPurify from 'dompurify';

const blogPosts = {
  'what-is-sahadhyayi-meaning-story': {
    title: 'What is Sahadhyayi? Meaning & Story Behind Our Name',
    description: 'Discover the meaning of Sahadhyayi and the idea behind a community of fellow readers.',
    content: `
      <h2>The Deep Meaning of Sahadhyayi</h2>
      <p>Sahadhyayi (सहाध्यायी) is a Sanskrit word associated with a fellow student or one who studies alongside another. At Sahadhyayi, we believe reading can be a shared journey of discovery and growth.</p>
      <h3>Why We Chose the Name</h3>
      <p>We wanted a name that captured a community where readers come together, share insights, and grow intellectually as companions on the reading journey.</p>
      <h3>The Sahadhyayi Philosophy</h3>
      <ul><li><strong>Reading is better together:</strong> Shared experiences bring new perspectives.</li><li><strong>Every reader has something to offer:</strong> New and experienced readers can both contribute.</li><li><strong>Deep reading matters:</strong> Focused reading creates space for thoughtful engagement.</li><li><strong>Knowledge should be accessible:</strong> We want to help readers discover books and resources.</li></ul>
      <h3>Explore the Community</h3>
      <p>Explore the library, find fellow readers, and make your next book the beginning of a conversation.</p>
    `,
    author: 'Himanshu Gupta', date: '2024-07-14', readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=630&fit=crop'
  },
  'how-sahadhyayi-revives-reading-culture': {
    title: 'How Sahadhyayi Revives the Reading Culture',
    description: 'How community and thoughtful tools can support a lasting reading habit.',
    content: `
      <h2>Making Space for Deep Reading</h2>
      <p>Our days are full of notifications and short-form content. Making time for a book can feel difficult, but a small, consistent reading practice can create room for focus and reflection.</p>
      <h3>Read With Other People</h3><p>Reading groups let people share ideas, ask questions, and see a familiar passage from a new perspective. A community can also offer encouragement when a book becomes challenging.</p>
      <h3>Choose Books With Intention</h3><p>Explore genres outside your usual choices, keep a simple reading goal, and make a note of ideas you would like to revisit.</p>
      <h3>Technology in Service of Reading</h3><p>Sahadhyayi brings book discovery and reader connection together so that technology can support the reading experience rather than replace it.</p>
      <p>Start with a book that interests you, give it your attention, and share what you discover with fellow readers.</p>
    `,
    author: 'Himanshu Gupta', date: '2024-07-14', readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop'
  },
  'why-book-lovers-should-join-sahadhyayi': {
    title: '5 Reasons Why Book Lovers Should Join Sahadhyayi',
    description: 'Discover books, connect with readers, and develop a more social reading practice.',
    content: `
      <h2>Make Reading a Shared Experience</h2>
      <h3>1. Discover Your Next Book</h3><p>Explore titles and authors beyond your usual reading list.</p>
      <h3>2. Exchange Perspectives</h3><p>Conversations with other readers can reveal details you missed and deepen your understanding.</p>
      <h3>3. Explore Different Genres</h3><p>Use recommendations and curated collections to try fiction, history, poetry, philosophy, and more.</p>
      <h3>4. Keep Your Reading Journey Visible</h3><p>Tracking what you read can help you reflect on your interests and return to ideas that mattered.</p>
      <h3>5. Build a Reading Habit</h3><p>Small goals and shared enthusiasm can help make reading a steady part of everyday life.</p>
      <p>At Sahadhyayi, reading is not only about finishing a book. It is also about the ideas and conversations that stay with you.</p>
    `,
    author: 'Himanshu Gupta', date: '2024-07-14', readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&h=630&fit=crop'
  },
  'best-indian-books-to-read': {
    title: '25 Best Indian Books to Read: Classics, Novels & Regional Literature',
    description: 'Discover 25 remarkable Indian books across Hindi, Bengali, English, Kannada, Malayalam, Marathi, Tamil, Telugu, Gujarati, and Punjabi literary traditions.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=630&fit=crop',
    content: `
      <p class="lead">Indian literature is filled with unforgettable stories, timeless wisdom, powerful characters, and reflections on the many experiences that shape our lives. From ancient epics and philosophical writing to modern novels and regional literary masterpieces, Indian books offer a window into the country's diverse cultures, languages, traditions, and changing society.</p>
      <p>This collection brings together 25 remarkable Indian books for readers who want to explore that richness. It includes classics, social novels, mythology, historical fiction, poetry, and influential works of nonfiction. The selection is a starting point for discovery, not an official ranking. Some titles were originally written in English; others can be explored in translations, depending on the edition available.</p>

      <h2>1. Godan — Munshi Premchand</h2><p><em>Hindi · Social fiction</em></p><p><i>Godan</i> follows Hori, a poor farmer whose dream of owning a cow reflects his desire for dignity and security. Through Hori and his family, Premchand examines rural poverty, debt, caste, exploitation, and social inequality. It remains a powerful introduction to the realities of rural life and the human cost of economic hardship.</p>
      <h2>2. Malgudi Days — R. K. Narayan</h2><p><em>English · Short stories</em></p><p>Set in the fictional South Indian town of Malgudi, these stories follow schoolchildren, shopkeepers, families, dreamers, and ordinary people facing unexpected situations. Narayan combines gentle humour with careful observation to show how everyday moments can reveal larger truths about human nature.</p>
      <h2>3. The Guide — R. K. Narayan</h2><p><em>English · Literary fiction</em></p><p>Raju's life changes through his relationship with Rosie, a woman who pursues her passion for dance. As his identity evolves, he must navigate ambition, deception, public expectations, and spiritual responsibility. The novel explores personal transformation and the distance between the image people project and who they become.</p>
      <h2>4. Train to Pakistan — Khushwant Singh</h2><p><em>English · Historical fiction</em></p><p>Set in a village on the India–Pakistan border during Partition in 1947, this novel shows how political upheaval transforms ordinary lives. Singh explores friendship, communal tension, love, fear, and sacrifice, giving a deeply human perspective on a pivotal moment in South Asian history.</p>
      <h2>5. The God of Small Things — Arundhati Roy</h2><p><em>English · Literary fiction</em></p><p>Fraternal twins Rahel and Estha are at the centre of a story shaped by family secrets and childhood memories in Kerala. Roy explores caste, social rules, forbidden love, and the lasting consequences of choices through a nonlinear narrative and distinctive language.</p>
      <h2>6. A Suitable Boy — Vikram Seth</h2><p><em>English · Social and historical fiction</em></p><p>Lata Mehra's family seeks a suitable husband for her in post-independence India. The story expands into a wide portrait of families, politics, religion, education, and social change, examining the tension between personal freedom and family expectations.</p>
      <h2>7. Midnight's Children — Salman Rushdie</h2><p><em>English · Historical fiction and magical realism</em></p><p>Saleem Sinai is born at the moment India becomes independent, and his extraordinary life becomes intertwined with the nation's transformations. Rushdie blends family history, fantasy, humour, and history to explore identity, memory, and belonging.</p>
      <h2>8. The White Tiger — Aravind Adiga</h2><p><em>English · Social fiction</em></p><p>Balram Halwai's journey from poverty to entrepreneurship is marked by morally complicated decisions. Through his account, Adiga examines class divisions, ambition, corruption, opportunity, and the price of success in an unequal society.</p>
      <h2>9. Gitanjali — Rabindranath Tagore</h2><p><em>Bengali; also widely read in English translation · Poetry</em></p><p>This celebrated collection reflects on spirituality, nature, love, humility, and the search for meaning. Tagore's lyrical writing finds significance in ordinary experiences as well as moments of contemplation, making the collection a rewarding choice for readers drawn to poetry.</p>
      <h2>10. Pather Panchali — Bibhutibhushan Bandyopadhyay</h2><p><em>Bengali · Literary fiction</em></p><p>Through Apu, his sister Durga, and their rural family, the novel portrays childhood, family bonds, poverty, nature, and the longing for a better future. Its sensitive storytelling finds both beauty and difficulty in the rhythms of everyday life.</p>
      <h2>11. Ghachar Ghochar — Vivek Shanbhag</h2><p><em>Kannada; available in English translation · Contemporary fiction</em></p><p>A family's circumstances change after its financial fortunes improve. Shanbhag's compact, unsettling narrative examines money, power, dependency, loyalty, and the moral compromises that can accompany newfound prosperity.</p>
      <h2>12. Samskara — U. R. Ananthamurthy</h2><p><em>Kannada; available in English translation · Philosophical fiction</em></p><p>A traditional Brahmin community faces a death that challenges its customs. A respected scholar must confront difficult questions about ritual, morality, authority, and belief. The novel examines the tension between inherited traditions and individual conscience.</p>
      <h2>13. Chemmeen — Thakazhi Sivasankara Pillai</h2><p><em>Malayalam; available in English translation · Literary fiction</em></p><p>Set in Kerala's coastal fishing community, <i>Chemmeen</i> explores love, livelihood, belief, and social expectations. The lives and traditions of fishing families become a setting for examining devotion, desire, and the consequences of breaking community conventions.</p>
      <h2>14. Randamoozham — M. T. Vasudevan Nair</h2><p><em>Malayalam; translations available · Mythological fiction</em></p><p>This retelling of the Mahabharata centres on Bhima, often overshadowed by other heroes. Nair presents epic conflicts through a human and psychological lens, exploring recognition, family, loyalty, ambition, and the burden of expectations.</p>
      <h2>15. Yayati — V. S. Khandekar</h2><p><em>Marathi; available in English translation · Mythological fiction</em></p><p>Reimagining a story from Indian mythology, Khandekar explores desire, responsibility, ambition, and the pursuit of pleasure. The novel considers what happens when personal desires dominate choices and relationships.</p>
      <h2>16. Mrityunjaya — Shivaji Sawant</h2><p><em>Marathi; available in English translation · Mythological fiction</em></p><p>This retelling of the Mahabharata through Karna's life examines identity, loyalty, belonging, and the struggle for recognition. It invites readers to reconsider heroism, fate, social status, and honour.</p>
      <h2>17. Ponniyin Selvan — Kalki Krishnamurthy</h2><p><em>Tamil; available in English translation · Historical fiction</em></p><p>Set in the Chola period, this expansive historical novel follows political intrigue, royal ambitions, shifting loyalties, and personal relationships. Kalki blends historical atmosphere with adventure, suspense, and memorable characters.</p>
      <h2>18. Sivagamiyin Sabatham — Kalki Krishnamurthy</h2><p><em>Tamil; translations available · Historical fiction</em></p><p>This novel explores the Pallava world through love, artistic ambition, political conflict, and war. It combines historical settings with dramatic relationships and personal vows, appealing to readers who enjoy cultural heritage and sweeping narratives.</p>
      <h2>19. Veyi Padagalu — Viswanatha Satyanarayana</h2><p><em>Telugu · Social and philosophical fiction</em></p><p>This major Telugu novel presents a community undergoing social and cultural change. It examines traditional beliefs, village life, cultural identity, and the challenges of changing times. Readers should check editions and translations for the format best suited to them.</p>
      <h2>20. Kanyasulkam — Gurajada Apparao</h2><p><em>Telugu; available in translation · Social satire and drama</em></p><p>This landmark play uses wit and sharp dialogue to satirise social hypocrisy, exploitation, and the treatment of women. Apparao challenges customs that place status and personal gain above human dignity.</p>
      <h2>21. Saraswatichandra — Govardhanram Tripathi</h2><p><em>Gujarati; translations available · Literary and social fiction</em></p><p>A thoughtful young man finds his ideals and relationships in conflict with family expectations and social conventions. Tripathi explores love, duty, morality, reform, and the complexity of life in nineteenth-century Gujarat.</p>
      <h2>22. Pinjar — Amrita Pritam</h2><p><em>Punjabi; available in English translation · Historical fiction</em></p><p>Puro's life is transformed by the violence and upheaval surrounding Partition. Pritam explores displacement, gender, identity, trauma, and the struggle to preserve humanity under circumstances shaped by hatred and fear.</p>
      <h2>23. The Discovery of India — Jawaharlal Nehru</h2><p><em>English · History and cultural reflection</em></p><p>Written during imprisonment, this book explores India's history, philosophical traditions, religions, cultural exchanges, and intellectual development. It offers a historical perspective on the influences that shaped India's civilisation and modern national identity.</p>
      <h2>24. The Argumentative Indian — Amartya Sen</h2><p><em>English · Essays and social thought</em></p><p>Sen examines India's traditions of debate, reasoning, pluralism, and intellectual exchange. Drawing on history, philosophy, politics, and culture, the essays consider how disagreement and discussion have shaped Indian society.</p>
      <h2>25. The Complete Works of Swami Vivekananda — Swami Vivekananda</h2><p><em>English and translations · Philosophy and spiritual writing</em></p><p>This collection brings together speeches, lectures, and reflections on spirituality, education, service, human potential, and Indian philosophical traditions. It invites readers to explore ideas about discipline, social responsibility, self-knowledge, and practical life.</p>

      <h2>Discover Your Next Indian Read</h2>
      <p>Indian literature is not one tradition but a meeting point of many languages, histories, philosophies, and ways of seeing the world. A village story in Bengali, a historical epic in Tamil, a social novel in Hindi, and a contemporary family drama in Kannada can each offer a different understanding of people and society.</p>
      <p>This list is only a starting point. Continue exploring Indian poetry, regional classics, translated novels, mythology, biographies, children's literature, and contemporary writing. Reading beyond familiar languages can introduce us to authors and perspectives we might otherwise never encounter.</p>
      <p>At Sahadhyayi, the journey does not have to end with finding a book. Explore the library, discover authors, keep track of your reading, and connect with people who share your interests. Every book can become the beginning of a new conversation, a new perspective, or a lasting reading habit.</p>
      <p><strong>Discover Indian literature. Find your next favourite book. Read together with Sahadhyayi.</strong></p>
    `
  }
};

const BlogPost = () => {
  const { slug } = useParams();
  const post = blogPosts[slug as keyof typeof blogPosts];

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Link to="/blog"><Button>Back to Blog</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${post.title} | Sahadhyayi Blog`}
        description={post.description}
        canonical={`https://sahadhyayi.com/blog/${slug}`}
        keywords={['Indian books to read', 'Indian literature', 'regional Indian literature', 'Sahadhyayi', 'book recommendations']}
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/blog"><Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Button></Link>
          <article>
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <img src={post.image} alt={post.title} loading="lazy" className="w-full h-64 object-cover rounded-lg mb-6" />
                <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{post.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mt-4">
                  <div className="flex items-center gap-1"><User className="w-4 h-4" />{post.author}</div>
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(post.date).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.readTime}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-blockquote:border-orange-300 prose-blockquote:bg-orange-50 prose-blockquote:p-4 prose-blockquote:rounded-lg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
              </CardContent>
            </Card>
          </article>
          <Card className="mt-8 bg-gradient-to-r from-orange-600 to-red-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Join Sahadhyayi?</h3>
              <p className="text-lg mb-6 opacity-90">Discover books and share your reading journey with a community of fellow readers.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup"><Button size="lg" variant="secondary" className="px-8 py-3">Join Sahadhyayi Today</Button></Link>
                <Link to="/library"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3">Explore Our Library</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
