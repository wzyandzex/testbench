import { memo, useState, useEffect } from 'react';
import { orbBaseStyle, gridBgStyle } from './style';

interface DarkBackgroundProps {
  enableParticles?: boolean;
  enableAnimation?: boolean;
}

/**
 * 暗色主题背景组件
 * 包含网格背景、浮动光球和粒子效果
 */
export const DarkBackground = memo<DarkBackgroundProps>(({
  enableParticles = true,
  enableAnimation = true,
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  // 生成粒子
  useEffect(() => {
    if (!enableParticles || !enableAnimation) return;

    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      style: {
        position: 'absolute' as const,
        bottom: '-10px',
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        background: `rgba(102, 126, 234, ${Math.random() * 0.3 + 0.1})`,
        borderRadius: '50%',
        animation: `particle-rise ${Math.random() * 10 + 15}s linear infinite`,
        animationDelay: `${Math.random() * 15}s`,
        pointerEvents: 'none' as const,
      },
    }));
    setParticles(newParticles);
  }, [enableParticles, enableAnimation]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, backgroundColor: '#0a0a0a' }}>
      {/* 网格背景 */}
      <div style={gridBgStyle} />

      {/* 浮动光球 */}
      {enableAnimation && (
        <>
          <div
            style={{
              ...orbBaseStyle(400, 'rgba(102, 126, 234, 0.15)', '10%', '20%'),
              animation: 'orb-float 20s ease-in-out infinite',
            }}
          />
          <div
            style={{
              ...orbBaseStyle(300, 'rgba(118, 75, 162, 0.12)', '60%', '70%'),
              animation: 'orb-float 25s ease-in-out infinite 5s',
            }}
          />
          <div
            style={{
              ...orbBaseStyle(350, 'rgba(240, 147, 251, 0.1)', '40%', '50%'),
              animation: 'orb-float 22s ease-in-out infinite 3s',
            }}
          />
          <div
            style={{
              ...orbBaseStyle(250, 'rgba(102, 126, 234, 0.1)', '80%', '30%'),
              animation: 'orb-float 18s ease-in-out infinite 8s',
            }}
          />
        </>
      )}

      {/* 上升粒子 */}
      {enableParticles && particles.map((p) => (
        <div key={p.id} style={p.style} />
      ))}

      {/* 动画定义 */}
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -40px) scale(1.05); }
          66% { transform: translate(-30px, 30px) scale(0.95); }
        }

        @keyframes particle-rise {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
        }
      `}</style>
    </div>
  );
});

DarkBackground.displayName = 'DarkBackground';
