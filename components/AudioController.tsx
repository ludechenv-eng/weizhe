import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioControllerProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isVisible: boolean;
}

export const AudioController: React.FC<AudioControllerProps> = ({ isMuted, onToggleMute, isVisible }) => {
  if (!isVisible) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleMute();
      }}
      className="absolute top-6 right-6 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-500 z-[70] group shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-3 overflow-hidden"
      aria-label={isMuted ? "Unmute" : "Mute"}
    >
      <div className="relative">
        {isMuted ? (
          <VolumeX size={20} className="group-hover:scale-110 transition-transform text-white/40" />
        ) : (
          <Volume2 size={20} className="group-hover:scale-110 transition-transform text-[#FF80A0]" />
        )}
        {!isMuted && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF80A0] rounded-full animate-pulse shadow-[0_0_8px_#FF80A0]" />
        )}
      </div>
      
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
        {isMuted ? "Audio Off" : "Ambient On"}
      </span>

      {/* Glassmorphism reflection */}
      <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] group-hover:left-[100%] transition-all duration-1000" />
    </button>
  );
};
