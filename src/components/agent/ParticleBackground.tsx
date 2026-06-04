/**
 * 深色模式粒子背景组件
 * 使用 Canvas 绘制浮动的霓虹粒子效果
 */

import { useEffect, useRef } from 'react';
import { useIsDark } from '@/theme';
import { ANIMATIONS } from '@/pages/agents/theme';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isDark = useIsDark();

  useEffect(() => {
    if (!isDark) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置 canvas 尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 粒子颜色配置 - 赛博朋克风格
    const colors = [
      'rgba(0, 212, 255,',   // 青色
      'rgba(124, 58, 237,',   // 紫色
      'rgba(255, 68, 102,',   // 品红
      'rgba(0, 255, 170,',    // 绿色
    ];

    // 创建粒子
    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    });

    // 初始化粒子数组
    const particleCount = 50;
    const particles: Particle[] = Array.from({ length: particleCount }, createParticle);

    // 绘制粒子
    const drawParticle = (p: Particle) => {
      const pulseOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${pulseOpacity})`;
      ctx.fill();

      // 发光效果
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      gradient.addColorStop(0, `${p.color}${pulseOpacity * 0.3})`);
      gradient.addColorStop(1, `${p.color}0)`);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    // 绘制连接线
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 更新和绘制粒子
      particles.forEach((p) => {
        // 更新位置
        p.x += p.vx;
        p.y += p.vy;

        // 边界反弹
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // 更新脉冲
        p.pulse += p.pulseSpeed;

        drawParticle(p);
      });

      // 绘制连接线
      drawConnections();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 清理
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <>
      <style>{ANIMATIONS.glowPulse}</style>
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
        }}
        className="particle-background"
      />
    </>
  );
};
