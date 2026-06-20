# TinginCV – AI Resume Optimizer

TinginCV is a comprehensive AI Career Assistant designed to act as a personal recruiter, ATS simulator, and career coach.

## Proposed Architecture & Tech Stack

Since this application requires secure file parsing (PDF/DOCX) and complex AI analysis without exposing API keys to the browser, it requires a robust backend. 

**Recommended Stack:**
- **Framework:** Next.js (App Router) - Provides both a fast React frontend and secure server-side API routes for file processing and AI calls.
- **Styling:** Tailwind CSS + shadcn/ui (for beautiful, accessible dashboard components like progress bars, cards, and accordions).
- **AI Engine:** Google Gemini API (`@google/genai`) - Excellent at deep document analysis and structured JSON generation (perfect for scoring and categorization).
- **Document Parsing:** `pdf-parse` (for PDF) and `mammoth` (for DOCX) to extract raw text securely on the server.
- **Database / Auth:** None. The application will be completely guest-based, free, and open. All processing will be done in-memory or stored locally in the user's browser (Local Storage) to ensure zero hosting costs for data.

## Phase 1: Project Setup & Foundation
1. Initialize a new Next.js project in a completely separate folder (`tingin-cv`).
2. Set up Tailwind CSS and essential UI components.
3. Build the core layout: Landing Page, Authentication shell, and the main User Dashboard skeleton.

## Phase 2: Document Processing Engine
1. Build the Drag-and-Drop file upload zone.
2. Create secure Next.js API routes that take the uploaded PDF/DOCX files, extract the raw text, and temporarily store it in memory for analysis.
3. Build the "Job Description" text input interface.

## Phase 3: The AI Analysis Core
This is the "brain" of TinginCV. We will craft highly specific system prompts instructing the AI to output structured JSON matching your required features:
1. **Match Score Generator:** Calculates Keyword, Skills, Experience, Education, Formatting, and Grammar scores.
2. **Skills Gap Analyzer:** Categorizes skills and flags them as Present, Weak, or Missing.
3. **Recruiter's Eye & ATS Simulator:** Generates the human-style feedback paragraphs and the brutal ATS rejection reasons.
4. **Bullet Point Optimizer:** Extracts weak bullets and rewrites them using strong action verbs and quantified achievements.

## Phase 4: The Dashboard UI
1. Build the interactive Results Dashboard.
2. Implement visual gauges and progress bars for the 87% Match Scores.
3. Create side-by-side comparison views (Original Bullet vs. Improved Bullet).
4. Build the Cover Letter and Interview Prep generation modals.

## Phase 5: Export & Polish
1. Allow the user to export the AI suggestions or copy rewritten bullets to their clipboard.
2. Finalize error handling, loading animations (since AI analysis takes 10-20 seconds), and mobile responsiveness.


