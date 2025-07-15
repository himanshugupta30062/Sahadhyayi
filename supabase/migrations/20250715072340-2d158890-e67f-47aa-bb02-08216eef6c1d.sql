
-- Insert dummy data for authors table
INSERT INTO public.authors (name, bio, profile_image_url, location, website_url, social_links, genres, books_count, followers_count, rating, upcoming_events) VALUES
('राहुल सांकृत्यायन', 'भारत के प्रसिद्ध इतिहासकार, साहित्यकार और घुमक्कड़ लेखक। उन्होंने हिंदी साहित्य में अमूल्य योगदान दिया है।', 'https://example.com/rahul.jpg', 'पटना, बिहार', 'https://rahulsankrityayan.com', '{"twitter": "@rahul_sankrityayan", "instagram": "@rahul_writer"}', '["इतिहास", "यात्रा", "साहित्य"]', 15, 25000, 4.7, 3),
('हरिवंशराय बच्चन', 'हिंदी कविता के महान कवि, जिन्होंने "मधुशाला" जैसी अमर कृति दी। उनकी कविताएं आज भी लोकप्रिय हैं।', 'https://example.com/harivansh.jpg', 'इलाहाबाद, उत्तर प्रदेश', 'https://harivanshrai.com', '{"facebook": "harivanshrai.bachchan"}', '["कविता", "साहित्य", "दर्शन"]', 12, 45000, 4.9, 2),
('महादेवी वर्मा', 'छायावाद की प्रमुख कवयित्री, जिन्होंने महिला सशक्तिकरण के लिए अथक कार्य किया।', 'https://example.com/mahadevi.jpg', 'फर्रुखाबाद, उत्तर प्रदेश', 'https://mahadeviverma.org', '{"twitter": "@mahadevi_verma"}', '["कविता", "गद्य", "सामाजिक सुधार"]', 18, 35000, 4.8, 1),
('मुंशी प्रेमचंद', 'हिंदी उपन्यास सम्राट, जिन्होंने भारतीय समाज की समस्याओं को अपनी कहानियों में उजागर किया।', 'https://example.com/premchand.jpg', 'लमही, वाराणसी', 'https://premchand.com', '{"instagram": "@premchand_official"}', '["उपन्यास", "कहानी", "सामाजिक सुधार"]', 25, 75000, 4.9, 0),
('सुमित्रानंदन पंत', 'प्रकृति के सुकुमार कवि, जिन्हें ज्ञानपीठ पुरस्कार से सम्मानित किया गया।', 'https://example.com/pant.jpg', 'कौसानी, उत्तराखंड', 'https://sumitranandanpant.in', '{"facebook": "sumitranandan.pant"}', '["कविता", "प्रकृति", "दर्शन"]', 20, 28000, 4.6, 4);

-- Insert dummy data for profiles table (using UUIDs that would exist in auth.users)
INSERT INTO public.profiles (id, full_name, username, bio, profile_photo_url, writing_frequency, stories_written_count, stories_read_count, tags_used, location_sharing, location_lat, location_lng, last_seen) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'अमित शर्मा', 'amit_reader', 'किताबों के शौकीन और लेखन में रुचि रखने वाला।', 'https://example.com/amit.jpg', 'weekly', 5, 45, '["फिक्शन", "इतिहास", "विज्ञान"]', true, 28.6139, 77.2090, now()),
('550e8400-e29b-41d4-a716-446655440002', 'प्रिया गुप्ता', 'priya_books', 'हिंदी साहित्य की प्रेमी और कहानी लेखिका।', 'https://example.com/priya.jpg', 'daily', 12, 78, '["कविता", "उपन्यास", "प्रेम कहानी"]', false, null, null, now()),
('550e8400-e29b-41d4-a716-446655440003', 'राजेश कुमार', 'rajesh_writer', 'तकनीकी लेखक और पुस्तक समीक्षक।', 'https://example.com/rajesh.jpg', 'monthly', 3, 32, '["तकनीक", "विज्ञान", "बिजनेस"]', true, 19.0760, 72.8777, now()),
('550e8400-e29b-41d4-a716-446655440004', 'सुनीता देवी', 'sunita_reader', 'गृहिणी और पारंपरिक कहानियों की प्रेमी।', 'https://example.com/sunita.jpg', 'weekly', 2, 25, '["पारंपरिक", "धार्मिक", "पारिवारिक"]', false, null, null, now()),
('550e8400-e29b-41d4-a716-446655440005', 'विकास अग्रवाल', 'vikas_bookworm', 'व्यापारी और अवकाश में पढ़ने वाला।', 'https://example.com/vikas.jpg', 'weekend', 1, 18, '["व्यापार", "आत्म-सुधार", "जीवनी"]', true, 26.9124, 75.7873, now());

