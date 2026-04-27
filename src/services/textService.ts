import { GoogleGenAI } from "@google/genai";

export async function generateTaglines(
  productDescription: string,
  variations: string[],
  logoConcept?: string
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const variationsText = variations.filter(v => v.trim()).join(", ");
  
  let prompt = `You are an expert copywriter. Generate 3 to 5 catchy, punchy marketing taglines for the following product:
Product: ${productDescription}\n`;
  if (variationsText) prompt += `Variations/Styles: ${variationsText}\n`;
  if (logoConcept) prompt += `Logo Concept: ${logoConcept}\n`;
  
  prompt += `\nOutput ONLY the taglines, one per line, without any numbering, bullet points, or quotes.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text || "";
    return text.split('\n').map(l => l.replace(/^[-*•\d.)]+\s*/, '').replace(/["']/g, '').trim()).filter(l => l.length > 0);
  } catch (error) {
    console.error("Error generating taglines:", error);
    throw error;
  }
}
