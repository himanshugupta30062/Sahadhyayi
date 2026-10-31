
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { toSeoDescription } from '@/utils/seoText';
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
    'build-a-reading-habit-that-lasts': {
      title: 'How to Build a Reading Habit That Actually Lasts',
      description: 'A practical, pressure-free guide to reading more consistently with small goals, better book choices, and simple routines.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=630&fit=crop',
      content: `
        <p>You do not need to finish a book every week to become a reader. A lasting reading habit is built through small, repeatable moments—not ambitious goals that make reading feel like another task. If you often buy books but struggle to finish them, the answer may be to make reading easier to begin.</p>
        <h2>1. Start Smaller Than You Think</h2>
        <p>Choose a target you can keep on a difficult day: five pages, ten minutes, or one short story. The purpose at first is not speed; it is repetition. Once the routine feels natural, you can increase the time if you want to.</p>
        <h2>2. Attach Reading to an Existing Routine</h2>
        <p>Habits are easier to remember when they have a reliable cue. Read after breakfast, during your commute if it is safe and practical, or for ten minutes before bed. Keep the book or reading device where you usually spend that time, and make starting as frictionless as possible.</p>
        <h2>3. Choose Books You Genuinely Want to Read</h2>
        <p>Do not choose a book only because it is famous, difficult, or recommended by someone else. Follow your curiosity. If you love mysteries, begin there. If you want to explore history, pick an accessible introduction. Interest gives you a reason to return to the page.</p>
        <h2>4. Give Yourself Permission to Stop a Book</h2>
        <p>Not every book will fit your mood, experience, or needs. Try a reasonable sample, then decide whether to continue. Putting a book aside is not failure; it is how you learn what holds your attention. You can always return to it later.</p>
        <h2>5. Make Progress Visible</h2>
        <p>Use a bookmark, a reading log, or a simple note with the date and page number. Record a sentence you liked or one idea you want to remember. Visible progress helps you notice that small reading sessions are adding up.</p>
        <h2>6. Reduce Friction and Distractions</h2>
        <p>Keep your current book easy to reach. Silence notifications for a short reading session and decide in advance where you will stop. If long sessions are difficult, try two ten-minute sessions rather than waiting for a free hour that may never arrive.</p>
        <h2>7. Find Accountability Without Turning Reading into Pressure</h2>
        <p>Share what you are reading with a friend, join a reading group, or discuss a chapter with other readers. A community can introduce new perspectives and make reading more enjoyable. Keep the goal personal: your pace does not have to match anyone else's.</p>
        <h2>A Simple Seven-Day Reset</h2>
        <ul><li><strong>Day 1:</strong> Pick one book you are excited to open.</li><li><strong>Day 2:</strong> Read for five to ten minutes at a set time.</li><li><strong>Day 3:</strong> Put the book somewhere visible.</li><li><strong>Day 4:</strong> Note one interesting idea or line.</li><li><strong>Day 5:</strong> Try a short session without notifications.</li><li><strong>Day 6:</strong> Tell someone what you are reading.</li><li><strong>Day 7:</strong> Reflect on what made reading easy or difficult, then adjust the plan.</li></ul>
        <h2>Make Reading a Welcome Part of Your Day</h2>
        <p>The best reading routine is one you can return to. Some days you will read several chapters; other days, a page may be enough. Consistency grows when you make room for real life instead of treating every missed session as a broken promise.</p>
        <p>At Sahadhyayi, discover books, keep your reading journey moving, and find fellow readers who can share recommendations and ideas. Start small, stay curious, and let the habit grow at your own pace.</p>
      `
    },
    'how-to-start-a-book-club': {
      title: 'How to Start a Book Club: A Practical Guide for Readers',
      description: 'Learn how to choose a book club format, invite members, select books together, and host discussions that welcome different perspectives.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1521583641526-6ce8a8b8e2c5?w=1200&h=630&fit=crop',
      content: `
        <p>A good book club is not a literature exam. It is a welcoming space where people can share what they noticed, ask honest questions, and discover interpretations they may not have reached alone. You can start one with a few friends, colleagues, neighbours, or readers you meet online.</p>
        <h2>1. Decide What Kind of Book Club You Want</h2>
        <p>Start with a simple purpose. Will you read fiction, nonfiction, Indian literature, a particular genre, or whatever members are curious about? You might meet in person, online, or alternate between both. A clear starting point helps people understand what they are joining, but leave room for the club to evolve.</p>
        <h2>2. Begin with a Small, Reliable Group</h2>
        <p>Three to eight members can be enough for a lively first meeting. Invite people who are interested in exchanging ideas, not necessarily people who read at the same speed. Make it clear that beginners and occasional readers are welcome. A smaller group that meets consistently is often easier to sustain than a large group with no rhythm.</p>
        <h2>3. Agree on a Realistic Schedule</h2>
        <p>Monthly meetings give many readers enough time to finish a book without rushing. Choose a predictable day and duration, such as the first Saturday of each month for an hour. For longer books, discuss selected sections or allow members to join even if they have not finished.</p>
        <h2>4. Choose the First Book Together</h2>
        <p>Offer two or three options and let members vote. Consider length, availability, reading difficulty, and whether people can access the book in a language or format that works for them. For your first selection, a short novel, essay collection, or set of stories can make the commitment feel manageable.</p>
        <h2>5. Make Discussion Easy to Join</h2>
        <p>Prepare a few open questions, but do not turn the meeting into a quiz. Try prompts such as:</p>
        <ul><li>Which moment or idea stayed with you?</li><li>Did your opinion of a character change?</li><li>What felt familiar, surprising, or difficult?</li><li>Was there a passage you would like to discuss?</li><li>Would you recommend this book to someone else—and why?</li></ul>
        <h2>6. Create Space for Different Opinions</h2>
        <p>Members do not need to agree on a book. Set a friendly norm: critique ideas, not people; let everyone finish speaking; and make room for quieter voices. A thoughtful disagreement can be one of the most valuable parts of the meeting.</p>
        <h2>7. Keep the Format Simple</h2>
        <p>A practical one-hour meeting might include ten minutes to catch up, thirty-five minutes of discussion, ten minutes to choose the next book, and five minutes for closing thoughts. Rotate the facilitator if the group wants to share responsibility. You can add snacks, themes, or author events later—none is required to begin.</p>
        <h2>What If Members Do Not Finish the Book?</h2>
        <p>It happens. Avoid making completion a test of belonging. You can hold a spoiler-free opening discussion, focus on the sections members have read, or occasionally choose shorter works. Ask whether the book length or schedule is working and adjust rather than blaming people for being busy.</p>
        <h2>Help the Community Grow Naturally</h2>
        <p>After a few meetings, ask members what they enjoy and what they would change. Keep a shared list of past and future reads, invite suggestions, and welcome new members with a short explanation of how the club works. A club becomes sustainable when members feel they help shape it.</p>
        <p>Reading together turns individual reactions into a shared discovery. Start with one book, one date, and a few curious people. Sahadhyayi can be a place to explore books and connect with readers who want to keep the conversation going.</p>
      `
    },
    'how-to-read-classic-literature': {
      title: 'A Beginner’s Guide to Reading Classic Literature',
      description: 'Discover how to approach classic books without intimidation, understand unfamiliar contexts, and enjoy older literature at your own pace.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=630&fit=crop',
      content: `
        <p>Classic literature can feel intimidating before you even open the book. The language may seem unfamiliar, the social world may be distant from your own, and the book's reputation can make it feel as though there is a correct interpretation you are expected to discover. You do not need specialist knowledge to begin. Curiosity and patience are enough.</p>
        <h2>What Makes a Book a Classic?</h2>
        <p>There is no single definition. Some books remain in conversation because they capture a period of history; others ask questions about love, power, family, identity, justice, or human nature that readers continue to debate. A book can be important and still not be the right book for you at this moment.</p>
        <h2>1. Start with a Story That Interests You</h2>
        <p>Choose a classic by theme rather than reputation alone. Interested in ambition? Look for a story about power and choices. Curious about society and inequality? Try a social novel. Prefer shorter reading sessions? Begin with short stories, essays, or a novella. You can work toward longer or more demanding books over time.</p>
        <h2>2. Pick a Readable Edition or Translation</h2>
        <p>For older works, editions may differ in notes, introductions, spelling, and translation style. A clear modern translation can be a helpful entry point. If you are reading a work originally written in another language, remember that every translation involves choices; a different edition may create a different reading experience.</p>
        <h2>3. Learn Just Enough Context</h2>
        <p>A short introduction can explain the historical setting, social customs, or literary conventions that shape a story. Keep the research focused. You do not need to master an entire era before reading; look up unfamiliar references when they affect your understanding, and return to the story.</p>
        <h2>4. Read for Questions, Not Just Answers</h2>
        <p>Instead of trying to decode every sentence, notice what the book makes you wonder. Why does a character make a particular choice? Whose perspective is missing? What does the story seem to value or criticise? How does the setting influence the characters? These questions make older texts feel active rather than distant.</p>
        <h2>5. Use Notes Sparingly</h2>
        <p>You do not need to annotate every page. Mark a passage that surprises you, jot down a character's name, or write one question at the end of a chapter. If a paragraph is confusing, continue for a little while; the meaning may become clearer with context. Re-reading a key passage is useful, but constant stopping can interrupt the story.</p>
        <h2>6. Do Not Worry About Understanding Everything</h2>
        <p>Even experienced readers miss references or disagree about meaning. It is fine to use a guide after reading a chapter, discuss the book with others, or leave some questions open. Your response is part of the reading experience, not a test you must pass.</p>
        <h2>7. Talk About What You Read</h2>
        <p>Discussion can reveal how differently readers respond to the same character or scene. Ask a friend what they noticed, join a book group, or write a short reflection. You may discover that a passage you found confusing became meaningful when another reader shared their perspective.</p>
        <h2>A Gentle First-Book Plan</h2>
        <ul><li>Read a short introduction to understand the setting.</li><li>Set a modest daily or weekly reading target.</li><li>Keep a note of characters and questions, not every detail.</li><li>After each session, write one sentence about what stood out.</li><li>At the end, read a discussion or review and compare it with your own reaction.</li></ul>
        <h2>Let Classics Meet You Where You Are</h2>
        <p>You do not have to read classics in a fixed order or finish every famous title. Let your interests guide you, choose an edition that supports your reading, and give yourself permission to pause or try another book. The point is not to prove that you have read a classic; it is to find out what the work can offer you.</p>
        <p>Explore different authors and literary traditions, share your questions with fellow readers, and let each book lead naturally to the next. Reading becomes richer when it is a conversation rather than a checklist.</p>
      `
    },
    'best-indian-short-story-collections': {
      title: 'Indian Short Story Collections to Start Reading Today',
      description: 'Explore approachable short fiction from Indian literary traditions and learn how to choose stories that fit your time and interests.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=630&fit=crop',
      content: `
        <p>Short stories are a wonderful way to explore literature when your schedule is full or you want to sample an author's voice before committing to a long novel. A single story can introduce an entire world: a village, a family, a city street, or a moment when an ordinary life changes. Indian short fiction is especially rewarding because it spans many languages, regions, social experiences, and styles.</p>
        <p>Rather than treating this as a definitive ranking, use the authors and collections below as a starting map. Editions, translations, and collection titles can vary, so check the contents and translator information when choosing a copy.</p>
        <h2>1. Start with Rabindranath Tagore</h2>
        <p>Tagore's short fiction often explores family relationships, social expectations, dignity, and the inner lives of people whose feelings are not always visible to the world. His stories can be an accessible entry into Bengali literature in translation. Look for a collection that includes a range of his short stories, and notice how much emotional tension he can build through small everyday details.</p>
        <h2>2. Explore Munshi Premchand</h2>
        <p>Premchand is known for stories that examine rural life, poverty, social hierarchy, moral choices, and compassion. His characters often face decisions shaped by material pressures and unequal systems. Read a few stories in sequence and compare how he portrays responsibility, power, and the meaning of fairness in different circumstances.</p>
        <h2>3. Try Saadat Hasan Manto</h2>
        <p>Manto's writing can be direct, unsettling, and morally complex. Many stories confront the violence and contradictions of society, including the human consequences of Partition. These works can be emotionally demanding, so read at a pace that feels right and consider the historical context rather than treating the stories as simple shock narratives.</p>
        <h2>4. Read Ismat Chughtai</h2>
        <p>Chughtai's fiction is notable for its sharp attention to gender, class, domestic life, and the restrictions placed on women. Her characters can be funny, defiant, contradictory, and deeply human. When reading in translation, look for notes that explain period-specific expressions or cultural context without dictating how you should interpret the story.</p>
        <h2>5. Discover modern and regional voices</h2>
        <p>Indian short fiction is not limited to a few widely known authors. Explore translated stories from Malayalam, Tamil, Kannada, Marathi, Urdu, Assamese, Odia, and other literary traditions. Contemporary collections can introduce readers to changing cities, migration, work, family, identity, and environmental concerns. Anthologies organized by language or region are useful when you want to discover several writers at once.</p>
        <h2>How to Choose Your First Collection</h2>
        <ul><li><strong>Choose by mood:</strong> look for humour, social realism, mystery, family stories, or reflective fiction depending on what you enjoy.</li><li><strong>Check the translation:</strong> a clear translation can make a big difference to rhythm, humour, and tone.</li><li><strong>Sample before buying:</strong> read the opening story or a legitimate preview to see whether the style suits you.</li><li><strong>Try one story at a time:</strong> pause after each story and notice the image, question, or character that remains with you.</li><li><strong>Keep a small list:</strong> record authors or languages you would like to explore next.</li></ul>
        <h2>A Simple Way to Read Short Fiction</h2>
        <p>Read the story once without stopping to research every reference. Then take a minute to ask what changed, what the main character wanted, and what the ending made you reconsider. If a historical or cultural detail seems important, look it up afterward. This keeps the story's emotional movement intact while allowing you to learn more.</p>
        <h2>Let One Story Lead to Another</h2>
        <p>Short fiction makes literary exploration manageable. One story may lead you to an author's novel, a language tradition, a historical period, or a topic you want to understand more deeply. You do not have to read every famous writer to become familiar with Indian literature. Start with one story that interests you, and follow your curiosity from there.</p>
        <p>Explore books and authors on Sahadhyayi, share the stories that stayed with you, and discover how another reader's perspective can open up a familiar page in a new way.</p>
      `
    },
    'books-for-when-life-feels-stuck': {
      title: 'Books to Read When You Feel Stuck in Life',
      description: 'A thoughtful guide to choosing books for periods of uncertainty, change, low motivation, or the need for a fresh perspective.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=630&fit=crop',
      content: `
        <p>There are seasons when life feels repetitive or unclear. You may be deciding what to do next, recovering from a disappointment, questioning a familiar routine, or simply feeling short on energy. A book cannot solve every practical problem, but it can offer language for what you are experiencing, introduce a different point of view, or help you sit with a question long enough to understand it.</p>
        <p>The best choice depends on what you need. You do not have to turn reading into another self-improvement assignment; sometimes a story that gives you a little breathing room is exactly the right book.</p>
        <h2>If You Need a Fresh Perspective: Try Essays and Philosophy</h2>
        <p>Short essays and accessible philosophical writing can help you examine assumptions you have taken for granted. Choose a writer who asks clear questions about meaning, responsibility, attention, or how to live well. Read slowly and keep one question in mind rather than trying to agree with every argument.</p>
        <h2>If You Feel Overwhelmed: Choose Short Stories</h2>
        <p>A short story offers a complete reading experience without requiring a large time commitment. You can finish one in a sitting and return to daily life with a new character or idea to think about. Collections by writers such as Rabindranath Tagore, Munshi Premchand, Ismat Chughtai, or other authors you discover through translation can be a place to begin.</p>
        <h2>If You Are Facing Change: Read a Novel About Reinvention</h2>
        <p>Stories about migration, new beginnings, changing relationships, or people finding their place in unfamiliar circumstances can make transition feel less isolating. Look for characters who change gradually rather than waiting for one dramatic moment to fix everything. Their choices may help you identify which parts of your own situation you can influence.</p>
        <h2>If You Need Hope Without Empty Promises: Read Biography or Memoir</h2>
        <p>Life stories can show how people work through uncertainty, setbacks, and competing responsibilities. Prefer accounts that include difficulty and complexity, not only success stories polished in hindsight. A useful biography does not imply that everyone's path is the same; it gives you a closer look at one person's choices and circumstances.</p>
        <h2>If You Have Lost Motivation: Return to Curiosity</h2>
        <p>Choose a topic you genuinely wonder about—art, nature, science, history, language, or a place you have never visited. Curiosity can be a gentler starting point than demanding that every book make you more productive. A small discovery is still a meaningful reason to read.</p>
        <h2>If You Want Practical Ideas: Pick One Focused Guide</h2>
        <p>When you want advice, choose a book that addresses the specific challenge you are facing rather than a broad promise to transform your entire life. Read one chapter, identify one idea worth testing, and give yourself time to see whether it helps. You do not need to apply every suggestion or finish a book that is not useful to you.</p>
        <h2>How to Choose Without Overthinking</h2>
        <ul><li>Ask yourself whether you want comfort, perspective, inspiration, or practical steps.</li><li>Choose a manageable book length or a collection you can dip into.</li><li>Read a sample before committing.</li><li>Give the book a fair try, but stop if it feels like the wrong fit.</li><li>Write down one sentence or idea that you want to remember.</li></ul>
        <h2>Let Reading Support You, Not Pressure You</h2>
        <p>It is easy to turn reading into a list of things you should finish. If you are already tired, that can make books feel like more work. Set a small target, read when you can, and allow fiction, poetry, or a familiar favourite to count. You do not have to extract a lesson from every page.</p>
        <p>If feeling stuck is persistent or is making everyday life difficult, a book can be one source of reflection, but it does not have to be your only source of support. Talking with someone you trust or seeking professional guidance may also be helpful.</p>
        <h2>One Page Can Be a Beginning</h2>
        <p>You do not need to find the perfect book or finish it in a weekend. Choose something that meets you where you are today. Let it offer a question, a little company, or a new direction to explore. Sometimes that is enough to make the next step feel more possible.</p>
      `
    },
    'exploring-indian-literature-in-translation': {
      title: 'How to Explore Indian Literature Beyond English',
      description: 'A beginner-friendly path into India’s many literary languages through translations, anthologies, regional traditions, and reading groups.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=630&fit=crop',
      content: `
        <p>Indian literature is not a single shelf or a single tradition. It is a conversation across languages, regions, communities, centuries, and forms. Reading only in English can introduce you to wonderful work, but translated literature offers another route into stories and ideas that may otherwise remain outside your reading life.</p>
        <p>You do not need to know another language to begin. A thoughtful translation, a good anthology, and a little curiosity can open a path into a literary world you have not explored before.</p>
        <h2>1. Begin with a Language or Region That Interests You</h2>
        <p>Choose a starting point based on a place, family connection, historical period, or subject you want to understand. You might explore Bengali stories, Tamil historical fiction, Malayalam social novels, Marathi writing, Urdu poetry and fiction, Kannada literature, or works from Assamese, Odia, Punjabi, and other traditions. Treat this as a doorway, not a claim that one author represents an entire language.</p>
        <h2>2. Use Anthologies to Discover Multiple Writers</h2>
        <p>An anthology can introduce you to several voices without requiring you to commit to a full novel. Collections arranged by language, region, theme, or period let you compare styles and concerns. If one story captures your attention, follow the author into a larger collection or look for other writers included in the same volume.</p>
        <h2>3. Pay Attention to the Translator</h2>
        <p>Translation is a creative act as well as a linguistic one. A translator makes decisions about rhythm, idiom, humour, dialect, and cultural references. When possible, read the translator's introduction or notes. If a work feels difficult in one edition, another translation may make its voice more accessible.</p>
        <h2>4. Learn a Little Context, Not Everything</h2>
        <p>A short introduction to the author and period can clarify references to social customs, politics, religion, or historical events. You do not need to master the whole context before starting. Read first, note questions, and research only the details that meaningfully affect your understanding.</p>
        <h2>5. Read Across Genres</h2>
        <p>Do not limit your exploration to novels. Try short stories, poetry, plays, memoirs, children's literature, essays, and folk narratives. A poem may offer a different sense of a language's sound and imagery; a play can reveal how dialogue works; an essay can introduce a debate that shaped a period.</p>
        <h2>6. Avoid Treating One Book as the Whole Tradition</h2>
        <p>No single author or title can represent a language or region. Once you finish one book, ask what voices or experiences were absent. Seek out writers of different generations, genders, communities, and styles. Reading widely helps prevent one familiar story from becoming your only picture of a literary culture.</p>
        <h2>7. Keep a Translation Reading Log</h2>
        <p>Record the title, original language, translator, and one thing you noticed. You might note recurring themes, different ways of describing a city or family, or how humour survives across languages. Over time, the log can become a personal map of what you want to read next.</p>
        <h2>A Four-Book Exploration Plan</h2>
        <ul><li>Choose one short-story anthology from a language you have not read before.</li><li>Read a novel or novella in translation from that tradition.</li><li>Try a different genre, such as poetry, essays, or a play.</li><li>Choose a second author from another generation or region to broaden your view.</li></ul>
        <h2>Share What You Discover</h2>
        <p>Discussing translated literature with other readers can reveal details you missed and help you find new titles. Be open about what you do not know, and let questions lead to further reading rather than treating them as shortcomings.</p>
        <p>India's literary richness becomes more visible when we read beyond the familiar. Start with one translation, follow the voice that interests you, and let each book introduce you to another language, place, or way of seeing the world.</p>
      `
    },
    'choose-your-next-book-by-mood': {
      title: 'How to Choose Your Next Book by Mood',
      description: 'A practical guide to choosing books by mood, available attention, and the kind of reading experience you want.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=630&fit=crop',
      content: `
        <p>Choosing your next book should feel inviting, not like another decision to optimise. Sometimes you want a fast-paced mystery; sometimes you want a quiet story, a new idea, or a few pages that fit into a busy day. Letting your current mood guide you can make reading easier to begin.</p>
        <h2>Start by Asking What You Need From Reading</h2>
        <p>Do you want to relax, feel curious, laugh, understand a difficult subject, or see the world from another perspective? You do not need to find a perfect match. Naming the experience you want is enough to narrow the field.</p>
        <h2>When You Want Comfort</h2>
        <p>Try a familiar favourite, gentle humour, a cosy mystery, short stories, or a book whose world you already enjoy. Rereading counts: a familiar book can be a welcome place to return to, not a lesser choice.</p>
        <h2>When You Want Energy and Momentum</h2>
        <p>Look for clear prose, short chapters, strong narrative questions, adventure, suspense, or a collection of brief essays. If you are tired, a book that is easy to pick up and put down may work better than an ambitious doorstopper.</p>
        <h2>When You Want to Think Deeply</h2>
        <p>Choose literary fiction, history, philosophy, biography, or thoughtful nonfiction. Keep a pencil or note nearby, but do not turn every page into homework. One question worth thinking about is a successful reading session.</p>
        <h2>When You Have Very Little Time</h2>
        <p>Poetry, flash fiction, essays, and short stories offer natural stopping points. You can also read a longer book in small portions. A ten-minute session is still reading; consistency matters more than a dramatic daily target.</p>
        <h2>Use a Three-Book Shortlist</h2>
        <p>Keep three options ready: one easy, one intriguing, and one that stretches your interests. Choose from the list based on the day you are having. This reduces the friction of browsing endlessly when you could be reading.</p>
        <h2>Give a Book a Fair, Not Endless, Trial</h2>
        <p>Try a reasonable sample—perhaps a chapter or a few short sessions. If the voice, subject, or pace is not working for you, it is fine to pause or stop. You can return later, or let the book go without treating it as a failure.</p>
        <h2>Make Your Reading Mood Visible</h2>
        <p>On Sahadhyayi, use your library and reading community to keep track of books that appeal to different moods. Share what you are in the mood for and ask fellow readers for suggestions; a brief explanation of why a book worked for someone can be more helpful than a star rating alone.</p>
        <p>Your mood is a starting point, not a rule. Follow your curiosity, change direction when you need to, and let the next book meet you where you are.</p>
      `
    },
    'how-to-read-without-distractions': {
      title: 'How to Read Without Getting Distracted',
      description: 'Practical, forgiving ways to reduce interruptions and build a more focused reading routine.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1455390582262-044c025c3f5b?w=1200&h=630&fit=crop',
      content: `
        <p>If you read a page and realise you have not absorbed a word, you are not alone. Notifications, open browser tabs, noise, fatigue, and a busy mind can all compete for attention. Better focus usually comes from making reading easier to return to—not from demanding perfect concentration.</p>
        <h2>Choose a Small, Specific Session</h2>
        <p>Instead of promising to read for hours, choose a manageable window: ten or fifteen minutes, or a few pages. A clear finish line makes it easier to begin and gives you a chance to build gradually.</p>
        <h2>Make Your Phone Less Interesting</h2>
        <p>Put the phone out of arm's reach, enable Do Not Disturb, or silence non-essential notifications. If you read on your phone, use a reading app or full-screen mode and close unrelated tabs before you start.</p>
        <h2>Prepare Your Reading Spot</h2>
        <p>Keep your book, glasses, bookmark, and water nearby. Choose a comfortable place with enough light. You do not need a perfect reading nook; you need a setup that removes a few avoidable reasons to get up or switch tasks.</p>
        <h2>Give Your Mind a Parking Place</h2>
        <p>When a task or thought interrupts you, write a short reminder on paper and return to the page. This can reassure you that the thought will not be lost, without requiring you to solve it immediately.</p>
        <h2>Use a Gentle Restart</h2>
        <p>When you notice your attention wandering, pause, reread the last paragraph, and continue. Avoid turning a brief lapse into a reason to abandon the session. Returning to the text is part of reading practice.</p>
        <h2>Choose the Right Format for the Moment</h2>
        <p>A demanding book may be better suited to a quiet period, while short stories, essays, or audiobooks can fit other parts of the day. Experiment with print, e-books, and audio based on what helps you engage with the material.</p>
        <h2>Track What Helps, Not Just Pages</h2>
        <p>After a session, note one thing that made focusing easier: a quieter room, a shorter goal, or putting the phone away. Repeat the changes that work for you. Avoid measuring every session only by page count; understanding and enjoyment matter too.</p>
        <h2>Build a Routine You Can Repeat</h2>
        <p>Attach reading to an existing cue, such as after breakfast or before bed, and keep the initial goal modest. If you miss a day, resume at the next opportunity rather than trying to compensate with an exhausting session.</p>
        <p>Focus is not an all-or-nothing talent. Create a few helpful conditions, practise returning when your mind wanders, and let each session be a fresh start.</p>
      `
    },
    '30-day-reading-challenge': {
      title: 'A Gentle 30-Day Reading Challenge for Any Reader',
      description: 'A flexible 30-day reading plan with small prompts for discovery, reflection, and community.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&h=630&fit=crop',
      content: `
        <p>A reading challenge should make books more inviting, not turn them into a race. This 30-day plan is designed for beginners and returning readers alike. Use a few minutes a day, skip prompts that do not fit, and treat the schedule as an invitation rather than a strict streak.</p>
        <h2>Week 1: Make Reading Easy to Begin</h2>
        <ul><li><strong>Day 1:</strong> Pick a book you genuinely want to read.</li><li><strong>Day 2:</strong> Read for five to ten minutes.</li><li><strong>Day 3:</strong> Find a comfortable reading spot.</li><li><strong>Day 4:</strong> Read one page before opening a social app.</li><li><strong>Day 5:</strong> Try a short story, poem, or essay.</li><li><strong>Day 6:</strong> Read at a different time of day.</li><li><strong>Day 7:</strong> Reflect on what made reading enjoyable this week.</li></ul>
        <h2>Week 2: Follow Your Curiosity</h2>
        <ul><li><strong>Day 8:</strong> Read a passage twice and notice what changes.</li><li><strong>Day 9:</strong> Explore a genre you rarely choose.</li><li><strong>Day 10:</strong> Look up one unfamiliar word or reference.</li><li><strong>Day 11:</strong> Read a few pages without multitasking.</li><li><strong>Day 12:</strong> Find out something about the author.</li><li><strong>Day 13:</strong> Read a book from a language or place new to you, in translation if needed.</li><li><strong>Day 14:</strong> Write one sentence about an idea that stayed with you.</li></ul>
        <h2>Week 3: Read With Other People</h2>
        <ul><li><strong>Day 15:</strong> Recommend a book to a friend.</li><li><strong>Day 16:</strong> Ask someone what they are reading.</li><li><strong>Day 17:</strong> Share a question the book raised for you.</li><li><strong>Day 18:</strong> Read a passage that someone else recommended.</li><li><strong>Day 19:</strong> Compare two readers' interpretations respectfully.</li><li><strong>Day 20:</strong> Join or start a small reading discussion.</li><li><strong>Day 21:</strong> Record one thing you learned from another reader.</li></ul>
        <h2>Week 4: Find Your Own Reading Rhythm</h2>
        <ul><li><strong>Day 22:</strong> Revisit a book you once loved.</li><li><strong>Day 23:</strong> Try a nonfiction chapter or an essay.</li><li><strong>Day 24:</strong> Read somewhere new, if practical.</li><li><strong>Day 25:</strong> Put your phone away for one short session.</li><li><strong>Day 26:</strong> Decide whether to continue or pause your current book.</li><li><strong>Day 27:</strong> Make a short list of books you want to explore.</li><li><strong>Day 28:</strong> Read purely for pleasure, with no notes or goals.</li></ul>
        <h2>Days 29–30: Reflect and Continue</h2>
        <ul><li><strong>Day 29:</strong> Look back at the formats, times, and genres you enjoyed most.</li><li><strong>Day 30:</strong> Choose a small, realistic routine for the next month.</li></ul>
        <h2>Make the Challenge Work for You</h2>
        <p>Missed a day? Continue with the next prompt. Finished no books? That is fine: the goal is to build a relationship with reading, not to maximise a number. You can repeat a week, replace prompts, or invite a friend to take part with you.</p>
        <h2>Celebrate What You Discovered</h2>
        <p>At the end of the month, note what surprised you, which book you want to continue, and what you would change about your routine. Share your progress with fellow readers on Sahadhyayi and ask for recommendations based on what you enjoyed.</p>
        <p>Thirty days will not look the same for everyone. A few meaningful minutes, repeated with flexibility, can be a strong beginning.</p>
      `
    },
    'osho-books-and-themes-in-his-discourses': {
      title: 'The Books Osho Read: Ashtavakra Gita, Vedas, Puranas, and the Worlds Explored in His Discourses',
      description: 'A research-guided map of Osho’s talks on the Ashtavakra Gita, Upanishads, Vedas, Puranic stories, Buddhist and Jain traditions, Taoism, Zen, Sufism, Christianity, literature, psychology, and society.',
      author: 'Sahadhyayi Editorial',
      date: '2026-10-29',
      readTime: '12 min read',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=630&fit=crop',
      content: `
        <p>Osho—also known as Bhagwan Shree Rajneesh—gave thousands of recorded talks that moved across Indian scriptures, Asian spiritual traditions, Western philosophy, literature, psychology, and social questions. His books are often edited transcripts of these spoken discourses. To explore his reading world responsibly, it helps to distinguish three things: texts he explicitly praised, scriptures he discussed in dedicated series, and broader topics that appeared throughout his talks.</p>
        <p>This is a guide to that landscape, not a claim that every book listed was a personal favourite or that one article can catalogue every discourse. Titles and series can vary between editions and translations, so the linked catalogues at the end are useful for checking details.</p>
        <h2>1. Ashtavakra Gita: The Mahageeta</h2>
        <p>The Ashtavakra Gita—also called the Ashtavakra Samhita—is central to Osho’s discourse series published as <em>The Mahageeta</em>. Its dialogue between the sage Ashtavakra and King Janaka explores liberation, the witness, identity, non-attachment, and the difference between awareness and the changing contents of experience. Osho spoke about this text with exceptional admiration, describing it as an unusually direct expression of truth.</p>
        <p>For readers, the key is to read the source verses as well as Osho’s interpretation. The Ashtavakra text has its own philosophical history and interpretive traditions; Osho’s strong comparisons with other scriptures are his evaluative view, not an objective ranking accepted by all traditions.</p>
        <p><a href="https://oshoworld.com/the-mahageeta-vol-1" target="_blank" rel="noopener noreferrer">Read about <em>The Mahageeta, Vol. 1</em> at Osho World</a> · <a href="https://www.penguin.co.in/book/enlightenment-the-only-revolution/" target="_blank" rel="noopener noreferrer">Publisher information for <em>Enlightenment: The Only Revolution</em></a>.</p>
        <h2>2. The Upanishads and the Question “Who Am I?”</h2>
        <p>The Upanishads examine consciousness, the self, ultimate reality, knowledge, and liberation. Osho gave dedicated discourses on several Upanishadic texts. Published collections include <em>That Art Thou</em>, based on the Sarvasar, Kaivalya, and Adhyatma Upanishads; <em>The Supreme Doctrine</em>, on the Kenopanishad; <em>The Heartbeat of the Absolute</em>, on the Ishavasya Upanishad; and <em>Vedanta: Seven Steps to Samadhi</em>, on the Akshya Upanishad.</p>
        <p>These are not interchangeable texts. Each has its own setting, language, and questions. A good reading approach is to choose one Upanishad, read a translation slowly, and then compare Osho’s commentary with another scholarly or traditional interpretation.</p>
        <h2>3. Vedas, Vedanta, and the Wider Vedic Tradition</h2>
        <p>The Vedas are a large and diverse body of hymns, rituals, and sacred knowledge; Vedanta is a set of philosophical traditions that developed especially through interpretations of the Upanishads, the Bhagavad Gita, and the Brahma Sutras. In everyday conversation these terms are sometimes blurred, but they do not mean exactly the same thing.</p>
        <p>Osho’s recorded talks engage extensively with Upanishadic and Vedantic questions, and he sometimes compares the authority or style of different scriptures. When describing this work, it is more precise to name the specific text or discourse series rather than imply that every Vedic hymn or school received a systematic commentary from him.</p>
        <h2>4. Puranas, Epics, and Stories of the Indian Imagination</h2>
        <p>The Puranas preserve expansive narratives about deities, creation, lineages, cosmology, sacred places, and moral or devotional themes. The Ramayana and Mahabharata are epic traditions with many tellings, regional forms, and interpretations. Osho drew on stories, characters, and religious narratives from the broader Indian tradition in talks about desire, duty, attachment, devotion, power, and the human mind.</p>
        <p>Because “the Puranas” refers to many works rather than one book, it would be misleading to say that a single discourse series covers them all. If you are researching a particular Purana, episode, or character, check the discourse title and source text in a catalogue before attributing a specific interpretation to Osho.</p>
        <h2>5. Bhagavad Gita: Action, Responsibility, and Inner Freedom</h2>
        <p>The Bhagavad Gita places a dialogue about duty, action, knowledge, devotion, and liberation within the Mahabharata. Osho discussed the Gita and contrasted its approach with other Indian texts, including the Ashtavakra Gita. Reading both is especially interesting because their dramatic situations and ways of speaking about action and freedom differ.</p>
        <p>Rather than treating one as the final answer, compare the questions each text asks: What does it mean to act? What does freedom from attachment look like? How should insight relate to ordinary responsibility? Those questions can open a richer discussion than simply ranking scriptures.</p>
        <h2>6. Yoga Sutras, Tantra, and Meditation Methods</h2>
        <p>Osho’s discourse catalogue includes <em>Yoga: The Alpha and the Omega</em>, a series on Patanjali’s Yoga Sutras, and <em>The Book of Secrets</em>, his commentary on meditation methods associated with the Vigyan Bhairav Tantra. Other series discuss Tantra, Mahamudra, and mystics such as Saraha and Tilopa.</p>
        <p>These works explore the mind, attention, discipline, the body, desire, meditation, and the possibility of observing experience directly. The texts come from distinct historical contexts, so it is useful to treat Osho’s synthesis as one modern interpretation rather than as a substitute for learning the traditions in their own terms.</p>
        <h2>7. Jainism, Mahavira, and Non-Attachment</h2>
        <p>Osho also spoke about Mahavira and Jain ideas, including restraint, non-violence, awareness, and freedom from attachment. Jain philosophy has a long and internally diverse intellectual history, including distinctive approaches to non-violence, karma, and multiple-sided truth. Osho’s talks can serve as an entry point, but readers should consult Jain sources to understand the tradition beyond a single speaker’s account.</p>
        <h2>8. Buddhism, Zen, and Taoism</h2>
        <p>Gautama Buddha, Buddhist meditation, Zen teachers such as Bodhidharma, and Taoist thinkers such as Lao Tzu and Chuang Tzu recur across Osho’s discourses. These traditions offer different ways to consider suffering, impermanence, attention, spontaneity, silence, and the limits of rigid concepts.</p>
        <p>For Taoism, begin with a translation of the <em>Tao Te Ching</em> and compare it with Osho’s comments. For Zen, look at the source stories and teachings as well as the commentary. Paradox and humour can be powerful teaching tools, but their meaning often depends on context.</p>
        <h2>9. Sufism, Rumi, and the Language of Love</h2>
        <p>Osho’s talks also draw on Sufi stories, mystical poetry, and writers such as Rumi and Omar Khayyam. These works use longing, love, surrender, humour, and metaphor to explore spiritual searching. Reading the poem itself before or after hearing a commentary can reveal how much depends on translation and interpretation.</p>
        <h2>10. Christianity, Jesus, and Mystical Readings</h2>
        <p>Christian texts and the sayings attributed to Jesus appear in discourse collections such as <em>The Mustard Seed</em>, which explores the Gospel of Thomas. Osho also spoke about the Sermon on the Mount and the relationship between spiritual insight and organised religion.</p>
        <p>These interpretations can be provocative. Readers can make their own assessment by comparing the relevant source text, Osho’s reading, and historical or theological scholarship. That approach preserves the value of debate without mistaking one interpretation for the only possible one.</p>
        <h2>11. Books He Explicitly Named as Beloved</h2>
        <p>In <em>Books I Have Loved</em>, Osho discusses a varied group of works rather than a single philosophical canon. Titles associated with the collection include Friedrich Nietzsche’s <em>Thus Spoke Zarathustra</em>, Fyodor Dostoevsky’s <em>The Brothers Karamazov</em>, Mikhail Naimy’s <em>The Book of Mirdad</em>, Richard Bach’s <em>Jonathan Livingston Seagull</em>, Lao Tzu’s <em>Tao Te Ching</em>, Chuang Tzu’s writings, the <em>Bhagavad Gita</em>, Rabindranath Tagore’s <em>Gitanjali</em>, and works connected with the mystic Milarepa.</p>
        <p>The mix spans novels, poetry, mystical texts, and philosophical writing. It is a documented selection of books discussed in that collection—not a complete list of everything Osho read throughout his life.</p>
        <p><a href="https://oshoworld.com/books-i-have-loved" target="_blank" rel="noopener noreferrer">Explore <em>Books I Have Loved</em> at Osho World</a>.</p>
        <h2>12. Western Philosophy, Literature, and the Modern Individual</h2>
        <p>Nietzsche and Dostoevsky raise questions about morality, freedom, faith, responsibility, alienation, and what happens when inherited certainties are challenged. Osho’s wider talks also moved into modern social and philosophical concerns. Literature gave him characters and conflicts through which to discuss ideas rather than only abstract arguments.</p>
        <p>You do not have to accept his interpretation to benefit from it. Treat a commentary as an invitation to revisit the original book and ask what the text itself supports, what the speaker adds, and where you disagree.</p>
        <h2>13. Psychology, Relationships, Society, and Science</h2>
        <p>Across his talks, Osho addressed fear, loneliness, relationships, desire, repression, identity, social conditioning, education, politics, and organised belief. These themes connect the ancient texts to the concerns of modern life. They also require care: spiritual or philosophical commentary is not automatically scientific evidence or professional mental-health guidance. Verify factual claims about science, medicine, and history using independent specialist sources.</p>
        <h2>14. A Practical Reading Path for Curious Readers</h2>
        <ol>
          <li><strong>Start with the Ashtavakra Gita.</strong> Read a translation of the source text, then explore Osho’s <em>The Mahageeta</em>.</li>
          <li><strong>Choose one Upanishad.</strong> Try the Ishavasya or Kena Upanishad and compare the text with a discourse collection.</li>
          <li><strong>Read the Bhagavad Gita alongside it.</strong> Compare how each text approaches action, awareness, and liberation.</li>
          <li><strong>Explore a meditation tradition.</strong> Choose Patanjali’s Yoga Sutras or the Vigyan Bhairav Tantra and keep the historical differences in view.</li>
          <li><strong>Move beyond India.</strong> Try the Tao Te Ching, a Zen collection, a Sufi poem, or one of the literary works in <em>Books I Have Loved</em>.</li>
          <li><strong>Keep a source-and-commentary notebook.</strong> Record the original text, the passage, Osho’s interpretation, another perspective, and your own questions.</li>
        </ol>
        <h2>15. Sources for Further Research</h2>
        <p>The following catalogues help readers check titles and explore the breadth of Osho’s published talks:</p>
        <ul>
          <li><a href="https://oshoworld.com/the-mahageeta-vol-1" target="_blank" rel="noopener noreferrer"><em>The Mahageeta, Vol. 1</em> — Osho World</a>, for the Ashtavakra Gita discourse series.</li>
          <li><a href="https://oshoworld.com/books-i-have-loved" target="_blank" rel="noopener noreferrer"><em>Books I Have Loved</em> — Osho World</a>, for books Osho discussed as beloved.</li>
          <li><a href="https://oshosourcebook.com/appendix/" target="_blank" rel="noopener noreferrer">OSHO Source Book appendix</a>, for subject groupings and discourse references.</li>
          <li><a href="https://oshosourcebook.com/bibliography/" target="_blank" rel="noopener noreferrer">OSHO Source Book bibliography</a>, for publication and series details.</li>
          <li><a href="https://osholive.com/discourses" target="_blank" rel="noopener noreferrer">Osho Live discourse catalogue</a>, for browsing recorded talk series.</li>
        </ul>
        <p>Catalogues and editions may differ, and some Hindi material has not been translated into English. Where an exact title or attribution matters, verify it against the relevant edition rather than relying on a general summary.</p>
        <h2>A Reading Journey Across Many Worlds</h2>
        <p>Osho’s discourse landscape stretches from the uncompromising language of the Ashtavakra Gita to the Upanishads, Vedic and Puranic traditions, yoga and tantra, Jain and Buddhist thought, Zen and Taoism, Sufi poetry, Christianity, modern literature, psychology, and social criticism. No short list can represent it all, and no single speaker settles the meaning of every source.</p>
        <p>The most rewarding approach is to read widely and critically: return to the original text, hear the interpretation, compare perspectives, and keep asking your own questions. A good book does not end inquiry—it gives it a deeper beginning.</p>
      `
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
