import type { AIProvider, AIStructuredIntake } from './ai.interface';
import { RemoteGeminiProvider } from './providers/remote-gemini';
import { LocalWebLLMProvider } from './providers/local-webllm';

class AIService {
  private providers: AIProvider[] = [];

  constructor() {
    // Register in order of preference
    // 1. Remote Gemini (fast, doesn't require 5GB download, but requires network)
    // 2. Local WebLLM (runs completely offline in browser via WebGPU, but requires initial download)
    this.providers.push(new RemoteGeminiProvider());
    this.providers.push(new LocalWebLLMProvider());
  }

  async structureIntake(transcript: string): Promise<AIStructuredIntake> {
    let lastError = null;

    for (const provider of this.providers) {
      try {
        const isAvail = await provider.isAvailable();
        if (isAvail) {
          console.log(`[AIService] Attempting structureIntake via ${provider.name}`);
          const result = await provider.structureIntake(transcript);
          return result;
        } else {
          console.log(`[AIService] ${provider.name} is not available, skipping.`);
        }
      } catch (err: any) {
        console.warn(`[AIService] ${provider.name} failed:`, err);
        lastError = err;
        // continue to next provider
      }
    }
    
    throw new Error(lastError ? `AI Failed: ${lastError.message}` : "No AI providers available.");
  }
}

export const aiService = new AIService();
