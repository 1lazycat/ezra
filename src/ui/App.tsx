import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import VoiceAssistant from "./components/assistant/voice-assistant";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <VoiceAssistant />
    </div>
  );
}

export default App;
