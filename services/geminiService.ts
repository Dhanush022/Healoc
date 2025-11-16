import { GoogleGenAI } from "@google/genai";
import { Vaccination } from "../types";

const getGenAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getHealthTip = async (): Promise<string> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Provide a short, actionable health tip of the day for a general audience.',
        config: {
            temperature: 0.9,
            maxOutputTokens: 100,
        }
    });
    const tipText = response.text;
    // Add a check for robustness to ensure a valid string is always returned.
    if (tipText && typeof tipText === 'string' && tipText.trim().length > 0) {
        return tipText.trim();
    }
    // This fallback is a safeguard in case the API returns an empty response.
    console.warn("Received empty or invalid health tip from API.");
    return "Stay hydrated and get enough rest for a healthy day!";
  } catch (error) {
    console.error("Error fetching health tip:", error);
    return "Could not fetch a health tip. Please try again later.";
  }
};

export const explainMedicalText = async (text: string): Promise<string> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Explain the following medical text in simple, easy-to-understand terms for a patient. Avoid jargon. Here is the text: "${text}"`,
        config: {
            temperature: 0.2,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error explaining medical text:", error);
    return "Could not get an explanation. Please try again later.";
  }
};

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('Failed to read file as base64 string'));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export const analyzeSymptomsStream = async (symptoms: string, imageFile?: File) => {
    try {
        const ai = getGenAI();
        const textPart = { text: `As an AI medical assistant, analyze the following symptoms: "${symptoms}". If an image is provided, use it as visual context (e.g., for a rash or injury). Provide a list of possible conditions (from most to least likely), suggest an urgency level (e.g., 'See a doctor soon', 'Go to ER'), and offer general advice. IMPORTANT: Start your response with a clear disclaimer that you are not a medical professional and this is not a diagnosis.` };
        
        // FIX: Explicitly type `parts` to allow a mix of text and image parts.
        const parts: ({ text: string; } | { inlineData: { data: string; mimeType: string; }; })[] = [textPart];

        if (imageFile) {
            const imagePart = await fileToGenerativePart(imageFile);
            parts.unshift(imagePart);
        }

        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts },
        });
        return response;
    } catch (error) {
        console.error("Error analyzing symptoms:", error);
        throw new Error("Failed to analyze symptoms.");
    }
};


export const identifyMedicine = async (imageFile: File): Promise<string> => {
    try {
        const ai = getGenAI();
        const imagePart = await fileToGenerativePart(imageFile);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    { text: "Identify the medicine in this image (pill or packaging). Provide its name, common uses, typical dosage, potential side effects, and any important warnings. If you cannot identify it, say so clearly." }
                ]
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error identifying medicine:", error);
        return "Could not identify the medicine from the image. Please try again with a clearer picture.";
    }
};

export const getVaccinationRecommendations = async (dob: string, vaccinations: Vaccination[]): Promise<string> => {
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const vaccinationHistory = vaccinations.map(v => `${v.name} on ${v.date}`).join(', ') || 'none';

    try {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `A person is ${age} years old (born on ${dob}). Their vaccination history includes: ${vaccinationHistory}. Based on general public health guidelines (like the CDC in the USA), what are some recommended vaccinations or booster shots for someone of this age? Provide a simple list and brief reasons. IMPORTANT: Start your response with a clear disclaimer that you are not a medical professional, this is not medical advice, and the user should consult their doctor.`,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching vaccination recommendations:", error);
        return "Could not fetch recommendations. Please try again later.";
    }
};