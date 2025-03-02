import React, { useRef, useEffect, useState } from "react";

interface AudioVisualizerProps {
  status: "idle" | "listening" | "speaking";
  audioData?: Uint8Array;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  status,
  audioData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [amplitude, setAmplitude] = useState<number>(0);

  // Base colors for different states
  const colors = {
    idle: { r: 200, g: 200, b: 255 },
    listening: { r: 0, g: 150, b: 255 },
    speaking: { r: 180, g: 100, b: 255 },
  };

  // Vibrant color palette for speaking state
  const vibrantColors = [
    { r: 255, g: 50, b: 100 }, // Pink
    { r: 100, g: 200, b: 255 }, // Light Blue
    { r: 255, g: 200, b: 100 }, // Light Orange
    { r: 180, g: 100, b: 255 }, // Purple
    { r: 100, g: 255, b: 150 }, // Green
  ];

  // Current color state (will be interpolated)
  const [currentColor, setCurrentColor] = useState(colors.idle);

  // Calculate average amplitude from audio data
  useEffect(() => {
    if (audioData && audioData.length > 0) {
      const sum = audioData.reduce((acc, val) => acc + val, 0);
      const avg = sum / audioData.length / 255; // Normalize to 0-1
      setAmplitude(avg * 0.7 + 0.3); // Add base amplitude
    } else {
      // Gentle pulsing when no audio
      const time = Date.now() / 1000;
      const pulse = Math.sin(time * 2) * 0.1 + 0.3;
      setAmplitude(pulse);
    }
  }, [audioData]);

