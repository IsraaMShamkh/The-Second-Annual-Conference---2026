
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Chat } from '@google/genai';
import { getSystemInstruction } from '../constants';
import { Message } from '../types';
import { base64ToUint8Array, arrayBufferToBase64, float32ToPCM16, decodeAudioData } from '../utils/audioUtils';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const MAX_RETRIES = 3;

export function useLiveSession() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const bookContentRef = useRef<string>("");
  const retryCountRef = useRef(0);
  const isMutedRef = useRef(false);
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Fix: Added missing toggleMute function to resolve scope error
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const getChatSession = async () => {
    if (!process.env.API_KEY) {
      setError("API Key is missing.");
      return null;
    }
    
    if (!chatSessionRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: getSystemInstruction(bookContentRef.current),
          tools: [{ googleSearch: {} }]
        }
      });
    }
    return chatSessionRef.current;
  };

  const sendTextWithImage = useCallback(async (text: string, base64Image?: string, isHiddenContext = false) => {
    if (!isHiddenContext) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: text || (base64Image ? "[صورة]" : ""),
        timestamp: new Date()
      }]);
    }

    try {
      const chat = await getChatSession();
      if (!chat) return;

      let messagePayload: any = text;
      if (base64Image) {
        // Multi-part message for chat.sendMessage
        messagePayload = [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: text || "يا أليكسا، حللي الصورة دي في سياق الكتاب اللي بندرسه." }
        ];
      }

      // Accessing .text property directly (not as a function) per SDK guidelines
      const response = await chat.sendMessage({ message: messagePayload });
      const responseText = response.text || "";
      
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingChunks = rawChunks?.map(chunk => ({
        web: chunk.web ? { uri: chunk.web.uri ?? "", title: chunk.web.title ?? "" } : undefined
      }));

      if (!isHiddenContext) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: responseText,
          timestamp: new Date(),
          groundingChunks: groundingChunks
        }]);
      }
      return responseText;
    } catch (error) {
      if (!isHiddenContext) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'system',
          text: "حصل مشكلة في التواصل.. ممكن تجرب تاني يا دكتور؟",
          timestamp: new Date()
        }]);
      }
    }
  }, []);

  // وظيفة مخصصة لإبلاغ أليكسا بوجود محتوى جديد (ملف أو كتاب)
  const notifyNewContent = useCallback(async (filename: string) => {
    await sendTextWithImage(`يا أليكسا، الدكتور رفع ملف جديد بعنوان "${filename}".. من فضلك استوعبي المحتوى الجديد ده وخليكي جاهزة لأي سؤال عنه.`, undefined, true);
  }, [sendTextWithImage]);

  const connect = useCallback(async (bookContent: string) => {
    bookContentRef.current = bookContent;
    setError(null);
    
    if (!process.env.API_KEY) {
      setError("API Key not found");
      return;
    }

    const startSession = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: OUTPUT_SAMPLE_RATE,
        });

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { channelCount: 1, sampleRate: INPUT_SAMPLE_RATE } 
        });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, 
            },
            systemInstruction: getSystemInstruction(bookContent),
          },
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              retryCountRef.current = 0;
              
              // الترحيب الذكي: فقط لو أول مرة
              if (!hasGreetedRef.current) {
                sendTextWithImage("أهلاً بك يا دكتور. أنا أليكسا، رفيقتك في دراسة هذا الكتاب. كيف يمكنني مساعدتك اليوم؟", undefined, true);
                hasGreetedRef.current = true;
              }

              const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
              const source = inputCtx.createMediaStreamSource(stream);
              inputSourceRef.current = source;
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(Math.min(rms * 5, 1)); 

                if (isMutedRef.current) return;
                const pcm16 = float32ToPCM16(inputData);
                const base64Data = arrayBufferToBase64(pcm16);

                if (sessionPromiseRef.current) {
                  sessionPromiseRef.current.then(session => {
                    session.sendRealtimeInput({
                      media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
                    });
                  });
                }
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && audioContextRef.current) {
                setIsSpeaking(true);
                const ctx = audioContextRef.current;
                const audioBytes = base64ToUint8Array(audioData);
                const audioBuffer = await decodeAudioData(audioBytes, ctx, OUTPUT_SAMPLE_RATE);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                const currentTime = ctx.currentTime;
                if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                scheduledSourcesRef.current.add(source);
                source.onended = () => {
                  scheduledSourcesRef.current.delete(source);
                  if (scheduledSourcesRef.current.size === 0) setIsSpeaking(false);
                };
              }

              if (msg.serverContent?.interrupted) {
                scheduledSourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
                scheduledSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
              }
            },
            onclose: () => setIsConnected(false),
            onerror: (err: any) => {
              setIsConnected(false);
              if (retryCountRef.current < MAX_RETRIES) {
                const delay = Math.pow(2, retryCountRef.current) * 1000;
                retryCountRef.current++;
                setTimeout(() => startSession(), delay);
              } else {
                setError("الخدمة مشغولة شوية.. جرب تاني كمان لحظات.");
              }
            }
          }
        });
        sessionPromiseRef.current = sessionPromise;
      } catch (e) {
        setError("تعذر الوصول للمايكروفون.");
        setIsConnected(false);
      }
    };
    startSession();
  }, [sendTextWithImage]);

  const disconnect = useCallback(() => {
    if (processorRef.current) processorRef.current.disconnect();
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsConnected(false);
    setIsSpeaking(false);
    sessionPromiseRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    retryCountRef.current = 0;
    connect(bookContentRef.current);
  }, [connect, disconnect]);

  return {
    connect,
    reconnect,
    disconnect,
    isConnected,
    isSpeaking,
    isMuted,
    toggleMute,
    volume,
    messages,
    error,
    sendText: sendTextWithImage,
    notifyNewContent
  };
}
