import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeEmailImage(base64Image: string, mimeType: string) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a high-level cybersecurity analysis expert specializing in advanced phishing detection.
    Analyze the provided email screenshot with extreme scrutiny. 

    Your goal is to provide a neutral, objective assessment based on visual evidence. Do not be overly paranoid; many emails are legitimate business communications.

    Your task is to detect:
    - Suspicious URLs: Look for hidden redirects, look-alike characters (homoglyphs), or shortened links.
    - Fake Domains: Detect spoofed sender addresses or domains that mimic legitimate brands.
    - Urgency/Fear-based Language: Identify phrases meant to induce panic or immediate action.
    - Credential Theft: Search for requests for passwords, OTPs, or redirects to login pages.
    - Grammar & Spelling: Note inconsistencies that often appear in low-effort phishing.

    Threat Weighting Guidelines:
    - REDUCE confidence impact for: Generic greetings (e.g., "Dear Customer"), mild urgency, free hosting domains (unless paired with other signals), slightly unusual but non-malicious URLs, and lack of professional branding.
    - INCREASE confidence impact ONLY for: Direct password/login requests, credential submission attempts, financial/payment requests, specific threats of account suspension, fake login pages, requests for OTPs or banking information, and explicit impersonation of trusted brands.

    Classification & Calibration Logic:
    - SAFE (0-39% Confidence): Indicators include normal professional tone, verified or harmless links, no urgency, and no credential requests. Safe emails should typically have very low scores (0-35%). Use reassuring language like "No significant phishing indicators detected."
    - SUSPICIOUS (40-75% Confidence): Indicators include unknown or shortened URLs, mild urgency, generic greetings, slightly unusual domains, or mixed signals. These should NOT be assigned high-confidence phishing scores.
    - PHISHING (76-100% Confidence): ONLY assign this if there are strong malicious indicators like direct password requests, fake account verification, financial scams, credential harvesting attempts, or highly deceptive domains. Avoid 90%+ scores unless the phishing intent is very explicit and undeniable.

    Moderate overall confidence inflation. The goal is to provide a realistic, production-like assessment where "Suspicious" is used for borderline cases instead of defaulting to high-confidence "Phishing".

    OUTPUT FORMAT:
    You must return a STRICT JSON object with these EXACT keys:
    - "verdict": either "Phishing", "Safe", or "Suspicious" (use "Suspicious" for borderline threats or unusual signals).
    - "confidence": an integer from 0-100 reflecting the phishing risk level (0 = absolute certain safe, 100 = absolute certain phishing).
    - "analysis": a comprehensive markdown explanation structured in a clear point-wise manner. Use a single blank line between points for readability. **IMPORTANT: Use bold (e.g., **word**) for key technical terms, suspicious domains, urgency indicators, and specific threats to make them stand out.** DO NOT include any titles like "Cybersecurity Analysis Report" or "Phishing Report" at the start. **DO NOT use the word "sample" to refer to the email or image.**
    - "subject": the subject line of the email if visible, otherwise a brief descriptive title of the email content.
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
            verdict: { type: Type.STRING, description: "Phishing, Safe, or Suspicious" },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-100" },
            analysis: { type: Type.STRING, description: "Detailed cybersecurity markdown explanation" },
            subject: { type: Type.STRING, description: "The email subject line or a brief title" },
            riskIndicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of detected risk categories"
            }
          },
          required: ["verdict", "confidence", "analysis", "riskIndicators", "subject"]
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
