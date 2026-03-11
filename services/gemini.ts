import { ChGKQuestion } from "../types";

// Lazy initialization - GoogleGenAI faqat kerak bo'lganda yuklanadi
let aiInstance: any = null;

async function getAI() {
  if (!aiInstance) {
    const { GoogleGenAI } = await import("@google/genai");
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const generateChGKQuestion = async (): Promise<ChGKQuestion> => {
  const ai = await getAI();
  const { Type } = await import("@google/genai");

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: "Generate a professional-level 'What? Where? When?' (ChGK) intellectual game question in Uzbek. It should be challenging, logical, and have a clear answer. Include the question, correct answer, and a brief logical explanation.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          author: { type: Type.STRING }
        },
        required: ["question", "answer", "explanation"]
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to generate question");
  }
};

export const speakText = async (text: string): Promise<void> => {
  const ai = await getAI();
  const { Modality } = await import("@google/genai");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly in Uzbek: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from Gemini TTS");
  }

  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioToBuffer(audioBytes, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => { resolve(); };
      source.start();
    } catch (e) {
      console.error("Audio playback error:", e);
      reject(e);
    }
  });
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const numSamples = Math.floor(data.byteLength / 2);
  const dataInt16 = new Int16Array(data.buffer, 0, numSamples);
  const frameCount = numSamples / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
