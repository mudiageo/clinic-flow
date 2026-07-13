import type { AIProvider, AIStructuredIntake } from '../ai.interface';
import { AI_PROMPTS } from '../prompts';
import * as webllm from '@mlc-ai/web-llm';

export class LocalWebLLMProvider implements AIProvider {
  name = 'WebLLM (Local / Offline)';
  private engine: webllm.MLCEngineInterface | null = null;
  private initializing = false;

  async isAvailable(): Promise<boolean> {
    // Check if browser supports WebGPU (necessary for WebLLM)
    // Only available in secure contexts (HTTPS or localhost)
    if (typeof navigator === 'undefined' || !navigator.gpu) return false;
    return true;
  }

  private async getEngine() {
    if (this.engine) return this.engine;
    if (this.initializing) {
      while (this.initializing) {
        await new Promise(r => setTimeout(r, 100));
      }
      return this.engine;
    }
    
    this.initializing = true;
    try {
      // Using a widely supported quantized model for browser execution
      const selectedModel = "Llama-3-8B-Instruct-q4f32_1-MLC";
      this.engine = await webllm.CreateMLCEngine(selectedModel, {
        initProgressCallback: (info) => {
          console.log(`[WebLLM] ${info.text}`);
        }
      });
    } finally {
      this.initializing = false;
    }
    return this.engine;
  }

  async structureIntake(transcript: string): Promise<AIStructuredIntake> {
    const engine = await this.getEngine();
    if (!engine) throw new Error("Local AI Engine failed to load.");

    const prompt = AI_PROMPTS.voiceIntake.buildPrompt(transcript);

    const reply = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    let text = reply.choices[0].message.content || "{}";
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(text);
    } catch(e) {
       console.error("Failed to parse WebLLM output", text);
       throw new Error("Local AI failed to produce valid JSON");
    }
  }
}
