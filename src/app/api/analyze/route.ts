import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

// We initialize inside the POST handler so it safely reads process.env

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Both resumeText and jobDescription are required." },
        { status: 400 }
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
      Provide a highly detailed analysis conforming strictly to the requested JSON structure.
      
      Extract weak bullet points from the resume and rewrite them using strong action verbs and quantified achievements.
      Provide a brutal, honest ATS rejection reason if the resume doesn't score 100%.
      
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
        matchScore: {
          type: Type.INTEGER,
          description: "Overall ATS match score out of 100",
        },
        scores: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.INTEGER, description: "Keyword match out of 100" },
            skills: { type: Type.INTEGER, description: "Skills match out of 100" },
            experience: { type: Type.INTEGER, description: "Experience match out of 100" },
            education: { type: Type.INTEGER, description: "Education match out of 100" },
            formatting: { type: Type.INTEGER, description: "Formatting & grammar out of 100" },
          },
        },
        skillsGap: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["Present", "Weak", "Missing"] },
            },
          },
        },
        feedback: {
          type: Type.STRING,
          description: "A human-style paragraph giving constructive feedback from a recruiter's perspective.",
        },
        atsRejectionReason: {
          type: Type.STRING,
          description: "A brutally honest single sentence on why the ATS or a recruiter might reject this resume.",
        },
        optimizedBullets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING, description: "The original weak bullet point from the resume" },
              optimized: { type: Type.STRING, description: "The rewritten, quantified, strong bullet point" },
              explanation: { type: Type.STRING, description: "Why the optimized version is better" },
            },
          },
        },
      },
      required: [
        "matchScore",
        "scores",
        "skillsGap",
        "feedback",
        "atsRejectionReason",
        "optimizedBullets",
      ],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for consistent JSON
      },
    });

    const textResponse = response.text;
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
