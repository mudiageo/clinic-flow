import type { AIProvider, AIStructuredIntake } from '../ai.interface';
import { structureIntake } from '../../../../routes/ai/ai.remote';

export class RemoteGeminiProvider implements AIProvider {
  name = 'Gemini (Cloud)';

  isAvailable(): boolean {
    return navigator.onLine;
  }

  async structureIntake(transcript: string): Promise<AIStructuredIntake> {
    if (!this.isAvailable()) {
      throw new Error("Network is offline. Cannot reach Gemini cloud.");
    }
    const result = await structureIntake(transcript);
    return result as AIStructuredIntake;
  }
}
