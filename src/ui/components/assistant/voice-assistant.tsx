import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";
import AudioVisualizer from "./audio-visualizer";
import "./assistant.css";
import { LLMResponse } from "../../../types/llm";

const VoiceAssistant: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "listening" | "speaking">(
    "idle"
  );
  const [message, setMessage] = useState<string>("How can I help you today?");
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  const [llmResponse, setLlmResponse] = useState<LLMResponse | undefined>(
    undefined
  );
  const [displayedMessage, setDisplayedMessage] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    return () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (speechSynthesis && speechSynthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Speak message when it changes and status is speaking
  useEffect(() => {
    if (
      status === "speaking" &&
      message &&
      message !== "Processing your request..."
    ) {
      speakMessage(message);
    }
  }, [message, status]);

  // Speak LLM response when it changes
  useEffect(() => {
    if (llmResponse && llmResponse.response) {
      setMessage(llmResponse.response);
    } else if (llmResponse && llmResponse.error) {
      setMessage(llmResponse.error);
    }
  }, [llmResponse]);

  // Remove the separate animation effect from message changes
  useEffect(() => {
    if (message === "Listening..." || message === "Processing your request...") {
      setDisplayedMessage(message);
      return;
    }
  }, [message]);

  // Speech synthesis function
  const speakMessage = (text: string) => {
    if (!speechSynthesis) return;

    // Cancel any ongoing speech and clear animation timeout
    speechSynthesis.cancel();
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Calculate average speaking rate (words per minute)
    const wordsPerMinute = 175; // Average speaking rate
    const wordDelay = (60 * 1000) / wordsPerMinute; // Milliseconds per word

    // Create new utterance
    speechSynthesisRef.current = new SpeechSynthesisUtterance(text);
    speechSynthesisRef.current.rate = 1.0; // Normal speech rate
    speechSynthesisRef.current.onend = () => {
      if (status === "speaking") {
        setStatus("idle");
      }
    };

    // Reset displayed message and start animation
    setDisplayedMessage("");
    const words = text.split(" ");
    let displayedWords: string[] = [];
    setIsAnimating(true);

    const animateText = () => {
      if (displayedWords.length < words.length) {
        displayedWords.push(words[displayedWords.length]);
        setDisplayedMessage(displayedWords.join(" "));
        animationTimeoutRef.current = setTimeout(animateText, wordDelay);
      } else {
        setIsAnimating(false);
      }
    };

    // Start speaking and animation
    speechSynthesis.speak(speechSynthesisRef.current);
    animateText();
  };

  // Start listening
  const startListening = async () => {
    try {
      if (!audioContextRef.current || !analyserRef.current) return;

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
        },
      });

      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(
        micStreamRef.current
      );
      sourceNodeRef.current.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(micStreamRef.current, {
        mimeType: "audio/webm;codecs=opus",
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms

      setStatus("listening");
      setMessage("Listening...");

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioData = () => {
        if (analyserRef.current && status === "listening") {
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(new Uint8Array(dataArray));
          animationFrameRef.current = requestAnimationFrame(updateAudioData);
        }
      };

      updateAudioData();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMessage(
        "Microphone access denied. Please allow microphone access and try again."
      );
      setStatus("idle");
    }
  };

  // Stop listening and process audio
  const stopListening = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        sendOrchestrateEvent();
      };
    } else {
      sendOrchestrateEvent();
    }

    setAudioData(undefined);
  };

  // Send orchestrate event
  const sendOrchestrateEvent = async () => {
    setStatus("speaking");
    setMessage("Processing your request...");

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
      const audioBuffer = await audioBlob.arrayBuffer();

      const response = await window.electron.orchestrate({
        audioData: Array.from(new Uint8Array(audioBuffer)), // Convert to regular array for IPC transmission
      });

      setLlmResponse(JSON.parse(response));
    } catch (error) {
      console.error("Error sending orchestrate event:", error);
      setMessage("Failed to process your request. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-2xl px-6 py-4 mb-12 rounded-lg mt-10">
        <p className="text-md font-medium text-teal-600 text-center leading-relaxed">
          {displayedMessage}
          {isAnimating && <span className="animate-pulse">▋</span>}
        </p>
      </div>

      <div className="relative mb-8">
        <AudioVisualizer status={status} audioData={audioData} />
        <button
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12
                     rounded-full p-4 transition-all duration-300
                     ${
                       status === "idle"
                         ? "bg-blue-500 hover:bg-blue-600"
                         : status === "listening"
                         ? "bg-red-500 hover:bg-red-600"
                         : "bg-purple-500 hover:bg-purple-600"
                     }`}
          onClick={status === "idle" ? startListening : stopListening}
          disabled={status === "speaking"}
        >
          {status === "idle" || status === "listening" ? (
            <Mic className="w-8 h-8 text-white" />
          ) : (
            <Volume2 className="w-8 h-8 text-white" />
          )}
        </button>
      </div>

      <div className="text-center text-gray-300 mt-16">
        {status === "idle"
          ? "Click the microphone to start speaking"
          : status === "listening"
          ? "Listening to your voice..."
          : "AI is responding..."}
      </div>
    </div>
  );
};

export default VoiceAssistant;
