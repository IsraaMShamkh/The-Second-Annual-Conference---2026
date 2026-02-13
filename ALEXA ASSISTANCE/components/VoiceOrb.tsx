import React, { useEffect, useRef, useState } from 'react';
import { RefreshCcw, Mic, MicOff } from 'lucide-react';

interface VoiceOrbProps {
  isConnected: boolean;
  isModelSpeaking: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  userVolume: number; 
  onClick: () => void;
  isDarkMode: boolean;
  error?: string | null;
  onReconnect?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ 
  isConnected, isModelSpeaking, isMuted, toggleMute, userVolume, onClick, isDarkMode, error, onReconnect 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const [position, setPosition] = useState({ x: window.innerWidth - 180, y: window.innerHeight - 250 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const hasMovedRef = useRef(false);

  const currentRadius = useRef(60);
  const targetRadius = useRef(60);
  
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging && dragStartRef.current) {
        hasMovedRef.current = true;
        const newX = clientX - dragStartRef.current.x;
        const newY = clientY - dragStartRef.current.y;
        const boundedX = Math.min(Math.max(0, newX), window.innerWidth - 160);
        const boundedY = Math.min(Math.max(0, newY), window.innerHeight - 160);
        setPosition({ x: boundedX, y: boundedY });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    if (isDragging) {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 240;
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      let baseSize = 50;
      let activityFactor = 0;

      if (isModelSpeaking) {
        activityFactor = Math.sin(Date.now() / 150) * 0.2 + 0.3; 
      } else if (isConnected && !isMuted) {
        activityFactor = userVolume; 
      }

      targetRadius.current = baseSize + (activityFactor * 40);
      currentRadius.current += (targetRadius.current - currentRadius.current) * 0.1;

      let glowColor = isDarkMode 
          ? (isModelSpeaking ? '6, 182, 212' : '59, 130, 246') 
          : (isModelSpeaking ? '236, 72, 153' : '99, 102, 241');

      if (error) {
        glowColor = '239, 68, 68';
      } else if (isMuted) {
        glowColor = '148, 163, 184'; // Grayish when muted
      }

      const coreColor = error 
          ? '#ef4444' 
          : (isMuted ? '#64748b' : (isDarkMode
              ? (isModelSpeaking ? '#0ea5e9' : '#1e293b')
              : (isModelSpeaking ? '#ec4899' : '#fff')));

      const gradient = ctx.createRadialGradient(centerX, centerY, currentRadius.current * 0.5, centerX, centerY, currentRadius.current * 1.5);
      gradient.addColorStop(0, `rgba(${glowColor}, 0.6)`);
      gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius.current * 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseSize, 0, Math.PI * 2);
      ctx.fillStyle = coreColor;
      ctx.fill();
      
      if (!isDarkMode && !error && !isMuted) {
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.stroke();
      }

      if (isConnected && !error && !isMuted) {
         ctx.strokeStyle = isDarkMode ? '#fff' : (isModelSpeaking ? '#fff' : '#6366f1');
         ctx.lineWidth = 3;
         ctx.beginPath();
         const amplitude = isModelSpeaking ? 16 : userVolume * 30;
         for (let i = -15; i <= 15; i++) {
            const x = centerX + i * 3;
            const y = centerY + Math.sin((x + Date.now()/10) * 0.2) * amplitude;
            if (i === -15) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
         }
         ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isConnected, isModelSpeaking, userVolume, isDarkMode, error, isMuted]);

  return (
    <div 
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-transform group"
        style={{ left: position.x, top: position.y, touchAction: 'none' }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onClick={(e) => {
            if (!hasMovedRef.current) onClick();
        }}
        role="button"
        aria-label="Activate Alexa"
    >
       <canvas ref={canvasRef} className="w-[160px] h-[160px] drop-shadow-xl" />
       
       <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
           
           <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className={`pointer-events-auto p-2 rounded-full shadow-lg border transition-all ${
                  isMuted 
                  ? 'bg-red-500 text-white border-red-400' 
                  : 'bg-white/90 text-slate-700 border-slate-200'
                }`}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              
              <div className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm backdrop-blur-md border flex items-center gap-2 ${
                  error 
                  ? 'bg-red-500 text-white border-red-400'
                  : (isDarkMode 
                      ? 'bg-slate-900/90 text-white border-slate-700' 
                      : 'bg-white/90 text-slate-700 border-slate-200')
              }`}>
                  {error ? 'Service Busy' : 'ALEXA'}
                  {error && onReconnect && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onReconnect(); }}
                        className="pointer-events-auto p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <RefreshCcw size={12} className="animate-spin-slow" />
                    </button>
                  )}
              </div>
           </div>
           
           {!isConnected && !error && (
             <span className="text-[9px] text-slate-400">Tap to connect</span>
           )}
       </div>
    </div>
  );
};