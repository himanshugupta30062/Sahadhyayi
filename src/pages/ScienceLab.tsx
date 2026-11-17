import { useCallback, useEffect, useMemo, useState } from "react";
import { Beaker, BookOpen, CheckCircle2, Clock3, FlaskConical, Lightbulb, Loader2, Search, Send, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client-universal";
import { toast } from "sonner";

type Experiment = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration_minutes: number;
  age_guidance: string;
  materials: string[];
  steps: string[];
  science_explanation: string;
  safety_notes: string[];
  image_url: string | null;
};

type ScienceAiFeedback = {
  summary: string;
  science_connection: string;
  what_went_well: string[];
  possible_reasons: string[];
  next_steps: string[];
  safety_reminder: string;
};

type ExperimentAttempt = {
  id: string;
  experiment_id: string;
  observations: string;
  what_learned: string | null;
  worked: boolean | null;
  created_at: string;
  ai_feedback?: ScienceAiFeedback | null;
  moderation_status?: "private" | "pending" | "approved" | "rejected";
  mediaUrls?: Array<{ url: string; media_type: "image" | "video" }>;
  experiment?: Pick<Experiment, "title" | "slug" | "category"> | null;
};

const CATEGORIES = ["All", "Physics", "Chemistry", "Biology", "Earth Science", "Engineering"];

