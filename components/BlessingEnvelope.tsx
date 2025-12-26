import React, { useState, useEffect } from 'react';

interface BlessingEnvelopeProps {
  isOpen: boolean;
  name?: string;
}

export const BlessingEnvelope: React.FC<BlessingEnvelopeProps> = ({ isOpen, name = "Weizhe" }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    let timer: number;
    if (isOpen) {
      // Delay text appearance until envelope settles (1.2s delay for entry)
      timer = window.setTimeout(() => setShowContent(true), 1200);
    } else {
      // When closing, let the content fade out naturally with the container
      setShowContent(false);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center pointer-events-none z-[100] transition-all duration-[1500ms] ease-in-out
        ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}
    >
      {/* Container with Frosted Glass & Rose Gold Accents */}
      <div className="relative w-[350px] max-w-[90vw] h-[520px] bg-pink-900/10 backdrop-blur-[25px] border border-pink-300/30 rounded-2xl shadow-[0_40px_100px_rgba(255,128,160,0.15)] overflow-hidden flex flex-col">
        
        {/* Envelope Top Flap Detail */}
        <div 
          className="absolute top-0 left-0 w-full h-36 bg-white/5 border-b border-white/10 z-10" 
          style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
        />

        {/* Wax Seal Detail */}
        <div className="absolute top-[125px] left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 shadow-[0_0_20px_rgba(255,128,160,0.6)] flex items-center justify-center border border-white/40 z-20">
          <div className="w-6 h-6 rounded-full border border-white/20 animate-pulse" />
        </div>

        {/* Letter Content */}
        <div className={`flex-1 p-8 pt-44 flex flex-col items-center text-center transition-all duration-[1200ms] transform ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          <h2 className="w-full text-left font-handwriting text-pink-200 text-2xl mb-6 tracking-wide drop-shadow-md">
            Dear {name},
          </h2>

          <div className="space-y-4 max-w-full">
            <p className="font-handwriting text-white/95 text-[1.3rem] leading-[1.4] px-2">
              May this Christmas bring you a peace that settles deeper than reason.
            </p>
            
            <p className="font-handwriting text-white/90 text-[1.2rem] leading-[1.4] px-1">
              Some seasons pass quietly, yet leave their mark — light appears, warmth lingers, and the heart remembers.
            </p>

            <p className="font-handwriting text-white/95 text-[1.3rem] leading-[1.4]">
              Thank you for being part of that season. Merry Christmas.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 w-full">
            <p className="font-handwriting text-pink-400/90 text-[1rem] leading-[1.5] italic">
              "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." (Philippians 4:7)
            </p>
          </div>
        </div>

        {/* Decorative corner borders */}
        <div className="absolute bottom-4 left-4 w-12 h-12 border-l border-b border-white/10 rounded-bl-xl" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-r border-b border-white/10 rounded-br-xl" />
      </div>
    </div>
  );
};