  // Interpolate color based on status
  useEffect(() => {
    const targetColor = colors[status];
    const interpolateColor = () => {
      setCurrentColor((prevColor) => {
        const newColor = {
          r: prevColor.r + (targetColor.r - prevColor.r) * 0.1,
          g: prevColor.g + (targetColor.g - prevColor.g) * 0.1,
          b: prevColor.b + (targetColor.b - prevColor.b) * 0.1,
        };
        return newColor;
      });

      if (animationRef.current) {
        requestAnimationFrame(interpolateColor);
      }
    };

    interpolateColor();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [status]);

  // Draw animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const drawFrame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate current time for animation
      const time = Date.now() / 1000;

      // Draw wave-like visualization
      const waveHeight = canvas.height * 0.2 * amplitude;
      const waveWidth = canvas.width * 0.8;
      const startX = (canvas.width - waveWidth) / 2;
      const startY = canvas.height / 2;

      // Draw multiple overlapping waves with different phases and frequencies
      const drawWave = (
        frequency: number,
        phase: number,
        amplitude: number,
        color: { r: number; g: number; b: number },
        opacity: number,
        isMultiColor: boolean = false
      ) => {
        ctx.beginPath();

        // Start from left side
        ctx.moveTo(startX, startY);

        // Draw the wave path
        for (let x = 0; x <= waveWidth; x += 1) {
          const normalizedX = x / waveWidth;
          const y =
            Math.sin(normalizedX * Math.PI * frequency + time * 2 + phase) *
            waveHeight *
            amplitude *
            (1 - Math.pow(2 * normalizedX - 1, 2));

          ctx.lineTo(startX + x, startY + y);
        }

        // Mirror the wave for the bottom half
        for (let x = waveWidth; x >= 0; x -= 1) {
          const normalizedX = x / waveWidth;
          const y =
            Math.sin(
              normalizedX * Math.PI * frequency + time * 2 + phase + Math.PI
            ) *
            waveHeight *
            amplitude *
            (1 - Math.pow(2 * normalizedX - 1, 2));

          ctx.lineTo(startX + x, startY + y);
        }

        ctx.closePath();

        // Fill with gradient
        if (isMultiColor && status === "speaking") {
          // Create multi-color gradient for speaking state
          const gradient = ctx.createLinearGradient(
            startX,
            startY,
            startX + waveWidth,
            startY
          );

          // Add multiple color stops for vibrant effect
          gradient.addColorStop(
            0,
            `rgba(${vibrantColors[0].r}, ${vibrantColors[0].g}, ${vibrantColors[0].b}, ${opacity})`
          );
          gradient.addColorStop(
            0.25,
            `rgba(${vibrantColors[1].r}, ${vibrantColors[1].g}, ${vibrantColors[1].b}, ${opacity})`
          );
          gradient.addColorStop(
            0.5,
            `rgba(${vibrantColors[2].r}, ${vibrantColors[2].g}, ${vibrantColors[2].b}, ${opacity})`
          );
          gradient.addColorStop(
            0.75,
            `rgba(${vibrantColors[3].r}, ${vibrantColors[3].g}, ${vibrantColors[3].b}, ${opacity})`
          );
          gradient.addColorStop(
            1,
            `rgba(${vibrantColors[4].r}, ${vibrantColors[4].g}, ${vibrantColors[4].b}, ${opacity})`
          );

          ctx.fillStyle = gradient;
        } else {
          // Standard gradient for non-speaking states
          const gradient = ctx.createLinearGradient(
            startX,
            startY - waveHeight,
            startX,
            startY + waveHeight
          );
          gradient.addColorStop(
            0,
            `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(
              color.b
            )}, ${opacity * 0.7})`
          );
          gradient.addColorStop(
            0.5,
            `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(
              color.b
            )}, ${opacity})`
          );
          gradient.addColorStop(
            1,
            `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(
              color.b
            )}, ${opacity * 0.7})`
          );

          ctx.fillStyle = gradient;
        }

        ctx.fill();
      };

      // Create dynamic color shift for speaking state
      const getShiftedColor = (index: number) => {
        if (status === "speaking") {
          // Cycle through vibrant colors with time
          const colorIndex = Math.floor(
            (time + index * 0.5) % vibrantColors.length
          );
          const nextColorIndex = (colorIndex + 1) % vibrantColors.length;
          const t = (time + index * 0.5) % 1;

          // Interpolate between colors for smooth transitions
          return {
            r:
              vibrantColors[colorIndex].r * (1 - t) +
              vibrantColors[nextColorIndex].r * t,
            g:
              vibrantColors[colorIndex].g * (1 - t) +
              vibrantColors[nextColorIndex].g * t,
            b:
              vibrantColors[colorIndex].b * (1 - t) +
              vibrantColors[nextColorIndex].b * t,
          };
        }
        return currentColor;
      };

      // Draw multiple overlapping waves with different phases and colors
      drawWave(2, 0, 0.6, getShiftedColor(0), 0.3, true);
      drawWave(3, Math.PI / 4, 0.4, getShiftedColor(1), 0.4, true);
      drawWave(1, Math.PI / 2, 0.8, getShiftedColor(2), 0.5, true);
      drawWave(2.5, Math.PI, 0.5, getShiftedColor(3), 0.2, true);

      // Add horizontal line in the middle
      ctx.beginPath();
      ctx.moveTo(startX - 20, startY);
      ctx.lineTo(startX + waveWidth + 20, startY);

      // Make the line also colorful when speaking
      if (status === "speaking") {
        const gradient = ctx.createLinearGradient(
          startX - 20,
          startY,
          startX + waveWidth + 20,
          startY
        );
        gradient.addColorStop(
          0,
          `rgba(${vibrantColors[0].r}, ${vibrantColors[0].g}, ${vibrantColors[0].b}, 0.6)`
        );
        gradient.addColorStop(
          0.5,
          `rgba(${vibrantColors[2].r}, ${vibrantColors[2].g}, ${vibrantColors[2].b}, 0.6)`
        );
        gradient.addColorStop(
          1,
          `rgba(${vibrantColors[4].r}, ${vibrantColors[4].g}, ${vibrantColors[4].b}, 0.6)`
        );
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = `rgba(${Math.round(currentColor.r)}, ${Math.round(
          currentColor.g
        )}, ${Math.round(currentColor.b)}, 0.5)`;
      }

      ctx.lineWidth = 1;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    // Set canvas size
    const resizeCanvas = () => {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
      canvas.width = size;
      canvas.height = size * 0.5; // Make it more rectangular for the wave
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start animation
    drawFrame();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [amplitude, currentColor, status]);

  return <canvas ref={canvasRef} className="audio-visualizer" />;
};

export default AudioVisualizer;