-- Insert dummy data for stories table
INSERT INTO public.stories (user_id, title, description, content, format, audio_url) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'सुबह की किरण', 'एक छोटी प्रेरणादायक कहानी सुबह की शुरुआत के बारे में।', 'सुबह की पहली किरण के साथ जीवन में नई उम्मीदें जन्म लेती हैं। यह कहानी उसी आशा की है...', 'text', null),
('550e8400-e29b-41d4-a716-446655440002', 'माँ का प्यार', 'माँ के अटूट प्रेम पर आधारित भावनात्मक कहानी।', 'माँ का प्यार संसार में सबसे पवित्र और निस्वार्थ प्रेम है। इस कहानी में...', 'text', null),
('550e8400-e29b-41d4-a716-446655440003', 'तकनीक और मानवता', 'आधुनिक तकनीक के युग में मानवीय रिश्तों की महत्ता।', 'आज के डिजिटल युग में हम भूल जाते हैं कि तकनीक हमारे लिए है, हम तकनीक के लिए नहीं...', 'text', null),
('550e8400-e29b-41d4-a716-446655440004', 'गाँव की यादें', 'बचपन के गाँव की मीठी यादों पर आधारित कहानी।', 'गाँव की मिट्टी की खुशबू, खेतों में लहलहाते फसल, और दादी माँ की कहानियाँ...', 'text', null),
('550e8400-e29b-41d4-a716-446655440005', 'सफलता की राह', 'एक व्यापारी की संघर्ष और सफलता की कहानी।', 'सफलता रातों रात नहीं मिलती। इसके लिए दृढ़ संकल्प और निरंतर प्रयास की आवश्यकता होती है...', 'text', null);

-- Insert dummy data for reading_progress table
INSERT INTO public.reading_progress (user_id, book_title, total_pages, current_page, cover_image_url) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'गोदान', 384, 145, 'https://covers.openlibrary.org/b/id/8101347-L.jpg'),
('550e8400-e29b-41d4-a716-446655440001', 'गुनाहों का देवता', 248, 78, 'https://covers.openlibrary.org/b/id/9251153-L.jpg'),
('550e8400-e29b-41d4-a716-446655440002', 'A Brief History of Time', 256, 89, 'https://covers.openlibrary.org/b/id/240726-L.jpg'),
('550e8400-e29b-41d4-a716-446655440002', 'गोदान', 384, 234, 'https://covers.openlibrary.org/b/id/8101347-L.jpg'),
('550e8400-e29b-41d4-a716-446655440003', 'The Great Gatsby', 180, 67, ''),
('550e8400-e29b-41d4-a716-446655440004', 'गुनाहों का देवता', 248, 156, 'https://covers.openlibrary.org/b/id/9251153-L.jpg'),
('550e8400-e29b-41d4-a716-446655440005', 'Sapiens', 443, 201, '');

-- Insert dummy data for groups table
INSERT INTO public.groups (name, description, created_by) VALUES
('हिंदी साहित्य प्रेमी', 'हिंदी साहित्य पर चर्चा और समीक्षा के लिए समुदाय।', '550e8400-e29b-41d4-a716-446655440001'),
('विज्ञान और तकनीक', 'विज्ञान और तकनीकी पुस्तकों पर चर्चा।', '550e8400-e29b-41d4-a716-446655440003'),
('कविता और शायरी', 'कविता प्रेमियों का समुदाय।', '550e8400-e29b-41d4-a716-446655440002'),
('बिजनेस बुक क्लब', 'व्यापारिक पुस्तकों पर चर्चा और समीक्षा।', '550e8400-e29b-41d4-a716-446655440005'),
('महिला लेखिकाएं', 'महिला लेखकों की कृतियों पर चर्चा।', '550e8400-e29b-41d4-a716-446655440004');

