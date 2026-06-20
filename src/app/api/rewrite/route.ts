import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
      
      Resume Text:
      """
      ${scrubbedResumeText}
      """
      
      Target Job Description:
      """
      ${jobDescription}
      """
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        personalInfo: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            contact: { type: Type.STRING, description: "Email, phone, location, etc. combined into a single line string" }
          }
        },
        professionalSummary: {
          type: Type.STRING,
          description: "A strong, 3-4 sentence professional summary tailored to the job"
        },
        experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              dates: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              degree: { type: Type.STRING },
              school: { type: Type.STRING },
              dates: { type: Type.STRING }
            }
          }
        },
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["personalInfo", "professionalSummary", "experience", "education", "skills"]
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    let response: any = null;
    let retries = 0;
    while (retries < 2) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.2,
          },
        });
        break; // Success
      } catch (error: any) {
        const errorStr = error.toString();
        if ((errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) && retries < 1) {
          const retryMatch = errorStr.match(/retry in ([\d.]+)s/);
          let waitTime = 15000; // default 15s wait
          if (retryMatch && retryMatch[1]) {
            waitTime = parseFloat(retryMatch[1]) * 1000 + 1000; // Exact time + 1s buffer
          }
          console.log(`[Rate Limit Hit] Automatically waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          retries++;
        } else {
          throw error;
        }
      }
    }

    let textResponse = response.text;
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
