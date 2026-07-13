import { command } from '$app/server';
import { GoogleGenAI } from '@google/genai';
import { AI_PROMPTS } from '../../lib/services/ai/prompts';
import * as v from 'valibot';

export const structureIntake = command(
  v.string(),
  async (transcript: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please configure it to use AI Voice Intake.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = AI_PROMPTS.voiceIntake.buildPrompt(transcript);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      let text = response.text || "{}";
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(`AI Extraction failed: ${err.message}`);
    }
  }
);
