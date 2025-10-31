import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleGenAI, Chat } from '@google/genai';

// We assume the build process exposes API_KEY from .env as process.env.API_KEY
declare const process: any;

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  isApiKeyAvailable = signal(false);
  isLoading = signal(false);
  
  messages = signal<ChatMessage[]>([]);
  
  newMessage = signal('');

  private chat: Chat | null = null;

  constructor() {
    let apiKey: string | undefined;
    try {
      // This is the only place we access `process`. If it fails, we catch it.
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
      }
    } catch (e) {
      console.warn('Could not access process.env.API_KEY. This is expected in a browser environment without a bundler.');
      apiKey = undefined;
    }

    if (apiKey) {
      this.isApiKeyAvailable.set(true);
      try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        this.chat = ai.chats.create({
          model: 'gemini-2.5-flash',
        });
        this.messages.set([{ role: 'model', text: 'Hello! How can I help you today?' }]);
      } catch (e) {
        console.error("Failed to initialize Gemini Chat", e);
        this.isApiKeyAvailable.set(false); // Revert on failure
        this.messages.set([
          { role: 'model', text: 'Error: Could not initialize the AI Chat service. The API key might be invalid.' }
        ]);
      }
    } else {
      this.isApiKeyAvailable.set(false);
      this.messages.set([
        { role: 'model', text: 'Chat is disabled. A Gemini API key is required to use this feature.' }
      ]);
    }
  }

  async sendMessage(): Promise<void> {
    const messageText = this.newMessage().trim();
    if (!messageText || !this.chat || this.isLoading() || !this.isApiKeyAvailable()) {
      return;
    }

    this.isLoading.set(true);
    
    // Add user message to chat
    this.messages.update(msgs => [...msgs, { role: 'user', text: messageText }]);
    this.newMessage.set('');

    // Add a placeholder for the model's streaming response
    this.messages.update(msgs => [...msgs, { role: 'model', text: '' }]);

    try {
      const result = await this.chat.sendMessageStream({ message: messageText });
      
      for await (const chunk of result) {
        const chunkText = chunk.text;
        this.messages.update(msgs => {
          const lastMsgIndex = msgs.length - 1;
          const updatedMsgs = [...msgs];
          if (updatedMsgs[lastMsgIndex].role === 'model') {
            updatedMsgs[lastMsgIndex].text += chunkText;
          }
          return updatedMsgs;
        });
      }

    } catch (e) {
      console.error("Error sending message to Gemini", e);
      const errorMessage = `Sorry, I encountered an error. Please try again. Details: ${(e as Error).message}`;
      this.messages.update(msgs => {
        const lastMsgIndex = msgs.length - 1;
        const updatedMsgs = [...msgs];
        if (updatedMsgs[lastMsgIndex].role === 'model' && updatedMsgs[lastMsgIndex].text === '') {
          updatedMsgs[lastMsgIndex].text = errorMessage;
        } else {
            updatedMsgs.push({role: 'model', text: errorMessage});
        }
        return updatedMsgs;
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  onInput(event: Event): void {
    this.newMessage.set((event.target as HTMLTextAreaElement).value);
  }
}
