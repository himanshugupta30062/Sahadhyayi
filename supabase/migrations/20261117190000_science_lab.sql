-- Science Lab: curated experiments, private journals and opt-in community sharing.
create table if not exists public.science_experiments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 5 and 180),
  summary text not null check (char_length(summary) between 10 and 500),
  category text not null check (category in ('Physics','Chemistry','Biology','Earth Science','Engineering')),
  difficulty text not null default 'Beginner' check (difficulty in ('Beginner','Intermediate','Advanced')),
  duration_minutes integer not null default 15 check (duration_minutes between 1 and 600),
  age_guidance text not null,
  materials jsonb not null default '[]'::jsonb check (jsonb_typeof(materials) = 'array'),
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  science_explanation text not null,
  safety_notes jsonb not null default '[]'::jsonb check (jsonb_typeof(safety_notes) = 'array'),
  image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.science_experiment_attempts (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.science_experiments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  observations text not null check (char_length(observations) between 10 and 3000),
  what_learned text check (what_learned is null or char_length(what_learned) <= 1500),
  worked boolean,
  share_public boolean not null default false,
  status text not null default 'completed' check (status in ('in_progress','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.science_experiment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 160),
  reason text check (reason is null or char_length(reason) <= 1000),
  status text not null default 'pending' check (status in ('pending','reviewing','approved','declined')),
  created_at timestamptz not null default now()
);

create index if not exists science_experiments_published_category_idx
  on public.science_experiments (category, created_at desc) where is_published = true;
create index if not exists science_experiment_attempts_public_created_idx
  on public.science_experiment_attempts (created_at desc) where share_public = true;
create index if not exists science_experiment_attempts_user_created_idx
  on public.science_experiment_attempts (user_id, created_at desc);
create index if not exists science_experiment_requests_user_created_idx
  on public.science_experiment_requests (user_id, created_at desc);

alter table public.science_experiments enable row level security;
alter table public.science_experiment_attempts enable row level security;
alter table public.science_experiment_requests enable row level security;

drop policy if exists "Published science experiments are readable" on public.science_experiments;
create policy "Published science experiments are readable"
  on public.science_experiments for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Users can read public experiment attempts" on public.science_experiment_attempts;
create policy "Users can read public experiment attempts"
  on public.science_experiment_attempts for select to anon, authenticated
  using (share_public = true or (select auth.uid()) = user_id);

drop policy if exists "Users can create their own experiment attempts" on public.science_experiment_attempts;
create policy "Users can create their own experiment attempts"
  on public.science_experiment_attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own experiment attempts" on public.science_experiment_attempts;
create policy "Users can update their own experiment attempts"
  on public.science_experiment_attempts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own experiment attempts" on public.science_experiment_attempts;
create policy "Users can delete their own experiment attempts"
  on public.science_experiment_attempts for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own experiment requests" on public.science_experiment_requests;
create policy "Users can create their own experiment requests"
  on public.science_experiment_requests for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own experiment requests" on public.science_experiment_requests;
create policy "Users can read their own experiment requests"
  on public.science_experiment_requests for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.science_experiments to anon, authenticated;
grant select on public.science_experiment_attempts to anon, authenticated;
grant insert, update, delete on public.science_experiment_attempts to authenticated;
grant select, insert on public.science_experiment_requests to authenticated;

-- Initial curated activities. These are intentionally low-risk, household-material demonstrations.
insert into public.science_experiments
  (slug,title,summary,category,difficulty,duration_minutes,age_guidance,materials,steps,science_explanation,safety_notes,is_published)
values
('paper-bridge','Build a Strong Paper Bridge','Discover how folds and shapes help a simple sheet of paper support more weight.','Engineering','Beginner',15,'Suitable for ages 8+; younger children should have an adult nearby.','["3 sheets of paper","Two books of similar height","Coins or small safe weights"]','["Place the two books a short distance apart to form supports.","Lay one flat sheet of paper across the gap and predict how much it can hold.","Add coins one at a time near the centre and record the result.","Fold another sheet into an accordion shape and repeat with the same gap.","Compare the results and explain which shape performed better."]','Folding changes the geometry and stiffness of the paper. The ridges help distribute loads and resist bending, showing how structural shape can matter as much as material.','["Use only small, light objects as weights.","Keep the bridge low over a table and do not use glass or sharp objects."]',true),
('balloon-static','Bend Water with Static Electricity','Use a charged balloon to explore electric charge and attraction.','Physics','Beginner',10,'Suitable for ages 7+ with adult supervision for younger children.','["Inflated balloon","Dry hair or a woollen cloth","Tap water","A sink or bowl"]','["Turn on a very thin, steady stream of water.","Rub the balloon gently on dry hair or a woollen cloth for about 15 seconds.","Bring the balloon close to the water stream without touching it.","Observe whether the stream bends and repeat after recharging the balloon."]','Rubbing transfers electric charge to the balloon. Its electric field can polarise nearby water molecules, creating an attraction that bends the thin stream.','["Keep the balloon and hands away from electrical outlets and appliances.","Do not use a balloon if latex allergy is a concern; an adult should supervise young children."]',true),
('rainbow-density','Make a Layered Density Tower','Observe how liquids with different densities can form visible layers.','Chemistry','Beginner',20,'Suitable for ages 8+ with adult supervision; do not taste any materials.','["Clear, stable glass or plastic container","Water","Cooking oil","Dish soap","Food colouring","Spoon"]','["Pour water into the container until it is about one-third full.","Add a few drops of food colouring and stir.","Slowly pour an equal amount of dish soap down the side.","Gently add cooking oil as the final layer.","Wait a minute and observe the boundaries between the liquids."]','Liquids can have different densities and different abilities to mix. The layers are influenced by density, polarity and miscibility, not density alone.','["Use a stable, unbreakable container where possible.","Clean spills promptly because oil and soap can make floors slippery.","Do not drink or taste the mixture."]',true),
('seed-germination','Watch a Seed Wake Up','Track germination and discover what a seed needs to begin growing.','Biology','Beginner',10,'Suitable for all ages with an adult helping younger children.','["A few bean seeds","Paper towel or cotton","Transparent jar","Water"]','["Dampen the paper towel so it is moist but not dripping.","Place it inside the jar and tuck a few seeds between the towel and the jar wall.","Keep the jar in a warm place with indirect light.","Check daily and add a little water if the towel begins to dry.","Record when the root and shoot appear and how they change over several days."]','Germination begins when a viable seed absorbs water. Enzymes become active and the embryo uses stored food to grow a root and then a shoot.','["Wash hands after handling seeds and damp materials.","Discard seeds if mould appears; do not smell or handle mould closely."]',true),
('paper-chromatography','Separate the Colours in Ink','Reveal how a single marker colour can contain several pigments.','Chemistry','Beginner',20,'Suitable for ages 8+ with adult supervision.','["Washable, water-based marker","White paper towel or coffee filter","Clear glass","Water","Pencil"]','["Cut a strip of paper towel or coffee filter.","Draw a thick marker line about 2 cm from the bottom edge.","Add a shallow layer of water to the glass, keeping the ink line above the water.","Rest the strip in the glass with only its bottom edge touching the water.","Watch the water travel upward and separate pigments; remove the strip before it reaches the top."]','Water moves through the paper by capillary action. Different pigments travel at different rates because they differ in solubility and attraction to the paper fibres.','["Use washable, water-based markers only; do not use permanent markers or solvents.","Do not drink the water and wash hands after the activity."]',true),
('shadow-clock','Make a Simple Shadow Clock','Use the changing position of a shadow to explore Earth''s rotation.','Earth Science','Beginner',30,'Suitable for ages 8+; an adult should supervise outdoor activity.','["Straight stick or unsharpened pencil","Reusable modelling clay","Chalk or paper","Clock"]','["Stand the stick upright in modelling clay on a flat outdoor surface.","Mark the tip of its shadow and write down the time.","Repeat every 20–30 minutes while the Sun is visible.","Compare the direction and length of the shadow marks.","Discuss how the apparent movement of the Sun relates to Earth''s rotation."]','As Earth rotates, the Sun appears to move across the sky. The direction and length of a stick''s shadow change with the Sun''s apparent position.','["Never look directly at the Sun.","Choose a safe, supervised outdoor location and avoid hot surfaces."]',true),
('parachute','Test a Mini Parachute','Explore air resistance by comparing parachutes made from different materials.','Physics','Beginner',25,'Suitable for ages 8+ with adult supervision.','["Light tissue paper or a thin reusable cloth","String","Paper cup","Tape","Scissors"]','["Cut two parachute canopies of different sizes from the material.","Attach four equal lengths of string to the corners or edges of each canopy.","Tie the strings to the same lightweight paper cup.","From a low, safe height, release each parachute without throwing it.","Compare descent times and repeat to check whether the pattern is consistent."]','A falling parachute experiences gravity downward and air resistance upward. A larger canopy usually creates more drag, slowing the descent.','["Use scissors carefully with adult help where needed.","Drop only from a low height over a clear floor; never use people, animals or fragile objects as targets."]',true),
('water-filter-model','Build a Model Water Filter','See how layers of materials can trap visible particles in dirty-looking water.','Earth Science','Intermediate',25,'Suitable for ages 10+ with adult supervision.','["Clear plastic bottle with adult-prepared opening","Clean gravel","Clean sand","Coffee filter or clean cloth","Container to catch water","Soil mixed with water"]','["Place the bottle securely upside down over a collection container.","Fit a coffee filter or clean cloth at the neck.","Add a layer of clean gravel, then a layer of clean sand.","Slowly pour the soil-water mixture through the layers.","Compare the water before and after and record what changed."]','The layers physically trap some suspended particles as water passes through. This is a model of filtration, not a complete water-treatment process.','["Never drink filtered water from this experiment; it may still contain microbes and dissolved contaminants.","Use clean materials and wash hands after handling soil water.","An adult should prepare the bottle opening and supervise the setup."]',true)
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, category = excluded.category,
  difficulty = excluded.difficulty, duration_minutes = excluded.duration_minutes,
  age_guidance = excluded.age_guidance, materials = excluded.materials, steps = excluded.steps,
  science_explanation = excluded.science_explanation, safety_notes = excluded.safety_notes,
  is_published = true, updated_at = now();
