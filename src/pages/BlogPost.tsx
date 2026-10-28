
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import SEO from '@/components/SEO';
import DOMPurify from 'dompurify';

const BlogPost = () => {
  const { slug } = useParams();

  const blogPosts = {
    'what-is-sahadhyayi-meaning-story': {
      title: 'What is Sahadhyayi? Meaning & Story Behind Our Name',
      content: `
        <h2>The Deep Meaning of Sahadhyayi</h2>
        <p>Sahadhyayi (सहाध्यायी) is a beautiful Sanskrit word that means "fellow reader" or "study companion." The word comes from two parts: "saha" meaning "together" and "adhyayi" meaning "one who reads or studies." At Sahadhyayi, we believe that reading is not just a solitary activity but a shared journey of discovery and growth.</p>

        <h3>Why We Chose the Name Sahadhyayi</h3>
        <p>When we were building our digital reading community, we wanted a name that captured the essence of what we stand for. Sahadhyayi perfectly embodies our mission - to create a platform where readers come together, share insights, and grow intellectually as companions on the reading journey.</p>

        <p>In ancient Indian tradition, a Sahadhyayi was someone who studied alongside you, shared knowledge, and helped deepen your understanding. This is exactly what our platform aims to be - your digital reading companion that connects you with fellow book lovers, authors, and a wealth of literary resources.</p>

        <h3>The Sahadhyayi Philosophy</h3>
        <p>At Sahadhyayi, we believe that:</p>
        <ul>
          <li><strong>Reading is better together:</strong> When we share our reading experiences with others, we gain new perspectives and deeper insights.</li>
          <li><strong>Every reader has something to offer:</strong> Whether you're a seasoned bibliophile or just starting your reading journey, your voice matters in our community.</li>
          <li><strong>Deep reading transforms lives:</strong> In our age of digital distractions, Sahadhyayi promotes focused, immersive reading that builds concentration and critical thinking.</li>
          <li><strong>Knowledge should be accessible:</strong> Our platform makes quality books and reading resources available to everyone, breaking down barriers to education and enlightenment.</li>
        </ul>

        <h3>How Sahadhyayi is Building the Future of Reading</h3>
        <p>Today's Sahadhyayi platform combines the ancient wisdom of collaborative learning with modern technology. We provide:</p>
        <ul>
          <li>A comprehensive digital library with thousands of books</li>
          <li>Reading communities where you can discuss your favorite titles</li>
          <li>Direct connections with authors and literary experts</li>
          <li>AI-powered reading assistance to enhance comprehension</li>
          <li>Tools to track your reading progress and build lasting habits</li>
        </ul>

        <p>When you join Sahadhyayi, you're not just signing up for another reading app - you're becoming part of a movement to revive the transformative power of deep reading in our digital age.</p>

        <h3>Join the Sahadhyayi Community Today</h3>
        <p>Ready to experience what it means to be a true Sahadhyayi? Join thousands of readers who have already discovered the joy of reading together. Whether you're looking to explore new genres, connect with like-minded readers, or simply rediscover your love for books, Sahadhyayi welcomes you to our growing community of fellow readers.</p>
      `,
      author: 'Himanshu Gupta',
      date: '2024-07-14',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop'
    },
    'how-sahadhyayi-revives-reading-culture': {
      title: 'How Sahadhyayi Revives the Reading Culture',
      content: `
        <h2>The Reading Crisis in Our Digital Age</h2>
        <p>We live in an era where attention spans are shrinking, and deep reading is becoming a lost art. Social media, short-form videos, and endless digital distractions have fundamentally changed how we consume information. But at Sahadhyayi, we believe it's time to reclaim the transformative power of focused, immersive reading.</p>

        <h3>Sahadhyayi's Mission: Bringing Back Deep Reading</h3>
        <p>Sahadhyayi is more than just a digital library - it's a movement to revive reading culture in the 21st century. Our platform addresses the modern challenges that prevent people from developing strong reading habits:</p>

        <h4>1. Community-Driven Reading Experience</h4>
        <p>Reading doesn't have to be a lonely activity. Sahadhyayi connects you with fellow readers who share your interests, creating vibrant book communities where you can discuss ideas, share insights, and discover new perspectives. When you're part of a reading community, you're more likely to stick to your reading goals and explore books you might never have considered.</p>

        <h4>2. Making Quality Literature Accessible</h4>
        <p>One of the biggest barriers to reading is access to quality books. Sahadhyayi breaks down these barriers by providing a comprehensive digital library with thousands of titles across all genres. From classic literature to contemporary fiction, from self-help to academic texts, our platform ensures that everyone has access to the books they want to read.</p>

        <h4>3. Technology That Enhances, Not Distracts</h4>
        <p>Unlike social media platforms designed to fragment your attention, Sahadhyayi uses technology to enhance your reading experience. Our AI-powered reading assistant helps you understand complex passages, our progress tracking keeps you motivated, and our community features connect you with others who share your literary interests.</p>

        <h3>The Science Behind Sahadhyayi's Approach</h3>
        <p>Research shows that deep reading has profound benefits for cognitive development, emotional intelligence, and critical thinking skills. Studies indicate that people who read regularly have:</p>
        <ul>
          <li>Better focus and concentration abilities</li>
          <li>Enhanced empathy and emotional understanding</li>
          <li>Improved vocabulary and communication skills</li>
          <li>Stronger analytical and critical thinking capabilities</li>
          <li>Better stress management and mental health</li>
        </ul>

        <p>Sahadhyayi is designed to maximize these benefits by creating an environment that encourages sustained, focused reading.</p>

        <h3>Real Stories: How Sahadhyayi is Changing Lives</h3>
        <p>Members of the Sahadhyayi community regularly share how the platform has transformed their reading habits:</p>
        
        <blockquote>
          <p>"I used to struggle to finish even one book a month. Since joining Sahadhyayi, I'm reading 2-3 books monthly and actually enjoying the process. The community discussions help me understand books on a deeper level." - Sarah, Teacher from Mumbai</p>
        </blockquote>

        <blockquote>
          <p>"As a working professional, I thought I had no time for reading. Sahadhyayi's reading groups motivated me to make time, and now reading is my favorite way to unwind after work." - Raj, Software Engineer from Bangalore</p>
        </blockquote>

        <h3>Building Reading Habits That Last</h3>
        <p>Sahadhyayi doesn't just help you read more books - it helps you build sustainable reading habits that last a lifetime. Our platform provides:</p>
        <ul>
          <li><strong>Personalized reading recommendations</strong> based on your interests and reading history</li>
          <li><strong>Goal setting and progress tracking</strong> to keep you motivated</li>
          <li><strong>Reading challenges and community events</strong> that make reading social and fun</li>
          <li><strong>Author interactions</strong> that deepen your connection to the books you love</li>
        </ul>

        <h3>The Future of Reading is Here</h3>
        <p>Sahadhyayi represents the future of reading culture - one where technology serves literature, where community enhances individual growth, and where the ancient joy of reading is preserved and celebrated in our modern world.</p>

        <p>Join Sahadhyayi today and be part of the movement to revive reading culture. Together, we can ensure that the transformative power of books continues to enrich lives for generations to come.</p>
      `,
      author: 'Himanshu Gupta',
      date: '2024-07-14',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
    },
    'why-book-lovers-should-join-sahadhyayi': {
      title: '5 Reasons Why Book Lovers Should Join Sahadhyayi',
      content: `
        <h2>Discover Why Sahadhyayi is Every Book Lover's Dream Platform</h2>
        <p>If you're passionate about books, you've probably wondered: "Where can I find a community that truly understands my love for reading?" The answer is Sahadhyayi - the digital reading community that's revolutionizing how book lovers connect, discover, and experience literature.</p>

        <h3>1. Connect with a Global Community of Fellow Book Enthusiasts</h3>
        <p>At Sahadhyayi, you'll never feel alone in your reading journey. Our platform brings together book lovers from around the world, creating vibrant communities around every genre and interest. Whether you're into classic literature, contemporary fiction, mystery novels, or academic texts, you'll find your tribe on Sahadhyayi.</p>

        <p><strong>What makes Sahadhyayi's community special:</strong></p>
        <ul>
          <li>Book-specific discussion groups where you can dive deep into your favorite titles</li>
          <li>Local reader discovery to find book lovers in your area</li>
          <li>Reading challenges that motivate you to explore new genres</li>
          <li>Mentorship opportunities with experienced readers and literary experts</li>
        </ul>

        <h3>2. Access Thousands of Books in Our Comprehensive Digital Library</h3>
        <p>Sahadhyayi offers one of the most extensive digital libraries available, with thousands of titles across all genres and languages. From timeless classics to the latest bestsellers, from academic research to casual reading, our library has something for every book lover.</p>

        <p><strong>Library highlights:</strong></p>
        <ul>
          <li>Curated collections by literary experts and community members</li>
          <li>Advanced search and recommendation algorithms</li>
          <li>Multi-language support including Hindi, English, and regional languages</li>
          <li>Regular additions of new titles and exclusive content</li>
        </ul>

        <h3>3. Get Direct Access to Your Favorite Authors</h3>
        <p>One of Sahadhyayi's most exciting features is the ability to connect directly with authors. Through our Author Connect program, you can participate in live Q&A sessions, attend virtual book launches, and even schedule one-on-one conversations with writers you admire.</p>

        <p><strong>Author interaction opportunities:</strong></p>
        <ul>
          <li>Monthly author spotlight events and interviews</li>
          <li>Exclusive behind-the-scenes content from your favorite writers</li>
          <li>Early access to new book releases and exclusive excerpts</li>
          <li>Writing workshops and masterclasses led by published authors</li>
        </ul>

        <h3>4. Enhance Your Reading with AI-Powered Tools</h3>
        <p>Sahadhyayi combines the best of technology with the timeless joy of reading. Our AI-powered reading assistant helps you get more out of every book, while our smart recommendation engine introduces you to titles you'll love.</p>

        <p><strong>Smart reading features:</strong></p>
        <ul>
          <li>Instant explanations for complex passages or unfamiliar concepts</li>
          <li>Personalized reading recommendations based on your preferences</li>
          <li>Reading progress tracking and goal setting tools</li>
          <li>Smart bookmarking and note-taking capabilities</li>
        </ul>

        <h3>5. Build Lasting Reading Habits That Transform Your Life</h3>
        <p>Sahadhyayi isn't just about reading more books - it's about developing a deeper, more meaningful relationship with literature. Our platform provides the structure, community support, and motivation you need to build reading habits that last a lifetime.</p>

        <p><strong>Habit-building features:</strong></p>
        <ul>
          <li>Customizable reading goals and milestone celebrations</li>
          <li>Community accountability through reading groups and challenges</li>
          <li>Progress analytics that show your reading journey over time</li>
          <li>Reward systems that recognize your achievements and contributions</li>
        </ul>

        <h3>The Sahadhyayi Difference: More Than Just a Reading App</h3>
        <p>What sets Sahadhyayi apart from other reading platforms is our commitment to building a true community of fellow readers (which is exactly what "Sahadhyayi" means in Sanskrit). We're not just providing access to books - we're creating a space where the love of reading can flourish and grow.</p>

        <h4>Join Thousands of Satisfied Readers</h4>
        <p>Don't just take our word for it - here's what Sahadhyayi members are saying:</p>

        <blockquote>
          <p>"Sahadhyayi has completely transformed my reading experience. I've discovered amazing books I never would have found on my own, and the community discussions add so much depth to my understanding." - Priya, Book Blogger</p>
        </blockquote>

        <blockquote>
          <p>"The author events on Sahadhyayi are incredible. I've had conversations with writers I've admired for years, and it's made me appreciate their work on a whole new level." - David, Literature Professor</p>
        </blockquote>

        <h3>Ready to Join the Sahadhyayi Community?</h3>
        <p>If you're a book lover looking for a platform that truly understands your passion for reading, Sahadhyayi is waiting for you. Join our community of fellow readers today and discover what it means to be part of something bigger than just individual reading.</p>

        <p>Sign up for Sahadhyayi now and start your journey with thousands of books, hundreds of reading communities, and countless opportunities to connect with fellow book enthusiasts around the world.</p>

        <p><strong>Because at Sahadhyayi, reading is better together.</strong></p>
      `,
      author: 'Himanshu Gupta',
      date: '2024-07-14',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=400&fit=crop'
    },
    'best-indian-books-to-read': {
    title: '25 Best Indian Books to Read: Classics, Novels & Regional Literature',
    description: 'Discover 25 remarkable Indian books across English and Indian-language literary traditions, including classics, regional fiction, mythology, and social thought.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=630&fit=crop',
    content: `
      <p>Indian literature is filled with unforgettable stories, timeless wisdom, powerful characters, and reflections on the experiences that shape our lives. From ancient epics and philosophical writing to modern novels and regional literary masterpieces, Indian books offer a window into the country's diverse cultures, languages, traditions, and changing society.</p>
      <p>This collection brings together 25 remarkable Indian books for readers who want to explore that richness. It includes classics, social novels, mythology, historical fiction, poetry, and influential nonfiction. This is a curated starting point rather than an official ranking. Some titles were written in English; others can be explored in translations, depending on the edition available.</p>
      <h2>1. Godan — Munshi Premchand</h2><p><em>Hindi · Social fiction</em></p><p><i>Godan</i> follows Hori, a poor farmer whose dream of owning a cow reflects his desire for dignity and security. Through Hori and his family, Premchand examines rural poverty, debt, caste, exploitation, and social inequality.</p>
      <h2>2. Malgudi Days — R. K. Narayan</h2><p><em>English · Short stories</em></p><p>Set in the fictional South Indian town of Malgudi, these stories follow schoolchildren, shopkeepers, families, and ordinary people facing unexpected situations. Narayan combines gentle humour with careful observation of everyday life.</p>
      <h2>3. The Guide — R. K. Narayan</h2><p><em>English · Literary fiction</em></p><p>Raju's life changes through his relationship with Rosie, a woman pursuing her passion for dance. As his identity evolves, he navigates ambition, deception, public expectations, and spiritual responsibility.</p>
      <h2>4. Train to Pakistan — Khushwant Singh</h2><p><em>English · Historical fiction</em></p><p>Set in a village on the India–Pakistan border during Partition in 1947, this novel shows how political upheaval transforms ordinary lives. Singh explores friendship, communal tension, love, fear, and sacrifice.</p>
      <h2>5. The God of Small Things — Arundhati Roy</h2><p><em>English · Literary fiction</em></p><p>Fraternal twins Rahel and Estha are at the centre of a story shaped by family secrets and childhood memories in Kerala. Roy explores caste, social rules, forbidden love, and the lasting consequences of choices.</p>
      <h2>6. A Suitable Boy — Vikram Seth</h2><p><em>English · Social and historical fiction</em></p><p>Lata Mehra's family seeks a suitable husband for her in post-independence India. The story expands into a portrait of families, politics, religion, education, and social change.</p>
      <h2>7. Midnight's Children — Salman Rushdie</h2><p><em>English · Historical fiction and magical realism</em></p><p>Saleem Sinai is born at the moment India becomes independent, and his extraordinary life becomes intertwined with the nation's transformations. Rushdie blends family history, fantasy, humour, and history to explore identity and belonging.</p>
      <h2>8. The White Tiger — Aravind Adiga</h2><p><em>English · Social fiction</em></p><p>Balram Halwai's journey from poverty to entrepreneurship is marked by morally complicated decisions. Adiga examines class divisions, ambition, corruption, opportunity, and the price of success in an unequal society.</p>
      <h2>9. Gitanjali — Rabindranath Tagore</h2><p><em>Bengali; also widely read in English translation · Poetry</em></p><p>This celebrated collection reflects on spirituality, nature, love, humility, and the search for meaning. Tagore's lyrical writing finds significance in ordinary experiences and moments of contemplation.</p>
      <h2>10. Pather Panchali — Bibhutibhushan Bandyopadhyay</h2><p><em>Bengali · Literary fiction</em></p><p>Through Apu, his sister Durga, and their rural family, the novel portrays childhood, family bonds, poverty, nature, and the longing for a better future.</p>
      <h2>11. Ghachar Ghochar — Vivek Shanbhag</h2><p><em>Kannada; available in English translation · Contemporary fiction</em></p><p>A family's circumstances change after its financial fortunes improve. Shanbhag examines money, power, dependency, loyalty, and the moral compromises that can accompany prosperity.</p>
      <h2>12. Samskara — U. R. Ananthamurthy</h2><p><em>Kannada; available in English translation · Philosophical fiction</em></p><p>A traditional Brahmin community faces a death that challenges its customs. A respected scholar confronts questions about ritual, morality, authority, and belief.</p>
      <h2>13. Chemmeen — Thakazhi Sivasankara Pillai</h2><p><em>Malayalam; available in English translation · Literary fiction</em></p><p>Set in Kerala's coastal fishing community, <i>Chemmeen</i> explores love, livelihood, belief, social expectations, and the consequences of breaking community conventions.</p>
      <h2>14. Randamoozham — M. T. Vasudevan Nair</h2><p><em>Malayalam; translations available · Mythological fiction</em></p><p>This retelling of the Mahabharata centres on Bhima. Nair presents epic conflicts through a human and psychological lens, exploring recognition, family, loyalty, ambition, and expectations.</p>
      <h2>15. Yayati — V. S. Khandekar</h2><p><em>Marathi; available in English translation · Mythological fiction</em></p><p>Reimagining a story from Indian mythology, Khandekar explores desire, responsibility, ambition, and the pursuit of pleasure.</p>
      <h2>16. Mrityunjaya — Shivaji Sawant</h2><p><em>Marathi; available in English translation · Mythological fiction</em></p><p>This retelling of the Mahabharata through Karna's life examines identity, loyalty, belonging, and the struggle for recognition.</p>
      <h2>17. Ponniyin Selvan — Kalki Krishnamurthy</h2><p><em>Tamil; available in English translation · Historical fiction</em></p><p>Set in the Chola period, this expansive historical novel follows political intrigue, royal ambitions, shifting loyalties, and personal relationships.</p>
      <h2>18. Sivagamiyin Sabatham — Kalki Krishnamurthy</h2><p><em>Tamil; translations available · Historical fiction</em></p><p>This novel explores the Pallava world through love, artistic ambition, political conflict, and war.</p>
      <h2>19. Veyi Padagalu — Viswanatha Satyanarayana</h2><p><em>Telugu · Social and philosophical fiction</em></p><p>This major Telugu novel presents a community undergoing social and cultural change, examining traditional beliefs, village life, and cultural identity.</p>
      <h2>20. Kanyasulkam — Gurajada Apparao</h2><p><em>Telugu; available in translation · Social satire and drama</em></p><p>This landmark play uses wit and sharp dialogue to satirise social hypocrisy, exploitation, and the treatment of women.</p>
      <h2>21. Saraswatichandra — Govardhanram Tripathi</h2><p><em>Gujarati; translations available · Literary and social fiction</em></p><p>A thoughtful young man finds his ideals and relationships in conflict with family expectations and social conventions. The novel explores love, duty, morality, and reform.</p>
      <h2>22. Pinjar — Amrita Pritam</h2><p><em>Punjabi; available in English translation · Historical fiction</em></p><p>Puro's life is transformed by violence and upheaval surrounding Partition. Pritam explores displacement, gender, identity, trauma, and the struggle to preserve humanity.</p>
      <h2>23. The Discovery of India — Jawaharlal Nehru</h2><p><em>English · History and cultural reflection</em></p><p>Written during imprisonment, this book explores India's history, philosophical traditions, religions, cultural exchanges, and intellectual development.</p>
      <h2>24. The Argumentative Indian — Amartya Sen</h2><p><em>English · Essays and social thought</em></p><p>Sen examines India's traditions of debate, reasoning, pluralism, and intellectual exchange, considering how discussion and disagreement have shaped society.</p>
      <h2>25. The Complete Works of Swami Vivekananda — Swami Vivekananda</h2><p><em>English and translations · Philosophy and spiritual writing</em></p><p>This collection brings together speeches, lectures, and reflections on spirituality, education, service, human potential, and Indian philosophical traditions.</p>
      <h2>Discover Your Next Indian Read</h2><p>Indian literature is a meeting point of many languages, histories, philosophies, and ways of seeing the world. A village story in Bengali, a historical epic in Tamil, a social novel in Hindi, and a contemporary family drama in Kannada can each offer a different understanding of people and society.</p>
      <p>Continue exploring Indian poetry, regional classics, translated novels, mythology, biographies, children's literature, and contemporary writing. Reading beyond familiar languages can introduce us to authors and perspectives we might otherwise never encounter.</p>
      <p>At Sahadhyayi, explore the library, discover authors, keep track of your reading, and connect with people who share your interests. Every book can become the beginning of a new conversation, a new perspective, or a lasting reading habit.</p>
      <p><strong>Discover Indian literature. Find your next favourite book. Read together with Sahadhyayi.</strong></p>
    `
  }
  };

  const post = blogPosts[slug as keyof typeof blogPosts];

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
        description={slug === 'best-indian-books-to-read' ? 'Discover 25 remarkable Indian books across English and Indian-language literary traditions, including classics, regional fiction, mythology, and social thought.' : post.content.substring(0, 160)}
        canonical={`https://sahadhyayi.com/blog/${slug}`}
        keywords={slug === 'best-indian-books-to-read' ? ['Indian books to read', 'Indian literature', 'regional Indian literature', 'Sahadhyayi', 'book recommendations'] : ['Sahadhyayi', 'reading community', 'digital library', 'book lovers']}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link to="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article */}
          <article>
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
                <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-gray-600 mt-4">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-blockquote:border-orange-300 prose-blockquote:bg-orange-50 prose-blockquote:p-4 prose-blockquote:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                />
              </CardContent>
            </Card>
          </article>

          {/* Call to Action */}
          <Card className="mt-8 bg-gradient-to-r from-orange-600 to-red-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Join Sahadhyayi?</h3>
              <p className="text-lg mb-6 opacity-90">
                Experience the joy of reading with our global community of book lovers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" variant="secondary" className="px-8 py-3">
                    Join Sahadhyayi Today
                  </Button>
                </Link>
                <Link to="/library">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3">
                    Explore Our Library
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
