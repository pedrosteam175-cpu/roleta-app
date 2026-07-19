'use client';
import { useEffect, useRef } from 'react';

const MAIN_SEGMENTS = [
  { value: 1, color: '#1a3a1a', textColor: '#00ff88' },
  { value: 2, color: '#1a2e3a', textColor: '#00aaff' },
  { value: 3, color: '#3a1a3a', textColor: '#ff88ff' },
  { value: 5, color: '#3a2a1a', textColor: '#ffaa44' },
  { value: 10, color: '#3a1a1a', textColor: '#ff4444' },
  { value: 20, color: '#2a3a1a', textColor: '#aaff44' },
  { value: 50, color: '#3a3a1a', textColor: '#ffd700' },
  { value: 100, color: '#2a1a3a', textColor: '#ff44ff' },
  { value: 0.5, color: '#1a1a3a', textColor: '#4444ff' },
];

const BONUS_SEGMENTS = [
  { value: 1, color: '#1a3a2a', textColor: '#00ff88' },
  { value: 2, color: '#1a2a3a', textColor: '#00ccff' },
  { value: 3, color: '#2a1a3a', textColor: '#cc88ff' },
  { value: 4, color: '#3a2a1a', textColor: '#ffd700' },
];

interface WheelCanvasProps {
  type: 'main' | 'bonus';
  rotation: number;
  size: number;
}

export default function WheelCanvas({ type, rotation, size }: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segments = type === 'main' ? MAIN_SEGMENTS : BONUS_SEGMENTS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;
    const count = segments.length;
    const arc = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, size, size);

    // Outer ring glow
    const outerGrad = ctx.createRadialGradient(cx, cy, r - 8, cx, cy, r + 4);
    outerGrad.addColorStop(0, 'rgba(255,215,0,0.4)');
    outerGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, 2 * Math.PI);
    ctx.fillStyle = outerGrad;
    ctx.fill();

    segments.forEach((seg, i) => {
      const startAngle = rotation + i * arc - Math.PI / 2;
      const endAngle = startAngle + arc;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      const textR = r * 0.62;
      ctx.translate(textR, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = seg.textColor;
      ctx.font = `bold ${size < 180 ? 12 : 15}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = type === 'bonus' ? `${seg.value}x` : seg.value >= 1 ? `${seg.value}x` : `0.5x`;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    // Center cap
    const capGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.12);
    capGrad.addColorStop(0, '#ffd700');
    capGrad.addColorStop(1, '#b8860b');
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.12, 0, 2 * Math.PI);
    ctx.fillStyle = capGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffd70088';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center icon
    ctx.fillStyle = '#000';
    ctx.font = `bold ${size * 0.1}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'main' ? '🎰' : '✨', cx, cy);
  }, [rotation, size, type]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: '50%', display: 'block' }}
    />
  );
}