const FALLBACK_EXPERIMENTS: Experiment[] = [
  {
    id: "paper-bridge", slug: "paper-bridge", title: "Build a Strong Paper Bridge",
    summary: "Discover how folds and shapes help a simple sheet of paper support more weight.",
    category: "Engineering", difficulty: "Beginner", duration_minutes: 15, age_guidance: "Suitable for ages 8+; younger children should have an adult nearby.",
    materials: ["3 sheets of paper", "Two books of similar height", "Coins or small safe weights"],
    steps: ["Place the two books a short distance apart to form supports.", "Lay one flat sheet of paper across the gap and predict how much it can hold.", "Add coins one at a time near the centre and record the result.", "Fold another sheet into an accordion shape and repeat with the same gap.", "Compare the results and explain which shape performed better."],
    science_explanation: "Folding changes the geometry and stiffness of the paper. The ridges help distribute loads and resist bending, showing how structural shape can matter as much as material.",
    safety_notes: ["Use only small, light objects as weights.", "Keep the bridge low over a table and do not use glass or sharp objects."], image_url: null,
  },
  {
    id: "balloon-static", slug: "balloon-static", title: "Bend Water with Static Electricity",
    summary: "Use a charged balloon to explore electric charge and attraction.",
    category: "Physics", difficulty: "Beginner", duration_minutes: 10, age_guidance: "Suitable for ages 7+ with adult supervision for younger children.",
    materials: ["Inflated balloon", "Dry hair or a woollen cloth", "Tap water", "A sink or bowl"],
    steps: ["Turn on a very thin, steady stream of water.", "Rub the balloon gently on dry hair or a woollen cloth for about 15 seconds.", "Bring the balloon close to the water stream without touching it.", "Observe whether the stream bends and repeat after recharging the balloon."],
    science_explanation: "Rubbing transfers electric charge to the balloon. Its electric field can polarise nearby water molecules, creating an attraction that bends the thin stream.",
    safety_notes: ["Keep the balloon and hands away from electrical outlets and appliances.", "Do not use a balloon if latex allergy is a concern; an adult should supervise young children."], image_url: null,
  },
  {
    id: "rainbow-density", slug: "rainbow-density", title: "Make a Layered Density Tower",
    summary: "Observe how liquids with different densities can form visible layers.",
    category: "Chemistry", difficulty: "Beginner", duration_minutes: 20, age_guidance: "Suitable for ages 8+ with adult supervision; do not taste any materials.",
    materials: ["Clear, stable glass or plastic container", "Water", "Cooking oil", "Dish soap", "Food colouring", "Spoon"],
    steps: ["Pour water into the container until it is about one-third full.", "Add a few drops of food colouring and stir.", "Slowly pour an equal amount of dish soap down the side.", "Gently add cooking oil as the final layer.", "Wait a minute and observe the boundaries between the liquids."],
    science_explanation: "Liquids can have different densities and different abilities to mix. The layers are influenced by density, polarity and miscibility, not density alone.",
    safety_notes: ["Use a stable, unbreakable container where possible.", "Clean spills promptly because oil and soap can make floors slippery.", "Do not drink or taste the mixture."], image_url: null,
  },
  {
    id: "seed-germination", slug: "seed-germination", title: "Watch a Seed Wake Up",
    summary: "Track germination and discover what a seed needs to begin growing.",
    category: "Biology", difficulty: "Beginner", duration_minutes: 10, age_guidance: "Suitable for all ages with an adult helping younger children.",
    materials: ["A few bean seeds", "Paper towel or cotton", "Transparent jar", "Water"],
    steps: ["Dampen the paper towel so it is moist but not dripping.", "Place it inside the jar and tuck a few seeds between the towel and the jar wall.", "Keep the jar in a warm place with indirect light.", "Check daily and add a little water if the towel begins to dry.", "Record when the root and shoot appear and how they change over several days."],
    science_explanation: "Germination begins when a viable seed absorbs water. Enzymes become active and the embryo uses stored food to grow a root and then a shoot.",
    safety_notes: ["Wash hands after handling seeds and damp materials.", "Discard seeds if mould appears; do not smell or handle mould closely."], image_url: null,
  },
  {
    id: "paper-chromatography", slug: "paper-chromatography", title: "Separate the Colours in Ink",
    summary: "Reveal how a single marker colour can contain several pigments.",
    category: "Chemistry", difficulty: "Beginner", duration_minutes: 20, age_guidance: "Suitable for ages 8+ with adult supervision.",
    materials: ["Washable, water-based marker", "White paper towel or coffee filter", "Clear glass", "Water", "Pencil"],
    steps: ["Cut a strip of paper towel or coffee filter.", "Draw a thick marker line about 2 cm from the bottom edge.", "Add a shallow layer of water to the glass, keeping the ink line above the water.", "Rest the strip in the glass with only its bottom edge touching the water.", "Watch the water travel upward and separate pigments; remove the strip before it reaches the top."],
    science_explanation: "Water moves through the paper by capillary action. Different pigments travel at different rates because they differ in solubility and attraction to the paper fibres.",
    safety_notes: ["Use washable, water-based markers only; do not use permanent markers or solvents.", "Do not drink the water and wash hands after the activity."], image_url: null,
  },
  {
    id: "shadow-clock", slug: "shadow-clock", title: "Make a Simple Shadow Clock",
    summary: "Use the changing position of a shadow to explore Earth's rotation.",
    category: "Earth Science", difficulty: "Beginner", duration_minutes: 30, age_guidance: "Suitable for ages 8+; an adult should supervise outdoor activity.",
    materials: ["Straight stick or unsharpened pencil", "Reusable modelling clay", "Chalk or paper", "Clock"],
    steps: ["Stand the stick upright in modelling clay on a flat outdoor surface.", "Mark the tip of its shadow and write down the time.", "Repeat every 20–30 minutes while the Sun is visible.", "Compare the direction and length of the shadow marks.", "Discuss how the apparent movement of the Sun relates to Earth's rotation."],
    science_explanation: "As Earth rotates, the Sun appears to move across the sky. The direction and length of a stick's shadow change with the Sun's apparent position.",
    safety_notes: ["Never look directly at the Sun.", "Choose a safe, supervised outdoor location and avoid hot surfaces."], image_url: null,
  },
  {
    id: "parachute", slug: "parachute", title: "Test a Mini Parachute",
    summary: "Explore air resistance by comparing parachutes made from different materials.",
    category: "Physics", difficulty: "Beginner", duration_minutes: 25, age_guidance: "Suitable for ages 8+ with adult supervision.",
    materials: ["Light tissue paper or a thin reusable cloth", "String", "Paper cup", "Tape", "Scissors"],
    steps: ["Cut two parachute canopies of different sizes from the material.", "Attach four equal lengths of string to the corners or edges of each canopy.", "Tie the strings to the same lightweight paper cup.", "From a low, safe height, release each parachute without throwing it.", "Compare descent times and repeat to check whether the pattern is consistent."],
    science_explanation: "A falling parachute experiences gravity downward and air resistance upward. A larger canopy usually creates more drag, slowing the descent.",
    safety_notes: ["Use scissors carefully with adult help where needed.", "Drop only from a low height over a clear floor; never use people, animals or fragile objects as targets."], image_url: null,
  },
  {
    id: "water-filter-model", slug: "water-filter-model", title: "Build a Model Water Filter",
    summary: "See how layers of materials can trap visible particles in dirty-looking water.",
    category: "Earth Science", difficulty: "Intermediate", duration_minutes: 25, age_guidance: "Suitable for ages 10+ with adult supervision.",
    materials: ["Clear plastic bottle with adult-prepared opening", "Clean gravel", "Clean sand", "Coffee filter or clean cloth", "Container to catch water", "Soil mixed with water"],
    steps: ["Place the bottle securely upside down over a collection container.", "Fit a coffee filter or clean cloth at the neck.", "Add a layer of clean gravel, then a layer of clean sand.", "Slowly pour the soil-water mixture through the layers.", "Compare the water before and after and record what changed."],
    science_explanation: "The layers physically trap some suspended particles as water passes through. This is a model of filtration, not a complete water-treatment process.",
    safety_notes: ["Never drink filtered water from this experiment; it may still contain microbes and dissolved contaminants.", "Use clean materials and wash hands after handling soil water.", "An adult should prepare the bottle opening and supervise the setup."], image_url: null,
  },
];

