/**
 * CodeBackground - code rain background
 * Matrix-style code character drop effect
 * Uses code characters (01{}[]<>/\\|=) rather than circular particles
 * Green phosphor glow falling vertically
 * Dark mode only
 */

import { useRef, useEffect, memo } from 'react';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../theme';

interface CodeDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  length: number;
  opacity: number;
}

// Code character set - mixed code-related glyphs
const CODE_CHARS = '01{}[]<>|/\\=~!@#$%^&*-_+;:.,?abcdefgijklmnopqrstuvwxyzABCDEFGIJKLMNOPQRSTUVWXYZ';

/**
 * Pick a random char
 */
const getRandomChar = (): string => {
  return CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
};

/**
 * Create a new code drop
 */
const createCodeDrop = (width: number): CodeDrop => ({
  x: Math.random() * width,
  y: -Math.random() * 500,
  speed: 1 + Math.random() * 2,
  chars: Array.from({ length: 20 }, () => getRandomChar()),
  length: 10 + Math.floor(Math.random() * 15),
  opacity: 0.3 + Math.random() * 0.5,
});

interface CodeBackgroundProps {
  /** Code rain density (1-100) */
  density?: number;
  /** Min speed */
  minSpeed?: number;
  /** Max speed */
  maxSpeed?: number;
  /** Custom color */
  color?: string;
}

/**
 * CodeBackground component
 * rerender-memo: uses memo for performance
 */
export const CodeBackground = memo(function CodeBackground({
  density = 30,
  minSpeed = 1,
  maxSpeed = 3,
  color,
}: CodeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dropsRef = useRef<CodeDrop[]>([]);
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  // Init code rain
  useEffect(() => {
    if (!isDark) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Init code drops
    const dropCount = Math.floor((density / 100) * (canvas.width / 15));
    dropsRef.current = Array.from({ length: dropCount }, () => createCodeDrop(canvas.width));

    // Animation loop
    const animate = (_timestamp: number) => {

      // Clear canvas - semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(13, 17, 23, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw code rain
      const rainColor = color || theme.codeRainColor || '#50fa7b';

      dropsRef.current.forEach((drop) => {
        // Advance position
        drop.y += drop.speed;

        // Occasionally mutate chars
        if (Math.random() < 0.02) {
          drop.chars = Array.from({ length: 20 }, () => getRandomChar());
        }

        // Draw column of chars
        for (let i = 0; i < drop.length; i++) {
          const charY = drop.y - i * 15;
          if (charY > 0 && charY < canvas.height) {
            const charOpacity = drop.opacity * (1 - i / drop.length);
            ctx.fillStyle = rainColor;
            ctx.globalAlpha = charOpacity;
            ctx.font = '12px "Fira Code", monospace';

            // Head char highlighted (white)
            if (i === 0) {
              ctx.fillStyle = '#ffffff';
              ctx.globalAlpha = drop.opacity;
            }

            ctx.fillText(drop.chars[i % drop.chars.length], drop.x, charY);
          }
        }

        // Reset drops that fell off the bottom
        if (drop.y - drop.length * 15 > canvas.height) {
          drop.y = -drop.length * 15;
          drop.x = Math.random() * canvas.width;
          drop.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        }
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark, density, minSpeed, maxSpeed, color, theme.codeRainColor]);

  // Skip rendering in light mode
  if (!isDark) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}, (prev, next) => {
  // Custom comparison fn
  return (
    prev.density === next.density &&
    prev.minSpeed === next.minSpeed &&
    prev.maxSpeed === next.maxSpeed &&
    prev.color === next.color
  );
});

export default CodeBackground;

