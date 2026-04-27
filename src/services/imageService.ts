import { GoogleGenAI } from "@google/genai";

export async function generateBrandAsset(
  productDescription: string,
  medium: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
  variation?: string,
  logoConcept?: string,
  imageSize: "512px" | "1K" | "2K" | "4K" = "2K"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  let prompt = `A product shot of ${productDescription}. `;
  if (variation) prompt += `Theme/Variation: ${variation}. `;
  if (logoConcept) prompt += `Subtly incorporate this logo design into the image: ${logoConcept}. `;
  prompt += `Rendered as a ${medium}. High resolution, hyperrealistic, no people, maintain exact product details.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from API.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}
