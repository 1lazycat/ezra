import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";
import AudioVisualizer from "./audio-visualizer";
import "./assistant.css";

const VoiceAssistant: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "listening" | "speaking">(
    "idle"
  );
  const [message, setMessage] = useState<string>("How can I help you today?");
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);

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
    };
  }, []);

  // Start listening
  const startListening = async () => {
    try {
      if (!audioContextRef.current || !analyserRef.current) return;

      // Resume audio context if suspended
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Request microphone access
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Connect microphone to analyzer
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(
        micStreamRef.current
      );
      sourceNodeRef.current.connect(analyserRef.current);

      setStatus("listening");
      setMessage("Listening...");

      // Start analyzing audio
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioData = () => {
        if (analyserRef.current && status === "listening") {
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(new Uint8Array(dataArray));
          animationFrameRef.current = requestAnimationFrame(updateAudioData);
        }
      };

      updateAudioData();

      // Simulate AI response after 5 seconds
      setTimeout(() => {
        stopListening();
        simulateResponse();
      }, 5000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMessage(
        "Microphone access denied. Please allow microphone access and try again."
      );
      setStatus("idle");
    }
  };

  // Stop listening
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

    setAudioData(undefined);
    setStatus("idle");
  };

  // Simulate AI response
  const simulateResponse = () => {
    setStatus("speaking");
    setMessage("I understand your request. How else can I assist you?");

    // Simulate speaking animation
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      let time = 0;
      const updateSpeakingAnimation = () => {
        if (status === "speaking") {
          time += 0.1;

          // Generate synthetic audio data for visualization
          for (let i = 0; i < dataArray.length; i++) {
            const frequency = (i / dataArray.length) * 10;
            dataArray[i] =
              128 + Math.sin(time * 5 + frequency) * 64 * Math.sin(time);
          }

          setAudioData(new Uint8Array(dataArray));
          animationFrameRef.current = requestAnimationFrame(
            updateSpeakingAnimation
          );
        }
      };

      updateSpeakingAnimation();

      // End speaking after 4 seconds
      setTimeout(() => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioData(undefined);
        setStatus("idle");
        setMessage("How can I help you today?");
      }, 4000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <p className="text-xl">{message}</p>
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
