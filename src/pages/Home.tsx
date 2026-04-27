import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Handshake, MessageCircle, FileText,
  Briefcase, Users, MapPin, Building2, GraduationCap, Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------
function AnimatedCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v));
  useEffect(() => {
    if (!inView) return;
    const c = animate(count, target, { duration: 2, ease: [0.16, 1, 0.3, 1] });
    return c.stop;
  }, [inView, count, target]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// ---------------------------------------------------------------------------
// Scroll reveal
// ---------------------------------------------------------------------------
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const SCHOOLS = [
  'École Polytechnique', 'CentraleSupélec', 'Mines Paris', 'INSA Rouen',
  'Paris-Saclay', 'ESMT', 'ESIGELEC', 'Télécom Paris',
  'INSA Rennes', 'UTT Troyes',
];

const FORUM_THREADS = [
  {
    initials: 'FS', avatarBg: 'bg-rose-100 text-rose-600',
    author: 'Fatou S.',
    tag: 'Logement', tagColor: 'text-rose-600 bg-rose-50 border-rose-100',
    title: 'Recherche Colocataire Massy-Palaiseau, urgent (Centrale)',
    replies: 4, delay: 0,
  },
  {
    initials: 'MD', avatarBg: 'bg-emerald-100 text-emerald-600',
    author: 'Mamadou D.',
    tag: 'Démarches', tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    title: "Comment justifier ses revenus Campus France ? (Garant dispo)",
    replies: 21, delay: 0.08,
  },
  {
    initials: 'AK', avatarBg: 'bg-purple-100 text-purple-600',
    author: 'Aminata K.',
    tag: 'Études', tagColor: 'text-purple-600 bg-purple-50 border-purple-100',
    title: "Retour d'expérience : 1ère année INSA Lyon vs Prépas CPS",
    replies: 8, delay: 0.16,
  },
];

const ALUMNI = [
  {
    name: 'Cheikh Diallo', role: 'Ingénieur Data & IA', promo: '2017',
    company: 'Thales Group', city: 'Paris, France', school: 'Télécom Paris',
    initials: 'CD', avatarBg: 'bg-blue-100 text-blue-700',
    bg: 'https://images.unsplash.com/photo-1550305080-4e029753abcf?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Aïssatou Sy', role: 'Consultante Finance', promo: '2019',
    company: 'Société Générale', city: 'La Défense, France', school: 'HEC Paris',
    initials: 'AS', avatarBg: 'bg-rose-100 text-rose-700',
    bg: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Omar Faye', role: 'Étudiant Chercheur', promo: '2021',
    company: 'Labo CNRS', city: 'Lyon, France', school: 'INSA Lyon',
    initials: 'OF', avatarBg: 'bg-emerald-100 text-emerald-700',
    bg: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Home: React.FC = () => {
  const { currentUser } = useAuth();

  // Drag-to-scroll for alumni strip
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (sliderRef.current?.offsetLeft ?? 0);
    scrollLeft.current = sliderRef.current?.scrollLeft ?? 0;
  };
  const onMouseLeave = () => { isDragging.current = false; };
  const onMouseUp = () => { isDragging.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    sliderRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5;
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden">

      {/* ================================================================== */}
      {/* HERO                                                                 */}
      {/* ================================================================== */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-12 grid lg:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left copy */}
          <Reveal className="lg:col-span-5 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-200/60 border border-zinc-300/50 w-max">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-600">Le réseau par et pour les élèves du CPS</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] text-zinc-900">
              L'esprit <br />
              <span className="text-blue-900">sans</span> frontières.
            </h1>

            <p className="text-zinc-500 text-lg font-medium max-w-md leading-relaxed">
              De Dakar aux plus grandes écoles d'ingénieurs. Un lien indéfectible, une entraide concrète.
            </p>
          </Reveal>

          {/* Right dual portal */}
          <Reveal delay={0.15} className="lg:col-span-7 grid md:grid-cols-2 gap-4">

            {/* Card étudiant */}
            <motion.div
              className="relative bg-white rounded-3xl p-8 flex flex-col justify-between overflow-hidden cursor-pointer group"
              style={{ border: '1px solid rgba(255,255,255,0.4)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 30px -10px rgba(30,58,138,0.06)', minHeight: 380 }}
              whileHover={{ y: -8, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <GraduationCap className="w-7 h-7 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 leading-tight mb-1">Tu arrives en France ?</h2>
                <p className="text-zinc-500 text-sm font-medium mb-6">Étudiants et admis récents.</p>
                <ul className="space-y-2.5 mb-8">
                  {['Trouver un parrain', 'Conseils démarches / Visas', 'Accès au réseau de caution'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-600 font-medium">
                      <Check className="w-4 h-4 text-amber-500 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/register" className="relative z-10 inline-flex items-center gap-2 text-blue-900 font-bold text-sm group-hover:gap-3 transition-all duration-300">
                Rejoindre le pôle accueil <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Card alumni — décalée vers le bas */}
            <motion.div
              className="relative bg-blue-900 rounded-3xl p-8 flex flex-col justify-between overflow-hidden cursor-pointer md:mt-12"
              style={{ minHeight: 380 }}
              whileHover={{ y: -8, boxShadow: '0 30px 60px -20px rgba(30,58,138,0.5)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute -right-20 -bottom-20 w-64 h-64 border-[40px] border-white/5 rounded-full" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight mb-1">Tu es déjà alumni ?</h2>
                <p className="text-white/60 text-sm font-medium mb-6">Diplômés et étudiants en cycle.</p>
                <ul className="space-y-2.5 mb-8">
                  {["Poster une offre de stage", "Devenir garant ou parrain", "Annuaire des anciens"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/80 font-medium">
                      <Check className="w-4 h-4 text-amber-400 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/register" className="relative z-10 inline-flex items-center gap-2 text-white font-bold text-sm hover:gap-3 transition-all duration-300">
                Rendre la pareille <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

          </Reveal>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SOCIAL PROOF BAR                                                     */}
      {/* ================================================================== */}
      <div className="border-y border-zinc-200 bg-white py-8 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 items-center">

          {/* Avatars + texte */}
          <Reveal className="flex items-center gap-4 min-w-max">
            <div className="flex -space-x-3">
              {['FS', 'MD', 'AK'].map((initials, i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'][i]}`}>
                  {initials}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">+4k</div>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">15+ pays · 40+ Top Entreprises</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">La force du réseau académique.</p>
            </div>
          </Reveal>

          {/* Marquee écoles */}
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div className="flex items-center gap-10 animate-marquee whitespace-nowrap" style={{ animation: 'marquee 35s linear infinite' }}>
              {[...SCHOOLS, ...SCHOOLS].map((s, i) => (
                <React.Fragment key={i}>
                  <span className="text-lg font-bold text-zinc-400 flex-shrink-0">{s}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>

      {/* ================================================================== */}
      {/* ACTIONS BENTO                                                        */}
      {/* ================================================================== */}
      <section className="py-24">
        <div className="container mx-auto px-6 md:px-12">
          <Reveal className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-3">
              Pas que des mots.<br />Des <span className="text-amber-500">actions.</span>
            </h2>
            <p className="text-zinc-500 text-lg font-medium max-w-xl">
              L'interface est pensée pour résoudre les problématiques réelles des étudiants CPS en quelques clics.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[280px]">

            {/* Grande carte — Garant */}
            <Reveal className="md:col-span-2">
              <motion.div
                className="h-full relative bg-blue-900 rounded-3xl p-8 md:p-10 flex flex-col justify-end overflow-hidden group cursor-pointer"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/80 to-transparent" />
                <div className="relative z-10 flex justify-between items-end">
                  <div className="max-w-sm">
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white mb-4">
                      <Handshake className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-white leading-none mb-3">Trouver un garant</h3>
                    <p className="text-white/70 text-sm font-medium">Base d'anciens prêts à se porter caution solidaire pour vos logements.</p>
                  </div>
                  <motion.div
                    className="w-12 h-12 rounded-full bg-white text-blue-900 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.div>
            </Reveal>

            {/* Contacter un ancien */}
            <Reveal delay={0.08}>
              <motion.div
                className="h-full bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col justify-between group cursor-pointer hover:border-amber-400 hover:shadow-lg transition-all duration-300"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Contacter un ancien</h3>
                  <p className="text-zinc-500 text-sm font-medium">Filtrez par école, ville ou entreprise pour des conseils concrets.</p>
                </div>
              </motion.div>
            </Reveal>

            {/* Visa & Démarches */}
            <Reveal delay={0.12}>
              <motion.div
                className="h-full bg-zinc-100 border border-zinc-200/50 rounded-3xl p-8 flex flex-col justify-between overflow-hidden group cursor-pointer hover:bg-zinc-200/60 transition-colors"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm text-zinc-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Visa & Démarches</h3>
                  <p className="text-zinc-500 text-sm font-medium">Guides vérifiés par la communauté pour Campus France, OFII, etc.</p>
                </div>
              </motion.div>
            </Reveal>

            {/* Offres de stage */}
            <Reveal delay={0.16} className="md:col-span-2">
              <motion.div
                className="h-full relative bg-blue-900 rounded-3xl p-8 flex items-center justify-between overflow-hidden group cursor-pointer"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/80 to-transparent" />
                <div className="relative z-10 max-w-md">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-white/10 bg-white/5 text-zinc-300 text-xs font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    34 offres actives
                  </div>
                  <h3 className="text-3xl font-bold text-white leading-tight group-hover:text-amber-400 transition-colors">
                    Voir les offres de stage du réseau
                  </h3>
                </div>
                <div className="hidden md:flex relative z-10 w-16 h-16 rounded-2xl bg-white/10 items-center justify-center text-white border border-white/20 group-hover:bg-white group-hover:text-zinc-900 transition-colors duration-300">
                  <Briefcase className="w-7 h-7" />
                </div>
              </motion.div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FORUM PULSE                                                          */}
      {/* ================================================================== */}
      <section className="py-16 md:py-24 border-t border-zinc-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-16 items-start">

          {/* Sticky left */}
          <Reveal className="lg:sticky lg:top-28">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-none mb-4 md:mb-6">
              La communauté <br />
              <span className="bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                en direct.
              </span>
            </h2>
            <p className="text-zinc-500 font-medium text-base md:text-lg mb-6 md:mb-8 max-w-sm">
              Le forum est le cœur battant de la communauté. Posez vos questions, partagez vos doutes, célébrez vos admissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/forum"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-700 text-white font-semibold rounded-full hover:bg-blue-600 transition-all duration-300 text-sm sm:text-base"
              >
                Rejoindre la discussion <MessageCircle className="w-4 h-4" />
              </Link>
              <a
                href="DISCORD_INVITE_LINK"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5865F2] text-white font-semibold rounded-full hover:bg-[#4752c4] transition-all duration-300 text-sm sm:text-base"
              >
                Rejoindre le Discord
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
              </a>
            </div>
          </Reveal>

          {/* Threads */}
          <div className="flex flex-col gap-3">
            {FORUM_THREADS.map((t, i) => (
              <Reveal key={i} delay={t.delay}>
                <Link
                  to="/forum"
                  className="group flex flex-row gap-3 items-center p-4 sm:p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:shadow-md hover:border-zinc-200 transition-all duration-300"
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${t.avatarBg}`}>{t.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider border rounded ${t.tagColor}`}>{t.tag}</span>
                      <span className="text-xs text-zinc-400 font-medium">par {t.author}</span>
                    </div>
                    <p className="font-semibold text-sm sm:text-base text-zinc-900 group-hover:text-blue-900 transition-colors line-clamp-2">{t.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400 text-xs font-medium bg-white px-2.5 py-1.5 rounded-full border border-zinc-100 shadow-sm flex-shrink-0 group-hover:text-blue-900 group-hover:border-blue-900/20 transition-colors">
                    <MessageCircle className="w-3 h-3" /> {t.replies}
                  </div>
                </Link>
              </Reveal>
            ))}

            <Reveal delay={0.2} className="pt-2 text-center">
              <Link to="/forum" className="text-sm font-bold text-zinc-400 hover:text-blue-900 transition-colors border-b border-dashed border-zinc-300 hover:border-blue-900 pb-1">
                Voir toutes les discussions
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* ALUMNI SHOWCASE                                                      */}
      {/* ================================================================== */}
      <section className="py-24 bg-zinc-50 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 mb-10">
          <Reveal>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-1">Le Réseau en action</h2>
            <p className="text-zinc-500 font-medium text-lg">Ils sont passés par là. Découvrez leurs parcours.</p>
          </Reveal>
        </div>

        <div
          ref={sliderRef}
          className="flex gap-5 px-6 md:px-12 pb-6 overflow-x-auto snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: 'none' }}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          {ALUMNI.map((a, i) => (
            <div key={i} className="snap-center flex-shrink-0 w-[280px] md:w-[300px] bg-white rounded-2xl border border-zinc-200 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-28 relative overflow-hidden">
                <img src={a.bg} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent" />
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/90 text-[0.65rem] font-bold tracking-wide uppercase rounded text-blue-900">
                  Promo {a.promo}
                </span>
              </div>
              <div className="px-5 pb-6 pt-10 relative">
                <div className={`w-14 h-14 rounded-full border-4 border-white absolute -top-7 left-4 shadow-sm flex items-center justify-center font-bold text-base ${a.avatarBg}`}>{a.initials}</div>
                <h3 className="font-bold text-lg text-zinc-900">{a.name}</h3>
                <p className="text-zinc-400 text-sm font-medium mb-4">{a.role}</p>
                <div className="space-y-1.5 border-t border-zinc-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" /> {a.company}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" /> {a.city}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <GraduationCap className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" /> {a.school}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Voir l'annuaire */}
          <Link to="/alumni" className="snap-center flex-shrink-0 w-[280px] md:w-[300px] bg-zinc-100 rounded-2xl border border-zinc-200 hover:bg-zinc-200 transition-colors flex flex-col justify-center items-center p-8 text-center group">
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-400 mb-4 group-hover:text-blue-900 group-hover:scale-110 transition-all duration-300">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 mb-1">Voir l'annuaire</h3>
            <p className="text-zinc-500 text-sm font-medium">Recherchez par promotion, ville ou domaine.</p>
          </Link>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA                                                            */}
      {/* ================================================================== */}
      <section className="bg-blue-950 text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
        <Reveal className="container mx-auto px-6 text-center relative z-10">
          <p className="text-amber-400 font-semibold tracking-widest uppercase text-xs mb-6">Le pont entre les générations</p>
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none mb-8">
            On ne réussit jamais{' '}
            <span className="text-zinc-400 italic font-medium">seul.</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 max-w-lg mx-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
            >
              Je cherche un parrain <Handshake className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-blue-400/40 text-blue-100 font-bold rounded-full hover:bg-blue-800 hover:-translate-y-1 transition-all duration-300"
            >
              Rejoindre en tant qu'alumni <GraduationCap className="w-5 h-5" />
            </Link>
          </div>
        </Reveal>
      </section>

    </div>
  );
};

export default Home;
