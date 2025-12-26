import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { HandRotation, PinchData } from '../types';

interface GestureControlProps {
  onStateChange: (state: 'CONE' | 'EXPLODE') => void;
  onRotationChange: (rotation: HandRotation) => void;
  onPinchChange: (data: PinchData) => void;
}

export const AIGestureControl: React.FC<GestureControlProps> = ({ onStateChange, onRotationChange, onPinchChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const lastState = useRef<'CONE' | 'EXPLODE'>('CONE');

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setLandmarker(handLandmarker);
      } catch (err) {
        console.error("Failed to initialize MediaPipe Landmarker:", err);
      }
    };
    initLandmarker();
  }, []);

  useEffect(() => {
    if (!landmarker) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setIsCameraActive(true);
          };
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    startCamera();

    let lastVideoTime = -1;
    let animationFrameId: number;

    const predictWebcam = () => {
      if (!videoRef.current || !landmarker) {
        animationFrameId = requestAnimationFrame(predictWebcam);
        return;
      }

      if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0 && videoRef.current.currentTime !== lastVideoTime) {
        lastVideoTime = videoRef.current.currentTime;
        
        try {
          const results = landmarker.detectForVideo(videoRef.current, performance.now());

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const wrist = landmarks[0];
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            
            const getDist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

            // --- 核心重构：捏合绝对优先逻辑 (Pinch Supremacy) ---
            const pinchDist = getDist(thumbTip, indexTip);
            const pinchThreshold = 0.035; // 略微放宽一点动态余量，确保交互成功率
            const isPinchingNow = pinchDist < pinchThreshold;

            let newState: 'CONE' | 'EXPLODE' = 'EXPLODE';

            if (isPinchingNow) {
              // 1. 如果在捏合，强制挂起握拳判定，必须处于 EXPLODE 状态以允许抽卡
              newState = 'EXPLODE';
            } else {
              // 2. 只有在不捏合时，才进行“排他性握拳”判定 (Exclusive Fist)
              const tips = [12, 16, 20]; // 中指、无名指、小指
              const bases = [9, 13, 17];
              let otherFingersFolded = 0;
              tips.forEach((t, i) => {
                // 如果这些指尖离手腕比指根更近，判定为收拢
                if (getDist(landmarks[t], wrist) < getDist(landmarks[bases[i]], wrist) * 1.1) {
                  otherFingersFolded++;
                }
              });
              // 同时检测食指是否也收拢（捏合不成立的情况下）
              if (getDist(landmarks[8], wrist) < getDist(landmarks[5], wrist) * 1.1) {
                otherFingersFolded++;
              }
              
              newState = otherFingersFolded >= 3 ? 'CONE' : 'EXPLODE';
            }

            // 状态变更上报
            if (newState !== lastState.current) {
              onStateChange(newState);
              lastState.current = newState;
            }

            // 捏合数据上报
            const pinchPos: [number, number, number] = [
              (0.5 - (thumbTip.x + indexTip.x) / 2) * 35,
              (0.5 - (thumbTip.y + indexTip.y) / 2) * 25 + 5,
              0
            ];

            onPinchChange({
              active: isPinchingNow,
              position: pinchPos,
              content: "" 
            });

            // 旋转跟随
            onRotationChange({ y: (1 - wrist.x - 0.5) * Math.PI * 2, x: (wrist.y - 0.5) * Math.PI * 0.3 });
          } else {
            onPinchChange({ active: false, position: [0, 0, 0], content: "" });
          }
        } catch (e) { console.warn(e); }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    animationFrameId = requestAnimationFrame(predictWebcam);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [landmarker, onStateChange, onRotationChange, onPinchChange]);

  return (
    <div className="absolute bottom-6 right-6 w-[200px] aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 bg-black/40 backdrop-blur-md">
      <video ref={videoRef} className="w-full h-full object-cover mirrored opacity-90 grayscale-[0.2]" autoPlay muted playsInline />
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 rounded-md text-[9px] text-[#FF80A0] font-black uppercase tracking-[0.2em] border border-white/10">Neural Vision</div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
         <div className={`w-1.5 h-1.5 rounded-full ${isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
         <span className="text-[8px] text-white/50 uppercase tracking-widest font-bold">Sense: {isCameraActive ? 'Online' : 'Loading'}</span>
      </div>
    </div>
  );
};