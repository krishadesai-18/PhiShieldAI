import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeEmailImage(base64Image: string, mimeType: string) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a high-level cybersecurity forensics expert specializing in advanced phishing detection.
    Analyze the provided email screenshot with extreme scrutiny.

    Your task is to detect:
    - Suspicious URLs: Look for hidden redirects, look-alike characters (homoglyphs), or shortened links.
    - Fake Domains: Detect spoofed sender addresses or domains that mimic legitimate brands (e.g., 'micros0ft.com' instead of 'microsoft.com').
    - Urgency/Fear-based Language: Identify phrases meant to induce panic or immediate action.
    - Credential Theft: Search for requests for passwords, OTPs, or redirects to login pages.
    - Impersonation: Recognize attempts to mimic famous companies, banks, or services.
    - Malicious Intent: Evaluate if the email is trying to harm or deceive the user.
    - Social Engineering: Detect psychological manipulation tactics.
    - Threatening Language: Identify blackmail or consequences for inaction.
    - Grammar & Spelling: Note inconsistencies that often appear in low-effort phishing.

    Even moderately suspicious emails should be flagged if they contain multiple minor risk indicators.
    Be objective but sensitive to common scam patterns.

    OUTPUT FORMAT:
    You must return a STRICT JSON object with these EXACT keys:
    - "verdict": either "Phishing" or "Safe" (be decisive).
    - "confidence": an integer from 0-100 reflecting your certainty.
    - "analysis": a comprehensive markdown explanation structured in clear, spaced-out points. DO NOT include any titles like "Cybersecurity Analysis Report" or "Phishing Report" at the start.
    - "riskIndicators": an array of strings representing the detected threats.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: "Analyze this email screenshot for phishing threats. Provide a detailed cybersecurity report in the specified JSON format.",
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING, description: "Phishing or Safe" },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-100" },
            analysis: { type: Type.STRING, description: "Detailed cybersecurity markdown explanation" },
            riskIndicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of detected risk categories"
            }
          },
          required: ["verdict", "confidence", "analysis", "riskIndicators"]
        }
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    console.log("Gemini API Response:", response.text);
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