-- Insert dummy data for group_members table
INSERT INTO public.group_members (group_id, user_id) VALUES
((SELECT id FROM groups WHERE name = 'हिंदी साहित्य प्रेमी'), '550e8400-e29b-41d4-a716-446655440001'),
((SELECT id FROM groups WHERE name = 'हिंदी साहित्य प्रेमी'), '550e8400-e29b-41d4-a716-446655440002'),
((SELECT id FROM groups WHERE name = 'हिंदी साहित्य प्रेमी'), '550e8400-e29b-41d4-a716-446655440004'),
((SELECT id FROM groups WHERE name = 'विज्ञान और तकनीक'), '550e8400-e29b-41d4-a716-446655440003'),
((SELECT id FROM groups WHERE name = 'विज्ञान और तकनीक'), '550e8400-e29b-41d4-a716-446655440001'),
((SELECT id FROM groups WHERE name = 'कविता और शायरी'), '550e8400-e29b-41d4-a716-446655440002'),
((SELECT id FROM groups WHERE name = 'कविता और शायरी'), '550e8400-e29b-41d4-a716-446655440004'),
((SELECT id FROM groups WHERE name = 'बिजनेस बुक क्लब'), '550e8400-e29b-41d4-a716-446655440005'),
((SELECT id FROM groups WHERE name = 'बिजनेस बुक क्लब'), '550e8400-e29b-41d4-a716-446655440003'),
((SELECT id FROM groups WHERE name = 'महिला लेखिकाएं'), '550e8400-e29b-41d4-a716-446655440004'),
((SELECT id FROM groups WHERE name = 'महिला लेखिकाएं'), '550e8400-e29b-41d4-a716-446655440002');

-- Insert dummy data for user_bookshelf table
INSERT INTO public.user_bookshelf (user_id, book_id, status, notes, rating) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM books_library WHERE title = 'गोदान'), 'reading', 'प्रेमचंद की यह कृति वास्तव में उत्कृष्ट है। किसान जीवन का सच्चा चित्रण।', 5),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM books_library WHERE title = 'A Brief History of Time'), 'completed', 'जटिल विज्ञान को सरल भाषा में समझाने का बेहतरीन प्रयास।', 4),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM books_library WHERE title = 'गुनाहों का देवता'), 'completed', 'प्रेम कहानी का अद्भुत चित्रण। भारती जी की लेखनी का कमाल।', 5),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM books_library WHERE title = 'Pride and Prejudice'), 'reading', 'जेन ऑस्टिन का क्लासिक। रोमांस और सामाजिक टिप्पणी का बेहतरीन मिश्रण।', null),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM books_library WHERE title = 'Sapiens'), 'completed', 'मानव इतिहास पर एक नया दृष्टिकोण। बहुत ही रोचक और जानकारीपूर्ण।', 5),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM books_library WHERE title = 'गोदान'), 'want_to_read', 'सुना है बहुत अच्छी किताब है। जल्दी पढ़ूंगी।', null),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM books_library WHERE title = 'The Alchemist'), 'completed', 'जीवन दर्शन पर आधारित प्रेरणादायक पुस्तक।', 4);

-- Insert dummy data for contact_messages table
INSERT INTO public.contact_messages (name, email, message) VALUES
('रोहित शर्मा', 'rohit@example.com', 'Sahadhyayi एक बहुत ही उपयोगी प्लेटफॉर्म है। मैं नियमित रूप से इसका उपयोग करता हूं।'),
('अनिता पटेल', 'anita@example.com', 'क्या आप भविष्य में मराठी भाषा की किताबें भी जोड़ेंगे? मुझे मराठी साहित्य पढ़ना पसंद है।'),
('सुरेश कुमार', 'suresh@example.com', 'मुझे लगता है कि ऑडियो बुक की सुविधा होनी चाहिए। यह बहुत उपयोगी होगी।'),
('मीरा देवी', 'meera@example.com', 'धन्यवाद Sahadhyayi टीम को। इस प्लेटफॉर्म के कारण मैंने फिर से पढ़ना शुरू किया है।');

-- Insert dummy data for friendships table
INSERT INTO public.friendships (requester_id, addressee_id, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'accepted'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'accepted'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'accepted'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'pending'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'accepted');

