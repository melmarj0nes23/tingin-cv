"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Zap, ChevronLeft, CheckCircle2, AlertTriangle, AlertCircle, Copy, BarChart3, Target, Sparkles, Clock, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AnalysisResult {
  matchScore: number;
  scores: {
    keyword: number;
    skills: number;
    experience: number;
    education: number;
    formatting: number;
  };
  skillsGap: Array<{ skill: string; status: "Present" | "Weak" | "Missing" }>;
  feedback: string;
  atsRejectionReason: string;
  optimizedBullets: Array<{ original: string; optimized: string; explanation: string }>;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  fileName: string;
  jobTitlePreview: string;
  data: AnalysisResult;
  resumeText: string;
  jobDescription: string;
  rewrittenResume?: RewrittenResume;
}

interface RewrittenResume {
  personalInfo: { name: string; contact: string; };
  professionalSummary: string;
  experience: Array<{ title: string; company: string; dates: string; bullets: string[]; }>;
  education: Array<{ degree: string; school: string; dates: string; }>;
  skills: string[];
}

export default function DashboardPage() {
  const [step, setStep] = useState<"setup" | "results">("setup");
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenResume, setRewrittenResume] = useState<RewrittenResume | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const historyData = localStorage.getItem("tingincv_history");
    if (historyData) {
      try {
        setHistory(JSON.parse(historyData));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload your resume.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Resume file is too large. Please upload a file under 2MB.");
      return;
    }
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf") && !fileName.endsWith(".docx")) {
      setError("Invalid file type. Only PDF and DOCX files are allowed.");
      return;
    }
    if (!jobDescription) {
      setError("Please paste the job description.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 40) return prev + 2;
        if (prev < 70) return prev + 1;
        if (prev < 90) return prev + 0.5;
        if (prev < 98) return prev + 0.1;
        return prev;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const parseRes = await fetch("/api/parse", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Failed to parse document");
      
      setProgress(Math.max(progress, 30)); // Jump to at least 30% after parsing

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: parseData.text, jobDescription }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || "Failed to analyze document");

      setProgress(100);
      clearInterval(progressInterval);

      const id = Date.now().toString();
      const newEntry: HistoryEntry = {
        id,
        timestamp: new Date().toISOString(),
        fileName: file.name,
        jobTitlePreview: jobDescription.substring(0, 60) + (jobDescription.length > 60 ? "..." : ""),
        data: analyzeData.analysis,
        resumeText: parseData.text,
        jobDescription: jobDescription
      };

      setHistory(prev => {
        const newHistory = [newEntry, ...prev].slice(0, 5);
        localStorage.setItem("tingincv_history", JSON.stringify(newHistory));
        return newHistory;
      });

      setActiveHistoryId(id);
      setResumeText(parseData.text);
      setResult(analyzeData.analysis);
      setStep("results");
    } catch (err: any) {
      setError(err.message);
      setProgress(0);
    } finally {
      setIsProcessing(false);
      clearInterval(progressInterval);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setJobDescription("");
    setResumeText("");
    setResult(null);
    setRewrittenResume(null);
    setActiveHistoryId(null);
    setError(null);
    setStep("setup");
  };

  const loadHistoryItem = (item: HistoryEntry) => {
    setResult(item.data);
    setJobDescription(item.jobDescription || "");
    setResumeText(item.resumeText || "");
    setRewrittenResume(item.rewrittenResume || null);
    setActiveHistoryId(item.id);
    setError(null);
    setStep("results");
    setIsHistoryOpen(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("tingincv_history");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRewrite = async () => {
    if (rewrittenResume) {
      setIsModalOpen(true);
      return;
    }
    
    if (!resumeText || !jobDescription) {
       setError("Missing resume or job description text. Please run a new analysis first.");
       return;
    }
    try {
      setIsRewriting(true);
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rewrite resume.");
      
      setRewrittenResume(data.rewrittenResume);
      setIsModalOpen(true);
      
      // Save it to history so they don't lose it
      if (activeHistoryId) {
        setHistory(prev => {
          const newHistory = prev.map(item => 
            item.id === activeHistoryId ? { ...item, rewrittenResume: data.rewrittenResume } : item
          );
          localStorage.setItem("tingincv_history", JSON.stringify(newHistory));
          return newHistory;
        });
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRewriting(false);
    }
  };

  const downloadPdf = () => {
    setIsDownloading(true);
    try {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'absolute';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentWindow?.document;
      if (!iframeDoc) return;

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(node => node.outerHTML)
        .join('\n');

      const resumeHtml = resumeRef.current?.outerHTML || '';

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Optimized_Resume</title>
            <base href="${window.location.origin}">
            ${styles}
            <style>
              @page { margin: 0; size: letter portrait; }
              body { background: white !important; color: black !important; margin: 0; padding: 0; display: block !important; overflow: visible !important; height: auto !important; }
              #resume-preview { 
                box-shadow: none !important; 
                padding: 0.75in !important; 
                margin: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                min-height: 0 !important;
                height: auto !important;
              }
            </style>
          </head>
          <body>
            ${resumeHtml}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  // Animation Variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <div className="print-root min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-blue-400/30 dark:bg-blue-600/10 blur-[120px] rounded-full pointer-events-none print:hidden" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vh] bg-purple-400/30 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none print:hidden" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-[var(--glass-border)] bg-[var(--bg)]/50 backdrop-blur-xl print:hidden">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">TinginCV</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="text-sm font-medium text-[var(--fg)] hover:text-blue-400 transition-colors flex items-center gap-2 p-2"
            >
              <Clock className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">History</span>
            </button>

            {step === "results" && (
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={resetAnalysis} 
                className="text-sm font-medium text-[var(--fg)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)] px-4 py-2 rounded-full transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">New Analysis</span>
                <span className="sm:hidden">New</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 md:pt-24 pb-12 md:pb-20 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto relative z-10 min-h-screen flex flex-col print:hidden">
        
        <AnimatePresence mode="wait">
          {/* SETUP VIEW */}
          {step === "setup" && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-grow flex items-start md:items-center justify-center w-full pt-4 md:pt-0 pb-12"
            >
              <div className="w-full max-w-6xl bg-[var(--bg)] border border-[var(--glass-border)] p-6 sm:p-8 md:p-12 rounded-2xl md:rounded-3xl relative shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80" />
                
                <div className="text-center mb-12">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-3 md:mb-4 text-[var(--fg)]">Precision Analysis</h1>
                  <p className="text-zinc-600 dark:text-zinc-300 text-base sm:text-lg">Match your professional profile against target requirements.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {/* Upload */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-center w-full">Resume (PDF, DOCX)</label>
                      <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`h-[200px] sm:h-[240px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer relative overflow-hidden group
                        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--glass-border)] hover:border-blue-400 hover:bg-[var(--glass-hover)]'}
                      `}
                    >
                      <input type="file" accept=".pdf,.docx" className="hidden" ref={fileInputRef} onChange={(e) => { if(e.target.files?.length) setFile(e.target.files[0]) }} />
                      
                      <div className="w-14 h-14 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all text-zinc-400">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      
                      <p className="text-base font-bold text-[var(--fg)] mb-2">Click or drag resume</p>
                      <p className="text-sm text-zinc-500">PDF, DOCX up to 5MB</p>
                      
                      {file && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute bottom-4 left-4 right-4 bg-blue-500/20 border border-blue-500/40 text-blue-200 text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2 truncate shadow-lg backdrop-blur-md">
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-400" />
                          <span className="truncate font-medium">{file.name}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* JD */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-center w-full">Job Description</label>
                    <div className="relative h-[200px] sm:h-[240px] group">
                      <textarea 
                        className="w-full h-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 text-base text-[var(--fg)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all shadow-inner hover:border-blue-400 hover:bg-[var(--glass-hover)]" 
                        placeholder=""
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      />
                      {!jobDescription && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center mb-4 transition-all text-zinc-400 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400">
                            <FileText className="w-6 h-6" />
                          </div>
                          <p className="text-base font-bold text-[var(--fg)] mb-2">Paste job description</p>
                          <p className="text-sm text-zinc-500">Target requirements & qualifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnalyze}
                    disabled={isProcessing}
                    className="w-full md:w-auto min-w-[320px] h-16 bg-[var(--fg)] text-[var(--bg)] rounded-full font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-[0_0_40px_var(--accent-glow)] overflow-hidden relative"
                  >
                    {isProcessing ? (
                      <div className="flex flex-col justify-center w-full px-6 absolute inset-0 z-10">
                        <div className="flex justify-between items-center text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Analyzing...</span>
                          </div>
                          <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--bg)]/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--bg)] transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Analyze Resume
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS VIEW */}
          {step === "results" && result && (
            <motion.div 
              key="results"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full space-y-6"
            >
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
              {/* Header Grid */}
              <motion.div variants={itemVariants} className="glass border border-white/25 rounded-2xl lg:rounded-3xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  
                  {/* Score Circular Gauge */}
                  <div className="lg:col-span-4 p-6 lg:p-8 flex flex-col items-center justify-center relative group border-b lg:border-b-0 lg:border-r border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative text-center w-full flex flex-col items-center">
                      <div className="relative inline-block">
                        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-48 md:h-48 transform -rotate-90">
                          <circle className="text-white/5" cx="100" cy="100" fill="transparent" r="80" stroke="currentColor" strokeWidth="12" />
                          <motion.circle 
                            initial={{ strokeDashoffset: 502 }}
                            animate={{ strokeDashoffset: 502 * (1 - result.matchScore / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="100" cy="100" fill="transparent" r="80" stroke="url(#score-gradient)" strokeDasharray="502" 
                            strokeLinecap="round" strokeWidth="12" 
                          />
                          <defs>
                            <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl md:text-5xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{result.matchScore}%</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase mt-4">Match Score</span>
                      
                      <button 
                        onClick={handleRewrite}
                        disabled={isRewriting}
                        className={`mt-6 w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm md:text-base ${
                          rewrittenResume 
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                      >
                        {isRewriting ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" /> Rewriting...</>
                        ) : rewrittenResume ? (
                          <><FileText className="w-4 h-4 shrink-0" /> View Optimized Resume</>
                        ) : (
                          <><Sparkles className="w-4 h-4 shrink-0" /> Rewrite My Resume</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="lg:col-span-8 p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-8">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      <h2 className="text-xl font-bold font-heading">Detailed Breakdown</h2>
                    </div>
                    <div className="space-y-6">
                      {Object.entries(result.scores).map(([category, score]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                            <span>{category}</span>
                            <span className="text-[var(--fg)]">{score}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--glass-border)] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                </div>
              </motion.div>

              {/* Second Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recruiter Feedback */}
                <motion.div variants={itemVariants} className="glass border border-white/25 rounded-2xl lg:rounded-3xl p-6 lg:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Target className="w-5 h-5 text-purple-400" />
                      <h2 className="text-xl font-bold font-heading">Recruiter's Perspective</h2>
                    </div>
                    
                      <div className="bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 p-6 rounded-2xl mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Rejection Risk</h3>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200/80 italic leading-relaxed">
                        "{result.atsRejectionReason}"
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                      <h3 className="text-xs font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest mb-3">Overall Assessment</h3>
                      <p className="text-sm text-[var(--fg)] opacity-90 leading-relaxed">
                        {result.feedback}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Bullet Optimizer */}
                <motion.div variants={itemVariants} className="glass border border-white/25 rounded-2xl lg:rounded-3xl relative overflow-hidden h-full lg:h-auto min-h-[400px] lg:min-h-0">
                  <div className="p-6 lg:p-8 flex flex-col h-full lg:absolute lg:inset-0">
                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h2 className="text-xl font-bold font-heading">Bullet Point Optimizer</h2>
                    </div>
                    <p className="text-zinc-500 text-sm mb-6 flex-shrink-0">Rewritten for impact, metrics, and action verbs.</p>
                    
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 pb-4">
                      {result.optimizedBullets.map((bullet, i) => (
                      <div key={i} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative p-5 border border-[var(--glass-border)] bg-[var(--glass-bg)] rounded-2xl transition-colors">
                          <div className="mb-3">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Original</span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-500 italic line-through decoration-zinc-400 dark:decoration-zinc-700">{bullet.original}</p>
                          </div>
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded-full">Optimized</span>
                              <button onClick={() => copyToClipboard(bullet.optimized)} className="text-zinc-500 hover:text-[var(--fg)] transition-colors">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-[var(--fg)] opacity-90 leading-relaxed">"{bullet.optimized}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </motion.div>
              </div>

              {/* Skills Gap */}
              <motion.div variants={itemVariants} className="glass border border-[var(--glass-border)] rounded-2xl lg:rounded-3xl p-6 lg:p-8">
                <div className="flex items-center gap-2 mb-8">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold font-heading">Skills Gap Analysis</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {['Missing', 'Present', 'Weak'].map((statusType) => {
                    const skills = result.skillsGap.filter(s => s.status === statusType);
                    if (skills.length === 0) return <div key={statusType} className="hidden md:block"></div>;
                    
                    return (
                      <div key={statusType}>
                        <h3 className={`text-xs font-bold uppercase mb-4 tracking-widest ${
                          statusType === 'Missing' ? 'text-red-400' : 
                          statusType === 'Weak' ? 'text-yellow-400' : 'text-emerald-400'
                        }`}>
                          {statusType === 'Missing' ? 'Critical Gaps' : statusType === 'Weak' ? 'Needs Improvement' : 'Verified Core Skills'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, i) => (
                            <div key={i} className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                              statusType === 'Missing' ? 'bg-red-500/10 text-red-300 border-red-500/20' : 
                              statusType === 'Weak' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' : 
                              'bg-[var(--glass-bg)] text-zinc-600 dark:text-zinc-300 border-[var(--glass-border)]'
                            }`}>
                              {skill.skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Slide-out Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-md h-full bg-[var(--bg)] border-l border-[var(--glass-border)] z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold font-heading">Analysis History</h2>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-[var(--glass-hover)] rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center text-zinc-500 py-12">
                    <p>No previous analyses found.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => loadHistoryItem(item)}
                      className="group p-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl hover:bg-[var(--glass-hover)] hover:border-blue-500/30 cursor-pointer transition-all relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-2xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            {item.data.matchScore}%
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                            {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[var(--fg)] mb-1 truncate">{item.fileName}</p>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          "{item.jobTitlePreview}"
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {history.length > 0 && (
                <div className="p-6 border-t border-[var(--glass-border)]">
                  <button 
                    onClick={clearHistory}
                    className="w-full py-3 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-colors"
                  >
                    Clear History
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Resume Preview Modal */}
      <AnimatePresence>
        {isModalOpen && rewrittenResume && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] print:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="print-modal fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-[var(--bg)] border border-[var(--glass-border)] rounded-2xl z-[90] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 md:p-5 border-b border-[var(--glass-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--glass-bg)] print:hidden">
                <h2 className="text-base sm:text-lg font-bold text-[var(--fg)] flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400 shrink-0" /> <span className="truncate">Optimized Resume Preview</span></h2>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button 
                    onClick={downloadPdf}
                    disabled={isDownloading}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? "Generating PDF..." : "Download PDF"}
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--glass-hover)] rounded-full transition-colors shrink-0">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              <div className="print-scroll flex-1 overflow-y-auto p-4 md:p-8 bg-[var(--glass-bg)] custom-scrollbar">
                {/* A4 Paper Container */}
                <div 
                  id="resume-preview"
                  ref={resumeRef}
                  className="bg-white text-black p-6 sm:p-10 md:p-14 shadow-lg w-full max-w-[794px] min-h-[1123px] h-fit font-serif mx-auto"
                >
                  <div className="text-center mb-6 border-b border-black/20 pb-6">
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{rewrittenResume.personalInfo.name}</h1>
                    <p className="text-sm text-zinc-600">{rewrittenResume.personalInfo.contact}</p>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black/20 pb-1 mb-3 text-blue-900">Professional Summary</h2>
                    <p className="text-sm leading-relaxed">{rewrittenResume.professionalSummary}</p>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black/20 pb-1 mb-3 text-blue-900">Experience</h2>
                    <div className="space-y-4">
                      {rewrittenResume.experience.map((job, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-sm">{job.title}</h3>
                            <span className="text-xs text-zinc-600 font-bold">{job.dates}</span>
                          </div>
                          <div className="text-sm italic mb-2 text-zinc-700">{job.company}</div>
                          <ul className="list-disc list-outside ml-4 space-y-1">
                            {job.bullets.map((bullet, i) => (
                              <li key={i} className="text-sm leading-relaxed pl-1">{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black/20 pb-1 mb-3 text-blue-900">Skills</h2>
                    <p className="text-sm leading-relaxed">{rewrittenResume.skills.join(" • ")}</p>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black/20 pb-1 mb-3 text-blue-900">Education</h2>
                    <div className="space-y-3">
                      {rewrittenResume.education.map((edu, idx) => (
                        <div key={idx} className="flex justify-between items-baseline">
                          <div>
                            <h3 className="font-bold text-sm">{edu.degree}</h3>
                            <div className="text-sm text-zinc-700">{edu.school}</div>
                          </div>
                          <span className="text-xs text-zinc-600 font-bold">{edu.dates}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
