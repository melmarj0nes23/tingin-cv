import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

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

    const prompt = `
      You are an expert Executive Resume Writer and Career Coach.
      Your task is to completely rewrite the provided Resume Text so it perfectly aligns with the Target Job Description.
      
      Instructions:
      1. Keep the candidate's actual history (companies, dates, degrees) accurate. Do not invent fake jobs.
      2. Rewrite the professional summary to be a powerful, keyword-rich paragraph targeting the job description.
      3. Rewrite every bullet point to focus on impact, action verbs, and quantifiable metrics, integrating keywords from the job description naturally.
      4. Curate and list the most relevant hard and soft skills.
      
      Resume Text:
      """
      ${resumeText}
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
        throw new Error("AI returned empty response");
    }

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
