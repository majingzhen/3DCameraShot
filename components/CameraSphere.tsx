
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

interface CameraSphereProps {
  view: number;
  angle: number;
  onChange: (view: number, angle: number) => void;
}

export const CameraSphere: React.FC<CameraSphereProps> = ({ view, angle, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  // 计算相机图标在 SVG 坐标系中的位置
  const radH = (view * Math.PI) / 180;
  const radV = (angle * Math.PI) / 180;

  const camX = centerX + radius * Math.cos(radV) * Math.sin(radH);
  const camY = centerY - radius * Math.sin(radV);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;

    // 灵敏度转换：1像素移动对应约 0.5 度的变化
    let newView = (view + dx * 0.8) % 360;
    if (newView < 0) newView += 360;

    let newAngle = angle - dy * 0.8;
    newAngle = Math.max(-90, Math.min(90, newAngle));

    onChange(newView, newAngle);
    lastPos.current = { x: clientX, y: clientY };
  }, [isDragging, view, angle, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-48 h-48 mx-auto flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-shadow rounded-full ${isDragging ? 'shadow-inner bg-slate-50/50' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      <svg width="200" height="200" className="absolute top-0 left-0 pointer-events-none overflow-visible">
        <defs>
          <radialGradient id="sphereGradient">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        
        {/* 背景球体填充 */}
        <circle cx="100" cy="100" r="80" fill="url(#sphereGradient)" />

        {/* 经纬网格线 */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2 4" className="opacity-30" />
        <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="#94a3b8" strokeWidth="1" className="opacity-40" />
        <ellipse cx="100" cy="100" rx="30" ry="80" fill="none" stroke="#94a3b8" strokeWidth="1" className="opacity-40" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#94a3b8" strokeWidth="1" className="opacity-40" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#94a3b8" strokeWidth="1" className="opacity-40" />
        
        {/* 中心焦点指示器 */}
        <rect x="92" y="85" width="16" height="30" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="100" y="105" fill="#64748b" textAnchor="middle" className="text-[10px] font-bold select-none">F</text>
      </svg>

      {/* 相机标记 */}
      <div 
        className={`absolute transition-transform duration-75 pointer-events-none ${isDragging ? 'scale-110' : ''}`}
        style={{
          left: `${camX}px`,
          top: `${camY}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="bg-amber-400 p-2 rounded-full shadow-2xl border-2 border-white ring-4 ring-amber-400/20">
          <Camera size={20} className="text-white" />
        </div>
        {/* 视角方向指引线 */}
        <div 
          className="absolute w-12 h-0.5 bg-gradient-to-r from-amber-400/80 to-transparent origin-left -z-10"
          style={{
            left: '50%',
            top: '50%',
            transform: `rotate(${Math.atan2(centerY - camY, centerX - camX) * 180 / Math.PI}deg)`
          }}
        ></div>
      </div>

      {/* 交互提示 */}
      {!isDragging && (
        <div className="absolute bottom-0 text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          拖动以旋转视角
        </div>
      )}
    </div>
  );
};
