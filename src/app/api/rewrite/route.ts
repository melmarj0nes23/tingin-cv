import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Both resumeText and jobDescription are required." },
        { status: 400 }
      );
    }

    // PII Scrubber
    let extractedEmail = "";
    let extractedPhone = "";

    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    let scrubbedResumeText = resumeText;

    const emailMatch = scrubbedResumeText.match(emailRegex);
    if (emailMatch) {
      extractedEmail = emailMatch[0];
      scrubbedResumeText = scrubbedResumeText.replace(emailRegex, "[REDACTED_EMAIL]");
    }

    const phoneMatch = scrubbedResumeText.match(phoneRegex);
    if (phoneMatch) {
      extractedPhone = phoneMatch[0];
      scrubbedResumeText = scrubbedResumeText.replace(phoneRegex, "[REDACTED_PHONE]");
    }

    const prompt = `
      You are an expert Executive Resume Writer and Career Coach.
      Your task is to completely rewrite the provided Resume Text so it perfectly aligns with the Target Job Description.
      
      Instructions:
      1. STRICT FACTUAL ACCURACY: Keep the candidate's actual history (companies, titles, dates, degrees) 100% accurate. Do NOT invent fake jobs.
      2. NO HALLUCINATION IN NON-TECH ROLES: Do NOT inject "web development" or "coding" into unrelated jobs (e.g., Customer Service, Workforce). Every single bullet point must be unique. NEVER copy and paste bullets across different jobs.
      3. MAXIMIZE ATS SCORE (TARGET 95%+): To achieve a massive ATS score increase without lying, you MUST aggressively inject keywords from the Job Description into the "Professional Summary", the "Skills" array, and any actual technical roles (like Freelance Web Developer).
      4. TECH-ADJACENT VERBS: For non-tech roles, highlight transferable skills by using high-impact, tech-adjacent action verbs (e.g., "Optimized workflows," "Architected solutions," "Deployed strategies," "Analyzed data") to naturally boost keyword density.
      5. Enhance all bullet points to focus on impact and quantifiable metrics.
      6. Curate an exhaustive list of hard and soft skills in the skills array, directly mirroring the phrasing used in the target job description to guarantee keyword matches.
      
      You MUST respond with a valid JSON object matching exactly this structure:
      {
        "personalInfo": {
          "name": "Full Name",
          "contact": "Email | Phone | Location"
        },
        "professionalSummary": "A strong, 3-4 sentence professional summary tailored to the job",
        "experience": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "dates": "Start Date - End Date",
            "bullets": [ "Bullet point 1", "Bullet point 2" ]
          }
        ],
        "education": [
          {
            "degree": "Degree",
            "school": "School Name",
            "dates": "Start Date - End Date"
          }
        ],
        "skills": [ "Skill 1", "Skill 2" ]
      }

      Resume Text:
      """
      ${scrubbedResumeText}
      """
      
      Target Job Description:
      """
      ${jobDescription}
      """
    `;

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    let response: any = null;
    let retries = 0;
    while (retries < 2) {
      try {
        response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });
        break; // Success
      } catch (error: any) {
        const errorStr = error.toString();
        if ((errorStr.includes("429") || errorStr.includes("rate limit")) && retries < 1) {
          console.log("[Rate Limit Hit] Automatically waiting 5000ms before retry...");
          await delay(5000);
          retries++;
        } else {
          throw error;
        }
      }
    }

    let textResponse = response.choices[0]?.message?.content;
    if (!textResponse) {
        throw new Error("AI returned empty response");
    }

    // PII Restorer
    if (extractedEmail) {
      textResponse = textResponse.replace(/\[REDACTED_EMAIL\]/g, extractedEmail);
    }
    if (extractedPhone) {
      textResponse = textResponse.replace(/\[REDACTED_PHONE\]/g, extractedPhone);
    }

    // Clean up potential markdown formatting
    const rewrittenResume = JSON.parse(textResponse);
    return NextResponse.json({ rewrittenResume });
  } catch (error) {
    console.error("AI Rewrite Error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite resume. Please try again." },
      { status: 500 }
    );
  }
}
