declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    electron: any;
  }
}

export {};
