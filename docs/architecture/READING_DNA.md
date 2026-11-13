# Architecture: Reading DNA Mathematical & Narrative Compatibility

## 1. Mathematical Taste Modeling

Reading taste is represented as a high-dimensional sparse vector comprising:
1. **Genres Vector**: Normalized frequency distribution across literary genres $\vec{G}$.
2. **Moods & Themes**: Multi-label discrete tone attributes $\vec{M}, \vec{T}$.
3. **Pace**: Reading tempo categorizations (fast, moderate, slow).

### Similarity Calculation
$$\text{Score} = 0.50 \cdot \text{Cosine}(\vec{G}_A, \vec{G}_B) + 0.30 \cdot \text{Jaccard}(M_A, M_B) + 0.15 \cdot \text{Jaccard}(T_A, T_B) + 0.05 \cdot \text{PaceMatch}$$

Where:
- $\text{Cosine}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$, bounded safely in $[0, 1]$.
- $\text{Jaccard}(X, Y) = \frac{|X \cap Y|}{|X \cup Y|}$.

## 2. Confidence Level & Preventing Misleading Precision
When readers have logged only 1 or 2 books, reporting a 94.3% taste match is misleading. Sahadhyayi classifies match confidence into:
- `high`: Both profiles have $\ge 6$ logged genres and detailed mood/theme annotations.
- `moderate`: Both profiles have $\ge 2$ genres.
- `emerging`: Insufficient shelf history; displayed with an "Emerging Taste Profile" badge and encouragement to log more reads.

## 3. Explainable Natural Language Synthesis
Instead of presenting a black-box percentage, the engine generates conversational breakdowns:
- *"Your reading tastes align because you both enjoy Historical Fiction with melancholic and atmospheric tones at a similar reading pace."*
- Highlights mutual shelf books with respective star ratings.
- Surfaces complementary genres ("Genres to Discover") to foster intellectual curiosity.

## 4. Privacy Model
Reading DNA supports 3 visibility tiers (`public`, `friends`, `private`) enforced via database check constraints and Supabase RLS. Private DNA is never indexed or suggested in reader discovery.
