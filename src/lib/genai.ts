import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeEmailImage(base64Image: string, mimeType: string) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a high-level cybersecurity forensics expert specializing in advanced phishing detection.
    Analyze the provided email screenshot with extreme scrutiny. 

    Your goal is to provide a neutral, objective assessment based on visual evidence. Do not be overly paranoid; many emails are legitimate business communications.

    Your task is to detect:
    - Suspicious URLs: Look for hidden redirects, look-alike characters (homoglyphs), or shortened links.
    - Fake Domains: Detect spoofed sender addresses or domains that mimic legitimate brands.
    - Urgency/Fear-based Language: Identify phrases meant to induce panic or immediate action.
    - Credential Theft: Search for requests for passwords, OTPs, or redirects to login pages.
    - Grammar & Spelling: Note inconsistencies that often appear in low-effort phishing.

    Classification Guidelines:
    - SAFE: The email comes from a reputable domain, has a clear professional purpose, and contains no suspicious links or urgent threats.
    - SUSPICIOUS: The email has some minor red flags (e.g., slightly urgent tone, unknown sender) but lacks clear malicious intent.
    - PHISHING: The email shows clear deceptive tactics, spoofed domains, or requests for sensitive information.

    Be objective and base your confidence score on the strength of the evidence found.

    OUTPUT FORMAT:
    You must return a STRICT JSON object with these EXACT keys:
    - "verdict": either "Phishing", "Safe", or "Suspicious" (use "Suspicious" for borderline threats or unusual signals).
    - "confidence": an integer from 0-100 reflecting your certainty.
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
