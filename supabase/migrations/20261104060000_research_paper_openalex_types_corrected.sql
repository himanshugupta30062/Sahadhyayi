-- Align category mapping with OpenAlex's current controlled work-type vocabulary.
update public.research_paper_categories set openalex_types = array['article']
where slug = 'article';
update public.research_paper_categories set openalex_types = array['review']
where slug = 'review';
update public.research_paper_categories set openalex_types = array['preprint']
where slug = 'preprint';
update public.research_paper_categories set openalex_types = array['conference-paper']
where slug = 'conference-paper';
update public.research_paper_categories set openalex_types = array['book-chapter']
where slug = 'book-chapter';
update public.research_paper_categories set openalex_types = array[
  'book','book-review','conference-abstract','data-paper','dataset','dissertation',
  'editorial','erratum','letter','libguides','other','paratext','peer-review',
  'reference-entry','report','retraction','software','software-paper','standard',
  'supplementary-materials'
] where slug = 'other';
