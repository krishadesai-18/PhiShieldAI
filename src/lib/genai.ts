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
    - MINOR INDICATORS (+5 to +10 each): Generic greetings, mild urgency, missing personalization, generic sign-off, security-related wording, password expiry notification (institutional), free hosting domains, or unknown but believable domains. These alone should NEVER produce high-confidence phishing classification.
    - MODERATE INDICATORS (+10 to +20 each): Shortened URLs, suspicious wording, mild impersonation, external document links, unusual sender patterns, excessive urgency, or lack of branding.
    - CRITICAL INDICATORS (+25 to +40 each): Direct password requests, OTP requests, banking/payment requests, fake login pages, credential harvesting attempts, threatening account suspension, fake impersonation of trusted companies, or requests for sensitive information.

    Calibration & Calibration Logic:
    - SAFE (0-35% Confidence): Professional tone, legitimate branding, trustworthy links, no credential theft, no threatening urgency. Output VERY low scores (e.g., 5-15%) for clear safe emails.
    - SUSPICIOUS (36-75% Confidence): Mixed signals, generic greetings, mild urgency, security warnings, or institutional notifications (e.g., password expiry, VPN notice) without clear malicious behavior. These should stay within 45-70%.
    - PHISHING (76-100% Confidence): ONLY for clear malicious intent like credential harvesting, financial scams, or undeniable impersonation. 90%+ confidence should be rare and reserved for extremely obvious threats like fake banking logins.

    Institutional Email Handling: Reduce phishing confidence if the domain appears educational or corporate and structure resembles legitimate IT communication (e.g., university password expiry). These should stay in the SUSPICIOUS category (under 75%) unless explicit malicious behavior is found.

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
