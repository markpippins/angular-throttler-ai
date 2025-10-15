import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// We assume the build process exposes API_KEY from .env as process.env.API_KEY
declare const process: any;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: The API key MUST be provided via the `process.env.API_KEY`
    // environment variable. The application assumes this is configured by the
    // hosting environment.
    if (!process.env.API_KEY) {
      console.error('Gemini API Key is not configured. Please set the API_KEY environment variable.');
      // Avoid creating the ai instance if the key is missing to prevent errors.
      // The generateContent method will handle this case gracefully.
      this.ai = null!;
    } else {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini API client is not initialized. Please configure the API Key.');
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      console.error('Gemini API call failed', e);
      // Provide a more user-friendly error message
      const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
      throw new Error(`Failed to generate content from Gemini: ${errorMessage}`);
    }
  }
}
