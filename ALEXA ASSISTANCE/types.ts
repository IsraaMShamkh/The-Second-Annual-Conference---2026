export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isPartial?: boolean;
  groundingChunks?: Array<{
    web?: { uri: string; title: string };
  }>;
}

export interface AudioStreamConfig {
  sampleRate: number;
}

export interface LiveSessionState {
  isConnected: boolean;
  isSpeaking: boolean;
  volume: number;
  messages: Message[];
}

export interface BookMetadata {
  title: string;
  content: string; // Extracted text
}