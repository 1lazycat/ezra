import { useEffect, useState, useCallback } from "react";

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  var SpeechRecognition: undefined | any;
  var webkitSpeechRecognition: undefined | any;
  export interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export const useSpeechRecognition = (
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
) => {
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );
  const [listening, setListening] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const transcript = results.map((result) => result[0].transcript).join("");
      onResult(transcript);
      // Reset retry count on successful result
      setRetryCount(0);
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "network") {
        setError("Network connection issue. Retrying...");
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            try {
              recognitionInstance.stop();
              recognitionInstance.start();
            } catch (err) {
              console.error("Failed to restart recognition:", err);
            }
          }, RETRY_DELAY * (retryCount + 1));
        } else {
          setError(
            "Network connection failed. Please check your internet connection and try again."
          );
          setListening(false);
          if (onError) {
            onError("Network connection failed after multiple retries");
          }
        }
      } else {
        setError(event.error);
        setListening(false);
        if (onError) {
          onError(event.error);
        }
      }
    };

    recognitionInstance.onend = () => {
      // If we're supposed to be listening but recognition ended, try to restart
      if (listening && retryCount < MAX_RETRIES) {
        try {
          recognitionInstance.start();
        } catch (err) {
          console.error("Failed to restart recognition:", err);
        }
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [onResult, onError, retryCount, listening]);

  const start = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
        setListening(true);
        setError(null);
        setRetryCount(0);
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setError("Failed to start speech recognition");
        setListening(false);
      }
    }
  }, [recognition]);

  const stop = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setListening(false);
    }
  }, [recognition]);

  return {
    start,
    stop,
    listening,
    error,
    recognition,
  };
};

export const useSpeechSynthesis = (voice?: SpeechSynthesisVoice) => {
  const [speaking, setSpeaking] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(
    null
  );

  useEffect(() => {
    const setupUtterance = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voice ||
        voices.find((v) => v.name.toLowerCase().includes("zira")) ||
        voices[0];

      const utterance = new SpeechSynthesisUtterance();
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      setUtterance(utterance);
    };

    // Handle both initial load and dynamic voice loading
    setupUtterance();
    window.speechSynthesis.onvoiceschanged = setupUtterance;

    return () => {
      window.speechSynthesis.cancel();
      if (utterance) {
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
      }
    };
  }, [voice]);

  const speak = useCallback(
    (message: string) => {
      if (utterance) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        utterance.text = message;
        window.speechSynthesis.speak(utterance);
      }
    },
    [utterance]
  );

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  return { speaking, speak, cancel, pause, resume, utterance };
};