const difficultyTone: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Intermediate: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Advanced: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function ScienceLab() {
  const [experiments, setExperiments] = useState<Experiment[]>(FALLBACK_EXPERIMENTS);
  const [attempts, setAttempts] = useState<ExperimentAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<"discover" | "community" | "mine">("discover");
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [aiFeedback, setAiFeedback] = useState<ScienceAiFeedback | null>(null);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [observations, setObservations] = useState("");
  const [whatLearned, setWhatLearned] = useState("");
  const [worked, setWorked] = useState("yes");
  const [sharePublic, setSharePublic] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catalogResult, communityResult] = await Promise.all([
      supabase.from("science_experiments" as any).select("*").eq("is_published", true).order("created_at", { ascending: false }),
      supabase.from("science_experiment_attempts" as any).select("id,experiment_id,observations,what_learned,worked,created_at,ai_feedback,experiment:science_experiments(title,slug,category)").eq("share_public", true).eq("moderation_status", "approved").order("created_at", { ascending: false }).limit(30),
    ]);
    if (!catalogResult.error && Array.isArray(catalogResult.data) && catalogResult.data.length) {
      setExperiments(catalogResult.data as unknown as Experiment[]);
    }
    if (!communityResult.error && Array.isArray(communityResult.data)) {
      setAttempts(communityResult.data as unknown as ExperimentAttempt[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredExperiments = useMemo(() => experiments.filter((experiment) => {
    const matchesCategory = category === "All" || experiment.category === category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [experiment.title, experiment.summary, experiment.category, ...experiment.materials].join(" ").toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }), [experiments, category, search]);

  const loadMyAttempts = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      toast.error("Sign in to view your experiment journal.");
      return;
    }
    const { data, error } = await supabase.from("science_experiment_attempts" as any)
      .select("id,experiment_id,observations,what_learned,worked,created_at,ai_feedback,moderation_status,experiment:science_experiments(title,slug,category),media:science_experiment_media(storage_path,media_type)")
      .eq("user_id", authData.user.id).order("created_at", { ascending: false }).limit(50);
    if (error) { toast.error("Could not load your experiment journal."); return; }
    const withMedia = await Promise.all((data ?? []).map(async (row: any) => {
      const mediaRows = Array.isArray(row.media) ? row.media : [];
      const mediaUrls = await Promise.all(mediaRows.map(async (media: any) => {
        const { data: signed } = await supabase.storage.from("science-experiment-media").createSignedUrl(media.storage_path, 3600);
        return signed?.signedUrl ? { url: signed.signedUrl, media_type: media.media_type as "image" | "video" } : null;
      }));
      return { ...row, mediaUrls: mediaUrls.filter(Boolean) };
    }));
    setAttempts(withMedia as unknown as ExperimentAttempt[]);
    setActiveTab("mine");
  };

  const startLogging = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      toast.error("Please sign in to record your experiment.");
      window.location.assign("/signin?redirect=" + encodeURIComponent("/science-lab"));
      return;
    }
    setAiFeedback(null);
    setMediaFiles([]);
    setShowLog(true);
  };

  const handleMediaSelection = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
    if (selectedFiles.length > 3) { toast.error("Choose up to 3 photos or videos."); return; }
    if (selectedFiles.some((file) => !allowed.has(file.type))) { toast.error("Use JPG, PNG, WebP, MP4 or WebM files only."); return; }
    if (selectedFiles.some((file) => file.size > (file.type.startsWith("video/") ? 25 : 10) * 1024 * 1024)) {
      toast.error("Each photo must be 10 MB or less and each video 25 MB or less."); return;
    }
    if (selectedFiles.reduce((total, file) => total + file.size, 0) > 30 * 1024 * 1024) {
      toast.error("The total upload limit is 30 MB."); return;
    }
    setMediaFiles(selectedFiles);
  };

  const submitAttempt = async () => {
    if (!selected || observations.trim().length < 10) {
      toast.error("Please add at least a short observation (10 characters).");
      return;
    }
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setSaving(false);
      toast.error("Your session has expired. Please sign in again.");
      return;
    }

    const { data: savedAttempt, error } = await supabase.from("science_experiment_attempts" as any)
      .insert({
        experiment_id: selected.id,
        user_id: authData.user.id,
        observations: observations.trim(),
        what_learned: whatLearned.trim() || null,
        worked: worked === "yes" ? true : worked === "no" ? false : null,
        share_public: sharePublic,
        status: "completed",
      })
      .select("id")
      .single();

    if (error || !savedAttempt?.id) {
      setSaving(false);
      toast.error("Your experiment could not be saved. Please try again.");
      return;
    }

    const attemptId = savedAttempt.id as string;
    const uploadedPaths: string[] = [];
    let uploadFailed = false;

    for (const file of mediaFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-90) || "experiment-media";
      const path = `${authData.user.id}/${attemptId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("science-experiment-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { uploadFailed = true; break; }

      const { error: metadataError } = await supabase.from("science_experiment_media" as any).insert({
        attempt_id: attemptId,
        user_id: authData.user.id,
        storage_path: path,
        media_type: file.type.startsWith("video/") ? "video" : "image",
        mime_type: file.type,
        size_bytes: file.size,
        caption: null,
      });
      if (metadataError) {
        await supabase.storage.from("science-experiment-media").remove([path]);
        uploadFailed = true;
        break;
      }
      uploadedPaths.push(path);
    }

    if (uploadFailed) {
      await supabase.from("science_experiment_media" as any).delete().eq("attempt_id", attemptId);
      if (uploadedPaths.length) await supabase.storage.from("science-experiment-media").remove(uploadedPaths);
      toast.warning("Your experiment notes were saved, but the media could not be uploaded. You can submit the media with a new journal entry.");
    }

    setAiReviewing(true);
    const firstImageIndex = mediaFiles.findIndex((file) => file.type.startsWith("image/"));
    const imagePath = firstImageIndex >= 0 ? uploadedPaths[firstImageIndex] ?? null : null;
    const { data: aiResult, error: aiError } = await supabase.functions.invoke("science-lab-review", {
      body: { attemptId, imagePath },
    });
    setAiReviewing(false);
    setSaving(false);

    if (!aiError && aiResult?.feedback) {
      setAiFeedback(aiResult.feedback as ScienceAiFeedback);
    } else {
      toast.warning("Your experiment was saved. AI feedback is temporarily unavailable.");
    }
    toast.success(sharePublic ? "Experiment saved. It will appear in the community after moderation approval." : "Experiment saved privately in your journal.");
    setShowLog(false);
    setObservations("");
    setWhatLearned("");
    setMediaFiles([]);
    await loadData();
  };

  const submitRequest = async () => {
    if (requestTitle.trim().length < 5) { toast.error("Please describe the experiment you want to try."); return; }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      toast.error("Sign in to request an experiment.");
      window.location.assign("/signin?redirect=" + encodeURIComponent("/science-lab"));
      return;
    }
    const { error } = await supabase.from("science_experiment_requests" as any).insert({
      user_id: authData.user.id, title: requestTitle.trim(), reason: requestReason.trim() || null,
    });
    if (error) { toast.error("Your request could not be submitted."); return; }
    toast.success("Thanks! Your experiment idea has been sent for review.");
    setRequestTitle("");
    setRequestReason("");
    setShowRequest(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO title="Science Lab | Sahadhyayi" description="Try safe, hands-on science experiments, record what you observe and learn with the Sahadhyayi community." canonical="https://www.sahadhyayi.com/science-lab" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-500/10 via-background to-cyan-500/10 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[28px] border-emerald-500/5" />
          <div className="relative max-w-3xl">
            <Badge className="mb-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><FlaskConical className="mr-1 h-3.5 w-3.5" /> Read & Write · Science Lab</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Don't just read science. <span className="text-emerald-600 dark:text-emerald-400">Experience it.</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Explore simple experiments, try them at home, record what really happened and learn from other curious minds.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => document.getElementById("experiment-discovery")?.scrollIntoView({ behavior: "smooth" })}><Beaker className="mr-2 h-4 w-4" /> Explore experiments</Button>
              <Button variant="outline" onClick={() => setShowRequest(true)}>Request an experiment</Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Safety-first activities</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Learn together</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Understand the science</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <Button size="sm" variant={activeTab === "discover" ? "default" : "ghost"} onClick={() => setActiveTab("discover")}>Discover</Button>
          <Button size="sm" variant={activeTab === "community" ? "default" : "ghost"} onClick={() => setActiveTab("community")}>Community results</Button>
          <Button size="sm" variant={activeTab === "mine" ? "default" : "ghost"} onClick={() => void loadMyAttempts()}>My experiment journal</Button>
        </div>

        {activeTab === "discover" && (
          <section id="experiment-discovery" className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div><h2 className="text-2xl font-bold">Find your next experiment</h2><p className="mt-1 text-sm text-muted-foreground">Start with everyday materials and a curious question.</p></div>
              <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search experiments or materials..." className="pl-9" /></div>
            </div>
            <div className="flex flex-wrap gap-2">{CATEGORIES.map((item) => <Button key={item} size="sm" variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)}>{item}</Button>)}</div>
            {loading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
            {!loading && filteredExperiments.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No experiments match that search. Try another keyword or category.</CardContent></Card>}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredExperiments.map((experiment) => (
                <Card key={experiment.id} className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-background"><FlaskConical className="h-12 w-12 text-emerald-600/70 dark:text-emerald-400/70" /></div>
                  <CardHeader className="pb-2"><div className="mb-2 flex flex-wrap gap-2"><Badge variant="secondary">{experiment.category}</Badge><span className={"rounded-full px-2 py-0.5 text-xs font-medium " + (difficultyTone[experiment.difficulty] || "")}>{experiment.difficulty}</span></div><CardTitle className="text-lg">{experiment.title}</CardTitle><CardDescription className="line-clamp-2">{experiment.summary}</CardDescription></CardHeader>
                  <CardContent className="mt-auto space-y-4"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> About {experiment.duration_minutes} minutes <span className="px-1">·</span>{experiment.materials.length} materials</div><Button className="w-full" variant="outline" onClick={() => { setSelected(experiment); setShowLog(false); }}>View experiment <Sparkles className="ml-2 h-4 w-4" /></Button></CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {activeTab !== "discover" && (
          <section className="space-y-5">
            <div><h2 className="text-2xl font-bold">{activeTab === "community" ? "What readers discovered" : "Your experiment journal"}</h2><p className="mt-1 text-sm text-muted-foreground">{activeTab === "community" ? "Real observations shared by the Sahadhyayi community." : "A record of the experiments you have tried."}</p></div>
            {attempts.length === 0 ? <Card><CardContent className="py-12 text-center"><FlaskConical className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No experiment notes yet</p><p className="mt-1 text-sm text-muted-foreground">Try an experiment and share what you discover.</p><Button className="mt-4" onClick={() => setActiveTab("discover")}>Explore experiments</Button></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{attempts.map((attempt) => <Card key={attempt.id}><CardHeader className="pb-2"><div className="flex items-center justify-between gap-2"><Badge variant="secondary">{attempt.experiment?.category || "Science"}</Badge><span className="text-xs text-muted-foreground">{new Date(attempt.created_at).toLocaleDateString()}</span></div><CardTitle className="text-base">{attempt.experiment?.title || "Science experiment"}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-muted px-2 py-1">{attempt.moderation_status === "approved" ? "Community approved" : attempt.moderation_status === "rejected" ? "Not approved for community" : attempt.moderation_status === "pending" ? "Awaiting moderation" : "Private journal"}</span></div><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{attempt.observations}</p>{attempt.what_learned && <div className="rounded-lg bg-muted/50 p-3"><p className="mb-1 text-xs font-semibold">What they learned</p><p className="text-sm">{attempt.what_learned}</p></div>}{attempt.mediaUrls && attempt.mediaUrls.length > 0 && <div className="grid grid-cols-2 gap-2">{attempt.mediaUrls.map((media, index) => media.media_type === "image" ? <img key={media.url} src={media.url} alt={`Experiment upload ${index + 1}`} className="aspect-video w-full rounded-lg object-cover" loading="lazy" /> : <video key={media.url} src={media.url} controls playsInline className="aspect-video w-full rounded-lg bg-black" />)}</div>}{attempt.ai_feedback && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"><p className="mb-1 flex items-center gap-1 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5" /> Gemini Science Review</p><p className="text-sm leading-6">{attempt.ai_feedback.summary}</p></div>}{attempt.worked !== null && <p className="flex items-center gap-2 text-xs">{attempt.worked ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Lightbulb className="h-4 w-4 text-amber-600" />}{attempt.worked ? "The experiment worked as expected" : "The result was different or didn't work"}</p>}</CardContent></Card>)}</div>}
          </section>
        )}

        <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Have an experiment in mind?</h3><p className="mt-1 text-sm text-muted-foreground">Suggest an idea for the Science Lab team to review.</p></div><Button variant="outline" onClick={() => setShowRequest(true)}>Request an experiment</Button></div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="experiment-title">
          <div className="mx-auto my-4 max-w-3xl rounded-2xl border border-border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 p-4 backdrop-blur"><div className="flex flex-wrap items-center gap-2"><Badge>{selected.category}</Badge><Badge variant="outline">{selected.difficulty}</Badge></div><Button variant="ghost" size="icon" aria-label="Close experiment" onClick={() => { setSelected(null); setShowLog(false); }}><X className="h-4 w-4" /></Button></div>
            <div className="space-y-6 p-5 sm:p-7">
              <div><h2 id="experiment-title" className="text-2xl font-bold sm:text-3xl">{selected.title}</h2><p className="mt-2 text-muted-foreground">{selected.summary}</p><p className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {selected.duration_minutes} min</span><span>{selected.age_guidance}</span></p></div>
              <div><h3 className="mb-2 font-semibold">What you'll need</h3><ul className="grid gap-2 sm:grid-cols-2">{selected.materials.map((material) => <li key={material} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{material}</li>)}</ul></div>
              <div><h3 className="mb-3 font-semibold">Step-by-step instructions</h3><ol className="space-y-3">{selected.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol></div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><h3 className="mb-2 flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-emerald-600" /> What's the science?</h3><p className="text-sm leading-6 text-muted-foreground">{selected.science_explanation}</p></div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><h3 className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-amber-600" /> Safety first</h3><ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{selected.safety_notes.map((note) => <li key={note}>{note}</li>)}</ul></div>
              {!showLog ? <Button className="w-full" onClick={() => void startLogging()}><Beaker className="mr-2 h-4 w-4" /> I've tried this — record my results</Button> : <div className="space-y-4 rounded-xl border border-border p-4"><h3 className="font-semibold">Record your experiment</h3><div><label className="mb-2 block text-sm font-medium" htmlFor="science-observations">What did you observe? *</label><Textarea id="science-observations" value={observations} onChange={(event) => setObservations(event.target.value.slice(0, 3000))} placeholder="Describe what happened. Include anything unexpected..." rows={4} maxLength={3000} /><p className="mt-1 text-right text-xs text-muted-foreground">{observations.length}/3000</p></div><div><label className="mb-2 block text-sm font-medium" htmlFor="science-learning">What did you learn? (optional)</label><Textarea id="science-learning" value={whatLearned} onChange={(event) => setWhatLearned(event.target.value.slice(0, 1500))} placeholder="What did this experiment help you understand?" rows={3} maxLength={1500} /></div><div><span className="mb-2 block text-sm font-medium">Did it work as expected?</span><div className="flex flex-wrap gap-2">{[{value:"yes",label:"Yes"},{value:"no",label:"No / different result"},{value:"unsure",label:"Not sure"}].map((option) => <Button key={option.value} size="sm" type="button" variant={worked === option.value ? "default" : "outline"} onClick={() => setWorked(option.value)}>{option.label}</Button>)}</div></div><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={sharePublic} onChange={(event) => setSharePublic(event.target.checked)} className="mt-1" /><span>Request community sharing. Your text will be reviewed by a moderator before it appears publicly. Uploaded photos and videos remain private and are never published.</span></label><div><label htmlFor="science-media" className="mb-2 block text-sm font-medium">Add photos or a short video (optional)</label><Input id="science-media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={(event) => handleMediaSelection(event.target.files)} className="h-auto py-2" /><p className="mt-1 text-xs text-muted-foreground">Up to 3 files · photos up to 8 MB each · videos up to 25 MB each · 30 MB total. Uploads stay private in this release; community media sharing is not enabled yet. Gemini reviews your notes and one optional photo; video analysis is coming later.</p>{mediaFiles.length > 0 && <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{mediaFiles.map((file) => <li key={file.name} className="flex items-center justify-between gap-2"><span className="truncate">{file.name}</span><span>{(file.size / 1024 / 1024).toFixed(1)} MB</span></li>)}</ul>}</div><Button className="w-full" disabled={saving || aiReviewing} onClick={() => void submitAttempt()}>{saving || aiReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{aiReviewing ? "AI is reviewing your experiment..." : "Save results & get AI feedback"}</Button></div>}
            </div>
          </div>
        </div>
      )}

      {aiFeedback && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-3" role="dialog" aria-modal="true" aria-labelledby="science-ai-feedback-title">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3"><div><Badge className="mb-2"><Sparkles className="mr-1 h-3 w-3" /> Gemini Science Guide</Badge><h2 id="science-ai-feedback-title" className="text-2xl font-bold">Your experiment review</h2></div><Button size="icon" variant="ghost" aria-label="Close AI feedback" onClick={() => setAiFeedback(null)}><X className="h-4 w-4" /></Button></div>
            <p className="text-sm leading-6 text-muted-foreground">{aiFeedback.summary}</p>
            <div className="mt-4 rounded-xl bg-emerald-500/5 p-4"><h3 className="mb-1 font-semibold">The science behind it</h3><p className="text-sm leading-6">{aiFeedback.science_connection}</p></div>
            {[{title:"What you did well",items:aiFeedback.what_went_well},{title:"What might explain your result",items:aiFeedback.possible_reasons},{title:"Try this next",items:aiFeedback.next_steps}].map((section) => <div key={section.title} className="mt-4"><h3 className="mb-2 font-semibold">{section.title}</h3><ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{section.items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"><p className="text-sm"><strong>Safety reminder:</strong> {aiFeedback.safety_reminder}</p></div>
            <Button className="mt-5 w-full" onClick={() => setAiFeedback(null)}>Continue exploring</Button>
          </div>
        </div>
      )}

      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3" role="dialog" aria-modal="true" aria-labelledby="request-experiment-title">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between"><h2 id="request-experiment-title" className="text-xl font-bold">Request an experiment</h2><Button size="icon" variant="ghost" aria-label="Close request form" onClick={() => setShowRequest(false)}><X className="h-4 w-4" /></Button></div>
            <p className="mb-4 text-sm text-muted-foreground">Tell us what you'd like to investigate. Our team will review it for scientific accuracy and safety.</p>
            <div className="space-y-3"><div><label htmlFor="request-title" className="mb-1.5 block text-sm font-medium">What would you like to try? *</label><Input id="request-title" value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} placeholder="e.g. Make a simple periscope" maxLength={160} /></div><div><label htmlFor="request-reason" className="mb-1.5 block text-sm font-medium">What are you curious about? (optional)</label><Textarea id="request-reason" value={requestReason} onChange={(event) => setRequestReason(event.target.value)} rows={3} maxLength={1000} placeholder="Describe the question you'd like the experiment to answer." /></div><Button className="w-full" onClick={() => void submitRequest()}><Send className="mr-2 h-4 w-4" />Submit idea</Button></div>
          </div>
        </div>
      )}
    </main>
  );
}