-- Insert dummy data for book_summaries table
INSERT INTO public.book_summaries (book_id, summary_type, content, duration_minutes) VALUES
((SELECT id FROM books_library WHERE title = 'गोदान'), 'full_book', 'गोदान मुंशी प्रेमचंद का अंतिम और सबसे प्रसिद्ध उपन्यास है। यह भारतीय किसान होरी के संघर्ष की कहानी है, जो अपनी गाय पाने का सपना देखता है। उपन्यास में ग्रामीण जीवन की कठिनाइयों, जमींदारी प्रथा की समस्याओं, और सामाजिक न्याय के मुद्दों को उजागर किया गया है। होरी के चरित्र के माध्यम से प्रेमचंद ने भारतीय किसान की दुर्दशा का मार्मिक चित्रण किया है।', 15),
((SELECT id FROM books_library WHERE title = 'A Brief History of Time'), 'full_book', 'स्टीफन हॉकिंग की यह पुस्तक ब्रह्मांड की उत्पत्ति, काल की प्रकृति, और भौतिकी के मूलभूत सिद्धांतों को सामान्य पाठकों के लिए समझाती है। लेखक ने बिग बैंग सिद्धांत, ब्लैक होल्स, और क्वांटम मैकेनिक्स जैसे जटिल विषयों को सरल भाषा में प्रस्तुत किया है। यह पुस्तक विज्ञान में रुचि रखने वालों के लिए एक आवश्यक पुस्तक है।', 15),
((SELECT id FROM books_library WHERE title = 'गुनाहों का देवता'), 'full_book', 'धर्मवीर भारती का यह उपन्यास प्रेम की अमर कहानी है। चंदर और सुधा के बीच की प्रेम कहानी, जो सामाजिक बंधनों और पारिवारिक दायित्वों के कारण अधूरी रह जाती है। उपन्यास में युवा प्रेम की मासूमियत, त्याग की भावना, और जीवन की वास्तविकताओं का सुंदर चित्रण है। यह हिंदी साहित्य का एक क्लासिक प्रेम उपन्यास है।', 15);

-- Insert dummy data for gemini_training_data table
INSERT INTO public.gemini_training_data (user_id, prompt, completion) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'What is the meaning of Sahadhyayi?', 'Sahadhyayi (सहाध्यायी) means a fellow student or classmate in Sanskrit. It represents someone who studies together with others, embodying the spirit of collaborative learning and shared knowledge.'),
('550e8400-e29b-41d4-a716-446655440002', 'Tell me about Hindi literature', 'Hindi literature has a rich tradition spanning centuries, from ancient texts to modern works. It includes great authors like Munshi Premchand, Harivansh Rai Bachchan, and Mahadevi Verma who have contributed significantly to Indian literary heritage.'),
('550e8400-e29b-41d4-a716-446655440003', 'How to start reading Hindi books?', 'Start with popular and accessible books like stories by Premchand or poetry by Harivansh Rai Bachchan. Begin with shorter works and gradually move to longer novels. Join reading communities like Sahadhyayi to discuss and get recommendations.');

-- Insert dummy data for post_comments table (for blog posts)
INSERT INTO public.post_comments (post_id, user_id, content) VALUES
('what-is-sahadhyayi-meaning-story', '550e8400-e29b-41d4-a716-446655440001', 'बहुत ही बेहतरीन जानकारी! Sahadhyayi का अर्थ जानकर अच्छा लगा।'),
('what-is-sahadhyayi-meaning-story', '550e8400-e29b-41d4-a716-446655440002', 'यह प्लेटफॉर्म वास्तव में पुस्तक प्रेमियों के लिए वरदान है।'),
('how-sahadhyayi-revives-reading-culture', '550e8400-e29b-41d4-a716-446655440003', 'डिजिटल युग में पढ़ने की संस्कृति को बनाए रखना बहुत जरूरी है।'),
('why-book-lovers-should-join-sahadhyayi', '550e8400-e29b-41d4-a716-446655440004', 'मैं भी जल्दी ही इस कम्युनिटी का हिस्सा बनूंगी।'),
('why-book-lovers-should-join-sahadhyayi', '550e8400-e29b-41d4-a716-446655440005', 'Sahadhyayi के माध्यम से नए लेखकों को जानने का मौका मिलता है।');
