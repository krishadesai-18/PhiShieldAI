import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeEmailImage(base64Image: string, mimeType: string) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a cybersecurity expert specializing in phishing detection.
    Analyze the provided email image and output a detailed phishing analysis in JSON format.
    You must identify:
    - Suspicious links
    - Urgency language
    - Fake domains or inconsistent URLs
    - Impersonation attempts
    - Grammar and spelling mistakes
    - Credential stealing attempts
    
    Provide:
    - A verdict: 'phishing', 'safe', or 'suspicious'
    - A confidence score from 0 to 100
    - A detailed explanation of your findings.
  `;

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
            text: "Analyze this email for phishing indicators and provide the result in JSON.",
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
          verdict: { type: Type.STRING, description: "phishing, safe, or suspicious" },
          confidence: { type: Type.NUMBER, description: "Confidence score 0-100" },
          explanation: { type: Type.STRING, description: "Detailed reasoning" },
          indicators: {
            type: Type.OBJECT,
            properties: {
              suspiciousLinks: { type: Type.BOOLEAN },
              urgencyLanguage: { type: Type.BOOLEAN },
              fakeDomains: { type: Type.BOOLEAN },
              impersonation: { type: Type.BOOLEAN },
              grammarMistakes: { type: Type.BOOLEAN },
              credentialStealing: { type: Type.BOOLEAN }
            }
          }
        },
        required: ["verdict", "confidence", "explanation", "indicators"]
      }
    },
  });

  if (!response.text) {
    throw new Error("Empty response from AI");
  }

  return JSON.parse(response.text);
}
