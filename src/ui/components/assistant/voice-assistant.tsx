import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Volume2,
  CircleDot,
  Circle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import AudioVisualizer from "./audio-visualizer";
import "./assistant.css";
import { LLMResponse } from "../../../types/llm";
import { useSpeechSynthesis } from "../../hooks/speech.hook";

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
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const { speak } = useSpeechSynthesis();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add new state for tracking execution
  const [stepStates, setStepStates] = useState<
    ("pending" | "active" | "completed")[]
  >([]);
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);

  // Initialize audio context
  useEffect(() => {
    setTimeout(() => {
      speakMessage(message);
    }, 1000);

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

  // Handle step execution
  useEffect(() => {
    if (llmResponse && !isExecutingPlan) {
      setIsExecutingPlan(true);
      if (llmResponse.plan.steps) {
        setStepStates(
          llmResponse.plan.steps.map((step) =>
            step.completed ? "completed" : "pending"
          )
        );
        executeSteps(llmResponse);
      }
    }
  }, [llmResponse]);

  const executeSteps = async (response: LLMResponse) => {
    for (let i = 0; i < response.plan.steps?.length; i++) {
      const step = response.plan.steps[i];

      if (step.completed) {
        continue;
      }

      const toolName = Object.keys(step.tool)[0];
      const toolArgs = step.tool[toolName].args;
      speak(step.description);

      try {
        const result = JSON.parse(
          await window.electron.execute(toolName, toolArgs)
        );
        if (result?.data !== undefined && llmResponse?.plan?.steps?.[i]) {
          // speak(`The result is ${result.data}`);
          if (llmResponse.plan.steps[i].tool[toolName]) {
            llmResponse.plan.steps[i].tool[toolName].result = result.data;
          }
        }
        if (response.plan.steps?.[i]) {
          response.plan.steps[i].completed = true;
        }

        if (i === response.plan.steps.length - 1) {
          const answer = await window.electron.answer({
            query: response.query,
            rawAnswer: result.data,
          });
          setMessage(answer);
          setTimeout(() => {
            speakMessage(answer);
          }, 1000);
          setIsExecutingPlan(false);
          setStatus("idle");
        }
      } catch (error: unknown) {
        console.error(`Error executing tool ${toolName}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        speak(`Failed to execute step: ${errorMessage}`);
        setMessage(`Failed to execute step: ${step.description}`);
        setIsExecutingPlan(false);
        setStatus("idle");
        return;
      }
    }
    setLlmResponse(JSON.parse(JSON.stringify(response)));
  };

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
      setLlmResponse(undefined);
      setDisplayedMessage("");

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

  const renderExecutionPlan = () => {
    if (!llmResponse?.plan?.steps || llmResponse.plan.steps.length === 0)
      return null;

    return (
      <div className="fixed right-8 top-8 h-[calc(100vh-4rem)] w-1/3 execution-plan glass-panel p-6 overflow-y-auto">
        <h3 className="text-xl font-semibold text-white/90 mb-4 flex items-center">
          <CircleDot className="w-5 h-5 mr-2 text-blue-400" />
          Execution Plan
        </h3>
        <div className="space-y-4">
          {llmResponse.plan.steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg execution-step glass-panel-hover
                ${stepStates[index] === "completed" ? "step-complete" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {stepStates[index] === "active" ? (
                    <CircleDot className="w-5 h-5 status-icon status-icon-active" />
                  ) : stepStates[index] === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 status-icon status-icon-completed" />
                  ) : (
                    <Circle className="w-5 h-5 status-icon status-icon-pending" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80">{step.description}</p>
                  {step.tool && (
                    <div className="mt-2 text-xs text-white/60 flex items-center">
                      <span className="mr-1">Tool:</span>
                      {Object.keys(step.tool)[0]}
                    </div>
                  )}

                  {step.tool && step.tool[Object.keys(step.tool)[0]].result && (
                    <div className="mt-2 text-xs text-white/60 flex items-center">
                      <span className="mr-1">Result:</span>
                      {step.tool[Object.keys(step.tool)[0]].result}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gradient-to-br">
      <div className="flex-[2] flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl px-8 py-6 mb-12 ">
          <p className="text-lg font-medium text-teal-600 animated-message text-center leading-relaxed">
            {displayedMessage}
            {isAnimating && <span className="cursor animate-pulse" />}
          </p>
        </div>

        <div className="relative mb-12">
          <div className="p-8">
            <AudioVisualizer status={status} audioData={audioData} />
          </div>
          <button
            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12
                       rounded-full p-4 glass-panel transition-all duration-300
                       hover:scale-105 hover:shadow-lg
                       ${
                         status === "idle"
                           ? "hover:shadow-blue-500/20"
                           : status === "listening"
                           ? "hover:shadow-red-500/20"
                           : "hover:shadow-purple-500/20"
                       }`}
            onClick={status === "idle" ? startListening : stopListening}
            disabled={status === "speaking"}
          >
            {status === "idle" || status === "listening" ? (
              <Mic
                className={`w-8 h-8 ${
                  status === "idle" ? "text-blue-400" : "text-red-400"
                }`}
              />
            ) : (
              <Volume2 className="w-8 h-8 text-purple-400" />
            )}
          </button>
        </div>

        <div className="text-center text-gray-400 mt-20">
          {status === "idle" ? (
            <div className="flex items-center justify-center">
              Click the microphone to start speaking
            </div>
          ) : status === "listening" ? (
            <div className="flex items-center justify-center">
              Listening to your voice...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              AI is responding...
            </div>
          )}
        </div>
      </div>
      {llmResponse?.plan?.steps && llmResponse.plan.steps.length > 0 && (
        <div className="flex-1">{renderExecutionPlan()}</div>
      )}
    </div>
  );
};

export default VoiceAssistant;
