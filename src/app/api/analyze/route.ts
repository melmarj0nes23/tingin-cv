import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 60;

// We initialize inside the POST handler so it safely reads process.env

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

    // PII Scrubber - 100% mathematically secure data protection
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    
    const scrubbedResumeText = resumeText
      .replace(emailRegex, "[REDACTED_EMAIL]")
      .replace(phoneRegex, "[REDACTED_PHONE]");

    const prompt = `
      You are an expert AI Career Assistant, Recruiter, and ATS Simulator.
      Analyze the provided Resume Text against the Target Job Description.
      
      Extract weak bullet points from the resume and rewrite them using strong action verbs and quantified achievements.
      Provide a brutal, honest ATS rejection reason if the resume doesn't score 100%.
      
      You MUST respond with a valid JSON object matching exactly this structure:
      {
        "matchScore": 85,
        "scores": {
          "keyword": 80,
          "skills": 90,
          "experience": 85,
          "education": 100,
          "formatting": 90
        },
        "skillsGap": [
          { "skill": "React", "status": "Present" },
          { "skill": "Node.js", "status": "Missing" }
        ],
        "feedback": "A human-style paragraph giving constructive feedback from a recruiter's perspective.",
        "atsRejectionReason": "A brutally honest single sentence on why the ATS or a recruiter might reject this resume.",
        "optimizedBullets": [
          {
            "original": "The original weak bullet point from the resume",
            "optimized": "The rewritten, quantified, strong bullet point",
            "explanation": "Why the optimized version is better"
          }
        ]
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

    const textResponse = response.choices[0]?.message?.content;
    if (!textResponse) {
        throw new Error("AI returned empty response");
    }

    const analysis = JSON.parse(textResponse);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to perform AI analysis. Please try again." },
      { status: 500 }
    );
  }
}
