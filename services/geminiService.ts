import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL, DISALLOWED_PATTERNS, MAX_INPUT_LENGTH, MIN_INPUT_LENGTH } from '../constants';
import { SimplificationResponse } from '../types';

// Validation helper to enforce strict security policies
const validateInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    throw new Error("Invalid input provided.");
  }

  const clean = input.trim();
  
  if (clean.length < MIN_INPUT_LENGTH) {
    throw new Error(`Input is too short (minimum ${MIN_INPUT_LENGTH} characters).`);
  }

  if (clean.length > MAX_INPUT_LENGTH) {
    throw new Error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters.`);
  }

  // Security check: Reject input with potential XSS patterns or malicious content
  // We iterate and reset lastIndex to ensure stateless validation with global regexes
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.global) pattern.lastIndex = 0;
    if (pattern.test(clean)) {
      throw new Error("Input contains disallowed characters or patterns.");
    }
  }

  return clean;
};

export const simplifyLegalText = async (text: string): Promise<SimplificationResponse> => {
  // 1. Secure API Key Handling check
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please configure the environment.");
  }

  // 2. Strict Input Validation
  const cleanText = validateInput(text);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We use a structured JSON schema to ensure the output is always consistent and parsable.
  // This reduces the risk of prompt injection causing the UI to break.
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Translate the following legal text into plain, simple English that a 12-year-old could understand. 
      
      Legal Text to Simplify:
      "${cleanText}"`,
      config: {
        systemInstruction: "You are an expert Legal Simplifier. Your job is to strip away jargon, passive voice, and run-on sentences. You provide accurate, neutral summaries without legal advice. If the input is not legal text, politely refuse.",
        temperature: 0.3, // Lower temperature for more deterministic/factual output
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            simplified: {
              type: Type.STRING,
              description: "The plain English translation of the text.",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 3-5 bullet points extracting the most critical obligations or rights.",
            }
          },
          required: ["simplified", "keyPoints"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from AI");

    const parsed = JSON.parse(responseText);
    
    return {
      original: cleanText,
      simplified: parsed.simplified,
      keyPoints: parsed.keyPoints || []
    };

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    // Propagate validation errors directly, wrap others
    if (error.message && (error.message.includes("Input") || error.message.includes("Key"))) {
      throw error;
    }
    throw new Error("Failed to simplify text. The system might be overloaded or the text was invalid.");
  }
};