import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Users, PenLine, Sparkles, Compass, MapPin, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * A single illustrated reading world. Scroll progress moves the reader's car
 * along a winding road; landmark links remain ordinary, accessible navigation.
 */
const stops = [
  { title: "The Library", note: "Find your next world", href: "/library", icon: BookOpen, tone: "sage" },
  { title: "Reading Café", note: "Meet fellow readers", href: "/social", icon: Users, tone: "gold" },
  { title: "Creator's Hill", note: "Write & publish", href: "/stories", icon: PenLine, tone: "rose" },
  { title: "Author's House", note: "Meet the voices", href: "/authors", icon: Sparkles, tone: "violet" },
  { title: "Festival Summit", note: "Events & challenges", href: "/events", icon: Compass, tone: "blue" },
];

const SahadhyayiJourney = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [mood, setMood] = useState("Curious");

  useEffect(() => {
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, el.offsetHeight - window.innerHeight);
      setProgress(Math.max(0, Math.min(1, -rect.top / travel)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const carX = 7 + progress * 84;
  const carY = 78 - Math.sin(progress * Math.PI * 4) * 13;

  return (
    <section ref={sectionRef} aria-label="Explore the Sahadhyayi reading world" className="relative isolate overflow-clip bg-[#F5F0E3] text-[#26352B] dark:bg-[#101813] dark:text-[#EDE8D9]">
      <div className="sticky top-0 z-20 border-b border-[#D7D0BD]/70 bg-[#F5F0E3]/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#101813]/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Compass className="h-4 w-4 text-[#66856B]"/> Your reading adventure</div>
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="hidden sm:inline text-[#68766B] dark:text-[#A6B5A8]">Today I feel</span>
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="rounded-full border border-[#C8D0C0] bg-white/70 px-3 py-2 text-[#34483A] outline-none focus:ring-2 focus:ring-[#91A98D] dark:border-white/15 dark:bg-white/5 dark:text-[#EDE8D9]">
              {["Curious", "Calm", "Inspired", "Adventurous", "Social"].map((item) => <option key={item} className="text-gray-900">{item}</option>)}
            </select>
            <Link to="/library" className="inline-flex items-center gap-1 rounded-full bg-[#355B43] px-3 py-2 font-semibold text-white transition hover:bg-[#264832]">Let's go <ArrowUpRight className="h-3.5 w-3.5"/></Link>
          </label>
        </div>
      </div>

      <div className="relative min-h-[1900px] sm:min-h-[2200px]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-20 top-[4%] h-72 w-72 rounded-full bg-[#E7C98C]/30 blur-3xl"/>
          <div className="absolute right-[-8%] top-[35%] h-96 w-96 rounded-full bg-[#91B7A0]/30 blur-3xl"/>
          <div className="absolute left-[20%] top-[68%] h-80 w-80 rounded-full bg-[#D8A6A2]/25 blur-3xl"/>
          <svg viewBox="0 0 1000 1900" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d="M-80 160 C250 40 680 300 480 500 S100 760 520 920 S950 1160 480 1350 S180 1620 1080 1770" fill="none" stroke="#B5C5A8" strokeWidth="170" strokeLinecap="round" opacity=".42"/>
            <path d="M-80 160 C250 40 680 300 480 500 S100 760 520 920 S950 1160 480 1350 S180 1620 1080 1770" fill="none" stroke="#F9F6ED" strokeWidth="116" strokeLinecap="round" opacity=".9"/>
            <path d="M-80 160 C250 40 680 300 480 500 S100 760 520 920 S950 1160 480 1350 S180 1620 1080 1770" fill="none" stroke="#C7B88D" strokeWidth="2.5" strokeDasharray="12 18" strokeLinecap="round"/>
          </svg>
          {Array.from({length: 18}, (_,i) => <span key={i} className="absolute h-2 w-2 rounded-full bg-[#91A98D]/50" style={{left:`${(i*37)%96}%`,top:`${(i*19)%95}%`}}/> )}
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.24em] text-[#71866F]">A world made of stories</p>
            <h2 className="font-serif text-4xl font-semibold leading-tight sm:text-6xl">Every book takes<br/>you somewhere.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#657166] dark:text-[#B0BDB1]">Take a little drive through Sahadhyayi. Discover books, find your people, and leave a story of your own.</p>
          </div>

          {stops.map((stop, index) => {
            const Icon = stop.icon;
            const positions = ["ml-auto mr-[2%] mt-28 sm:mt-36", "ml-[3%] mt-36 sm:mt-48", "ml-auto mr-[4%] mt-36 sm:mt-48", "ml-[5%] mt-36 sm:mt-48", "ml-auto mr-[2%] mt-36 sm:mt-48"];
            return <div key={stop.title} className={`relative z-10 ${positions[index]} max-w-[280px] sm:max-w-sm`}>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#778775]"><MapPin className="h-4 w-4"/> Stop 0{index+1}</div>
              <Link to={stop.href} className="group block rounded-3xl border border-white/70 bg-white/65 p-5 shadow-[0_18px_50px_-25px_rgba(44,65,47,.35)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/90 dark:border-white/10 dark:bg-[#1B2820]/75 dark:hover:bg-[#24352A]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4EBDD] text-[#47664C] dark:bg-[#344638] dark:text-[#D9E6D1]"><Icon className="h-6 w-6"/></div>
                <h3 className="font-serif text-2xl font-semibold">{stop.title}</h3>
                <p className="mt-1 text-sm text-[#718075] dark:text-[#B0BDB1]">{stop.note}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#48694D] dark:text-[#C4D9B9]">Explore <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"/></span>
              </Link>
            </div>;
          })}
          <div className="mx-auto mt-36 max-w-xl pb-24 text-center sm:mt-48">
            <div className="mb-4 inline-flex rounded-full bg-[#DDE8D5] px-4 py-2 text-xs font-semibold text-[#45634A] dark:bg-[#263A2B] dark:text-[#C8DDBD]">Journey complete · or just beginning</div>
            <h3 className="font-serif text-3xl sm:text-5xl">Your next chapter<br/>starts with a reader.</h3>
            <Link to="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#355B43] px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#264832]">Join the community <ArrowUpRight className="h-4 w-4"/></Link>
          </div>
        </div>

        <div className="pointer-events-none fixed bottom-5 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/60 bg-white/75 px-4 py-2 shadow-lg backdrop-blur md:flex dark:border-white/10 dark:bg-[#17221A]/80" aria-hidden="true">
          <span className="text-xs font-medium text-[#627264] dark:text-[#B9C8B9]">Your journey</span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#DCE4D7]"><div className="h-full rounded-full bg-[#64896A] transition-[width] duration-100" style={{width:`${progress*100}%`}}/></div>
        </div>
        <div className="pointer-events-none absolute left-0 right-0 top-[8%] z-10 hidden sm:block" aria-hidden="true">
          <div className="mx-auto max-w-6xl px-8"><div className="relative h-16 w-24 transition-transform duration-100" style={{transform:`translate(${progress*650}px,${Math.sin(progress*Math.PI*4)*28}px) rotate(${Math.sin(progress*Math.PI*4)*8}deg)`}}>
            <div className="absolute bottom-1 left-2 h-8 w-20 rounded-[50%] bg-[#355B43] shadow-lg"/><div className="absolute bottom-4 left-5 h-7 w-12 rounded-t-[18px] bg-[#D5B16D]"/><div className="absolute bottom-0 left-4 h-4 w-4 rounded-full border-4 border-[#26352B] bg-[#D8D7CC]"/><div className="absolute bottom-0 right-2 h-4 w-4 rounded-full border-4 border-[#26352B] bg-[#D8D7CC]"/><div className="absolute bottom-7 left-8 h-4 w-4 rounded-full bg-[#E8B995]"/>
          </div></div>
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiJourney;
