-- Seed the initial, source-reviewed Scientists collection.
INSERT INTO public.scientists (slug,name,region,discipline,lifespan,summary,sort_order,status)
VALUES
('amal-kumar-raychaudhuri','Amal Kumar Raychaudhuri','india','Physics · Cosmology','1923–2005','An Indian theoretical physicist whose work on general relativity and cosmology became an important foundation for the study of spacetime singularities.',1,'published'),
('c-v-raman','C. V. Raman','india','Physics · Optics','1888–1970','Chandrasekhara Venkata Raman was an Indian physicist whose discovery of the Raman Effect earned him the 1930 Nobel Prize in Physics.',2,'published'),
('satyendra-nath-bose','Satyendra Nath Bose','india','Physics · Quantum Mechanics','1894–1974','An Indian physicist whose work on quantum statistics, recognised and extended by Albert Einstein, gave rise to Bose–Einstein statistics and the name boson.',3,'published'),
('srinivasa-ramanujan','Srinivasa Ramanujan','india','Mathematics · Number Theory','1887–1920','An Indian mathematician whose original work transformed number theory, infinite series, continued fractions and the study of mathematical functions.',4,'published'),
('marie-curie','Marie Curie','world','Physics · Chemistry','1867–1934','A physicist and chemist whose research on radioactivity led to the discovery of polonium and radium and two Nobel Prizes.',5,'published'),
('albert-einstein','Albert Einstein','world','Physics · Relativity','1879–1955','A theoretical physicist whose work reshaped modern physics, including relativity and the explanation of the photoelectric effect.',6,'published'),
('katherine-johnson','Katherine Johnson','world','Mathematics · Spaceflight','1918–2020','An American mathematician at NASA whose calculations supported early human spaceflight, including the Mercury and Apollo programmes.',7,'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.scientist_publications
(scientist_id,title,year,venue,authors,doi,url,access,note,sort_order)
SELECT s.id,v.title,v.year,v.venue,v.authors,v.doi,v.url,v.access,v.note,v.sort_order
FROM (VALUES
('amal-kumar-raychaudhuri','Relativistic Cosmology. I','1955','Physical Review, 98(4), 1123–1126','Amalkumar Raychaudhuri','10.1103/PhysRev.98.1123','https://journals.aps.org/pr/abstract/10.1103/PhysRev.98.1123','publisher','Original research paper introducing the cosmological analysis associated with Raychaudhuri. The publisher page provides the abstract and bibliographic record; full text may require access.',1),
('c-v-raman','A New Type of Secondary Radiation','1928','Nature, 121, 501–502','C. V. Raman and K. S. Krishnan','10.1038/121501c0','https://www.nature.com/articles/121501c0','publisher','Contemporary 1928 communication reporting the modified-frequency component of scattered light; the Nature page provides the original article record.',1),
('c-v-raman','A New Radiation','1928','Indian Journal of Physics, 2, 387–398','C. V. Raman',NULL,'https://repository.ias.ac.in/70648/','open','Repository record with a publisher-version PDF preview. Rights remain with the Indian Association for the Cultivation of Science.',2),
('c-v-raman','A New Class of Spectra Due to Secondary Radiation. Part I','1928','Indian Journal of Physics, 2, 399–419','C. V. Raman and K. S. Krishnan',NULL,'https://repository.ias.ac.in/70550/','catalogue','Institutional repository catalogue record; the repository notes that full text is not available there.',3),
('satyendra-nath-bose','Plancks Gesetz und Lichtquantenhypothese','1924','Zeitschrift für Physik, 26, 178–181','S. N. Bose','10.1007/BF01327326','https://doi.org/10.1007/BF01327326','publisher','The original German-language journal publication of Bose’s derivation. The surviving manuscript sent to Einstein is described by historical sources as lost; this is the published paper, not that manuscript.',1),
('satyendra-nath-bose','Collected Scientific Papers of S. N. Bose','Collected edition','S. N. Bose National Centre for Basic Sciences','S. N. Bose',NULL,'https://www.bose.res.in/Prof.S.N.Bose-Archive/objects/Collected%20Scientific%20Papers.pdf','open','Institutional collected-papers PDF containing the published German text and other scientific works.',2),
('srinivasa-ramanujan','Highly Composite Numbers','1915','Proceedings of the London Mathematical Society, 2(14), 347–409','S. Ramanujan',NULL,'https://ramanujan.sirinudi.org/Volumes/published/ram15.pdf','open','Digitised copy of a major original paper, available through the Ramanujan research archive.',1),
('srinivasa-ramanujan','Published papers of Srinivasa Ramanujan','1911–1920','Multiple mathematical journals','Srinivasa Ramanujan',NULL,'https://ramanujan.sirinudi.org/html/published_papers.html','catalogue','A bibliography of published papers with journal and page details; individual scans are linked where available.',2)
) AS v(slug,title,year,venue,authors,doi,url,access,note,sort_order)
JOIN public.scientists s ON s.slug=v.slug
WHERE NOT EXISTS (SELECT 1 FROM public.scientist_publications p WHERE p.scientist_id=s.id AND p.title=v.title);

INSERT INTO public.scientist_archives
(scientist_id,title,institution,url,material,note,sort_order)
SELECT s.id,v.title,v.institution,v.url,v.material,v.note,v.sort_order
FROM (VALUES
('amal-kumar-raychaudhuri','Deceased Fellow record: Professor A. K. Raychaudhuri','Indian National Science Academy','https://insaindia.res.in/07062023_no.php?id=N87-0976','Institutional biographical record','An institutional record for biographical verification, not an original research manuscript.',1),
('c-v-raman','Publications of C. V. Raman — 1928 records','Indian Academy of Sciences Repository','https://repository.ias.ac.in/view/year/1928.html','Publication catalogue','A year-filtered institutional bibliography listing multiple 1928 papers by Raman and collaborators.',1),
('satyendra-nath-bose','Satyendra Nath Bose — archival biographical record','Indian Institute of Astrophysics Archives','https://archives.iiap.res.in/index.php/bose-satyendra-nath','Archival authority record and digitised photograph metadata','An archival description with identity information and digital-object metadata.',1),
('satyendra-nath-bose','Bose–Einstein correspondence and quantum-history exhibit','Quantum History Wall','https://www.quantum-history.de/','Historical correspondence exhibit','Describes Bose’s 1924 letter to Einstein and the publication history; it is an interpretive exhibit, not the original manuscript.',2),
('srinivasa-ramanujan','Letters from Srinivasa Ramanujan to G. H. Hardy','Trinity College, University of Cambridge Archives','https://archives.trin.cam.ac.uk/index.php/informationobject/browse?levels=232&onlyMedia=1&query=Srinivasa+Ramanujan&sf_culture=en&sort=alphabetic&sortDir=asc&sq0=Srinivasa+Ramanujan&topLod=0','Archival correspondence catalogue','Catalogue records identify surviving correspondence and related manuscript collections; not every item is digitised.',1)
) AS v(slug,title,institution,url,material,note,sort_order)
JOIN public.scientists s ON s.slug=v.slug
WHERE NOT EXISTS (SELECT 1 FROM public.scientist_archives a WHERE a.scientist_id=s.id AND a.title=v.title);
