"use client";

import Link from "next/link";
import { ArrowRight, UploadCloud, Target, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import GridGlowBackground from "@/components/ui/grid-glow-background";
import { GradientCard } from "@/components/ui/gradient-card";

export default function Home() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  return (
    <GridGlowBackground 
      backgroundColor="#000000" 
      glowColors={["#3b82f6", "#8b5cf6", "#3b82f6"]} 
      gridColor="rgba(255,255,255,0.03)"
    >
      <div className="w-full text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* Ultra-minimal Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">TinginCV</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/dashboard">
              <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Launch App &rarr;
              </button>
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="pt-24 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
        {/* Hero Section */}
        <motion.section 
          className="flex flex-col items-center justify-center md:justify-start text-center min-h-[85vh] md:min-h-0 pt-8 md:pt-12 pb-16 md:pb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8 text-xs font-medium text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Precision Resume Analysis
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading tracking-tight mb-6 leading-[1.1] max-w-5xl"
          >
            See exactly how recruiters <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              filter your resume.
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-zinc-400 max-w-3xl mb-10 md:mb-12 font-light leading-relaxed px-4 sm:px-0"
          >
            Stop guessing why you aren't getting interviews. Instantly compare your resume against the job description to uncover missing keywords, formatting errors, and critical skills gaps.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0 mt-4 md:mt-0">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto h-16 md:h-14 px-8 rounded-full bg-white text-black font-semibold text-lg md:text-base flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Analyze My Resume
                <ArrowRight className="w-5 h-5 md:w-4 md:h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.section>

        {/* Feature Grid */}
        <motion.section 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-12 md:pt-20 border-t border-white/5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {[
            {
              icon: <UploadCloud className="w-5 h-5 text-blue-400" />,
              title: "Frictionless Analysis",
              desc: "No accounts. No credit cards. Just drag and drop your PDF and paste the JD for an instant score."
            },
            {
              icon: <Target className="w-5 h-5 text-purple-400" />,
              title: "Surgical Precision",
              desc: "We analyze semantic density, hard skill alignment, and structural formatting exactly like Workday or Greenhouse."
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
              title: "Absolute Privacy",
              desc: "Your data never leaves your browser's local storage. We don't store, train on, or sell your personal documents."
            }
          ].map((feature, i) => (
            <motion.div key={i} variants={itemVariants} className="h-full">
              <GradientCard 
                title={feature.title}
                description={feature.desc}
                icon={feature.icon}
              />
            </motion.div>
          ))}
        </motion.section>
      </main>

      <footer className="border-t border-white/5 py-8 mt-20 text-center text-zinc-600 text-sm">
        <p>Built for the modern job seeker. © 2024 TinginCV.</p>
      </footer>
    </div>
    </GridGlowBackground>
  );
}
