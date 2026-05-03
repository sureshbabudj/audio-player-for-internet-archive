import React from "react";
import { Icon } from "@iconify/react";

interface VisualizerProps {
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const bars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-end justify-center gap-1 h-12">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-1.5 rounded-full bg-gradient-to-t from-primary-500 to-primary-300 transition-all duration-300 ${
            isPlaying ? "animate-equalizer" : "h-2"
          }`}
          style={{
            animationDelay: `${bar * 0.15}s`,
            height: isPlaying ? undefined : "8px",
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;
