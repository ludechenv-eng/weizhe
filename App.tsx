import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TreeVisualizer } from './components/TreeVisualizer';
import { THEME_CONFIG, CONTENT_POOL } from './constants';
import { AIGestureControl } from './components/AIGestureControl';
import { BlessingEnvelope } from './components/BlessingEnvelope';
import { HandRotation, PinchData } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<'CONE' | 'EXPLODE'>('CONE');
  const [handRotation, setHandRotation] = useState<HandRotation>({ x: 0, y: 0 });
  const [pinchData, setPinchData] = useState<PinchData>({
    active: false,
    position: [0, 0, 0],
    content: ""
  });
  
  // Envelope State
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [hasShownInCycle, setHasShownInCycle] = useState(false);
  const openPalmTimer = useRef<number | null>(null);
  const autoCloseTimer = useRef<number | null>(null);

  const wasPinching = useRef(false);
  const pinchConfidence = useRef(0);
  const CONFIDENCE_THRESHOLD = 3; 

  // Watch for "Initiate" state (Palm Open or Click) to trigger envelope with 2s delay and 8s auto-close
  useEffect(() => {
    // Condition for triggering the blessing: Tree exploded and no active pinch interaction
    const isInitiatedAndFree = treeState === 'EXPLODE' && !pinchData.active;

    if (treeState === 'CONE') {
      // RESET RULE: Clear UI and cycle markers immediately on "Fist" or "Click to Reset"
      setHasShownInCycle(false);
      setIsEnvelopeOpen(false);
      if (openPalmTimer.current) { clearTimeout(openPalmTimer.current); openPalmTimer.current = null; }
      if (autoCloseTimer.current) { clearTimeout(autoCloseTimer.current); autoCloseTimer.current = null; }
    } else if (isInitiatedAndFree && !hasShownInCycle) {
      // Initiation detected (Explode mode active)
      if (!openPalmTimer.current && !isEnvelopeOpen) {
        // Wait 2 seconds before showing the envelope
        openPalmTimer.current = window.setTimeout(() => {
          setIsEnvelopeOpen(true);
          setHasShownInCycle(true); // Mark cycle as completed (needs CONE/Reset to trigger again)
          openPalmTimer.current = null;
          
          // Auto-fade after 8 seconds of visibility (Updated from 5s to 8s)
          autoCloseTimer.current = window.setTimeout(() => {
            setIsEnvelopeOpen(false);
            autoCloseTimer.current = null;
          }, 8000);
        }, 2000); 
      }
    } else if (!isInitiatedAndFree) {
      // Clear trigger timer if state changes before 2s delay completes
      if (openPalmTimer.current) {
        clearTimeout(openPalmTimer.current);
        openPalmTimer.current = null;
      }
      // Immediate hide if user starts pinching while envelope is open
      if (pinchData.active && isEnvelopeOpen) {
        setIsEnvelopeOpen(false);
        if (autoCloseTimer.current) { clearTimeout(autoCloseTimer.current); autoCloseTimer.current = null; }
      }
    }

    return () => {
      if (openPalmTimer.current) clearTimeout(openPalmTimer.current);
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [treeState, pinchData.active, hasShownInCycle, isEnvelopeOpen]);

  const handleStateChange = useCallback((newState: 'CONE' | 'EXPLODE') => {
    if (newState !== treeState) {
      setTreeState(newState);
      if (newState === 'CONE') {
        setPinchData(prev => ({ ...prev, active: false }));
        wasPinching.current = false;
        pinchConfidence.current = 0;
      }
    }
  }, [treeState]);

  const handlePinchUpdate = useCallback((data: PinchData) => {
    const isModeAllowed = treeState === 'EXPLODE';

    if (isModeAllowed && data.active) {
      pinchConfidence.current = Math.min(pinchConfidence.current + 1, CONFIDENCE_THRESHOLD + 1);
    } else {
      pinchConfidence.current = Math.max(pinchConfidence.current - 1, 0);
    }

    const isStablePinch = pinchConfidence.current >= CONFIDENCE_THRESHOLD;

    if (isModeAllowed && isStablePinch) {
      if (!wasPinching.current) {
        const randomText = CONTENT_POOL[Math.floor(Math.random() * CONTENT_POOL.length)];
        setPinchData({ ...data, active: true, content: randomText });
      } else {
        setPinchData(prev => ({ ...data, active: true, content: prev.content }));
      }
      wasPinching.current = true;
    } else {
      setPinchData(prev => ({ ...data, active: false, content: prev.content }));
      wasPinching.current = false;
    }
  }, [treeState]);

  // Dual-mode Interaction: Toggle state via Screen Click
  const handleGlobalClick = () => {
    handleStateChange(treeState === 'CONE' ? 'EXPLODE' : 'CONE');
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden cursor-pointer select-none"
      style={{ backgroundColor: THEME_CONFIG.bg }}
      onClick={handleGlobalClick}
    >
      <TreeVisualizer 
        treeState={treeState} 
        handRotation={handRotation} 
        pinchData={pinchData}
      />

      {/* Dual-mode Interaction: MediaPipe Gesture Control */}
      <AIGestureControl 
        onStateChange={handleStateChange} 
        onRotationChange={setHandRotation}
        onPinchChange={handlePinchUpdate}
      />

      <BlessingEnvelope isOpen={isEnvelopeOpen} name="Weizhe" />

      {/* Aesthetic Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] mix-blend-multiply" />
      
      {/* Header UI */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center pointer-events-none transition-all duration-1000 opacity-100">
        <h1 className="text-white text-3xl font-thin tracking-[0.6em] uppercase mb-3 opacity-90 pl-[0.6em]">Sakura Noel</h1>
        <div className="flex items-center justify-center gap-6">
          <span className="w-12 h-[1px] bg-[#FF80A0]/20" />
          <p className="text-[#FF80A0] text-[9px] font-bold tracking-[0.4em] uppercase opacity-60">
            {treeState === 'CONE' ? 'Gathering Focus' : 'Neural Interface Active'}
          </p>
          <span className="w-12 h-[1px] bg-[#FF80A0]/20" />
        </div>
      </div>

      {/* Bottom Interface Hints */}
      <div className="absolute bottom-10 left-10 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${treeState === 'EXPLODE' ? 'bg-[#FF80A0] animate-pulse' : 'bg-white/20'}`} />
            <span className={`text-[8px] uppercase tracking-[0.2em] ${treeState === 'EXPLODE' ? 'text-white/40' : 'text-white/10'}`}>
              {hasShownInCycle ? '• BLESSING RECEIVED' : '• OPEN HAND TO INITIATE'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full border border-[#FF80A0] ${treeState === 'CONE' ? 'bg-[#FF80A0]/50' : ''}`} />
            <span className="text-white/40 text-[8px] uppercase tracking-[0.2em]">
              • FIST TO RESET
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;