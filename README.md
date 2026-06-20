# TinginCV

TinginCV is a premium, AI-powered resume analysis tool designed to help job seekers instantly compare their resume against target job descriptions. Built with a focus on absolute privacy, stunning aesthetics, and actionable feedback, TinginCV analyzes semantic density, hard skill alignment, and structural formatting to uncover exactly how recruiters and Applicant Tracking Systems (ATS) filter your resume.

## ✨ Key Features

- **Instant Match Scoring:** Provides a highly accurate, overarching match percentage based on the alignment between your resume and the target job description.
- **Detailed Category Breakdown:** Analyzes your resume across 5 critical dimensions: Keywords, Skills, Experience, Education, and Formatting.
- **Recruiter's Perspective & ATS Rejection Risk:** Offers unfiltered, realistic feedback on how a recruiter would view your profile, including immediate red flags that could trigger an automatic ATS rejection.
- **Bullet Point Optimizer:** Automatically rewrites your resume's bullet points to maximize impact, incorporating action verbs and quantifiable metrics.
- **Skills Gap Analysis:** Visually maps out your technical alignment by categorizing skills into *Verified Core Skills*, *Needs Improvement*, and *Critical Gaps*.
- **Serverless Local History:** Automatically stores your last 5 analyses directly in your browser's `localStorage`. You can instantly switch between previous resume iterations and job descriptions without re-uploading or hitting the server.
- **Privacy-First Architecture:** Your data is never stored in a database, trained on, or sold. Analysis is processed in transit, and your historical data lives exclusively in your browser.
- **Premium Dark-Mode UI:** Features a sleek, modern, fully responsive interface utilizing glassmorphism, 3D card effects, and fluid micro-animations.

## 🛠 Tech Stack

**Frontend & Core Framework:**
- **[Next.js](https://nextjs.org/)** (App Router) - React framework for production
- **[TypeScript](https://www.typescriptlang.org/)** - For robust, type-safe code
- **[React](https://reactjs.org/)** - UI library

**Styling & Animations:**
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready animation library for React (used for page transitions, glowing hover states, and dynamic SVG gauges)
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icon set

**Backend API & AI:**
- **Next.js API Routes** - Serverless functions to handle document parsing and AI requests securely.
- **Document Parsing Engine** - Capable of extracting text from `.pdf` and `.docx` file formats.
- **AI Processing Model** - Semantic analysis engine that compares resume text against job requirements to generate structured JSON feedback.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm (or yarn/pnpm) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tingincv.git
   cd tingincv
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add any required API keys for the AI analysis endpoint.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📱 Responsive Design
TinginCV is heavily optimized for all screen sizes. The dashboard gracefully collapses its grids, adjusts SVG rendering coordinates, and modifies padding variables to ensure a frictionless, native-feeling experience on mobile devices.
