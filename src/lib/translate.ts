import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text) return '';
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else. Text to translate: "${text}"`,
    });
    return response.text?.trim() || '';
  } catch (error) {
    console.error('Translation error:', error);
    return '';
  }
};

export const translateObject = async (obj: Record<string, string>, targetLanguage: string): Promise<Record<string, string>> => {
  const translatedObj: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    translatedObj[key] = await translateText(value, targetLanguage);
  }
  return translatedObj;
};
