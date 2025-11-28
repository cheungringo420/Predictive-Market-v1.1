import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-[#050b14]">
      {/* 1. Nebula / Atmosphere Layer - Adds color depth */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(14, 165, 233, 0.3) 0%, transparent 50%)
          `,
          filter: 'blur(60px)',
          opacity: 1,
        }}
      />

      {/* 2. 3D Cyber Grid - Brighter & Neon */}
      <div
        className="absolute inset-0 w-[200vw] h-[200vh] -left-[50vw] -top-[50vh]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.6) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.6) 1.5px, transparent 1.5px)
          `,
          backgroundSize: '80px 80px',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
          animation: 'grid-move 20s linear infinite',
          // Fade out at the horizon (top) and bottom for a smoother look
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
        }}
      />

      {/* 3. Floating Data Particles - Brighter & More Active */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(4px 4px at 20% 30%, rgba(34, 211, 238, 0.9), transparent),
            radial-gradient(4px 4px at 50% 80%, rgba(168, 85, 247, 0.9), transparent),
            radial-gradient(3px 3px at 80% 40%, rgba(255, 255, 255, 1), transparent),
            radial-gradient(3px 3px at 10% 10%, rgba(34, 211, 238, 0.8), transparent),
            radial-gradient(3px 3px at 90% 90%, rgba(168, 85, 247, 0.8), transparent)
          `,
          backgroundSize: '120% 120%',
          animation: 'particle-float 10s ease-in-out infinite alternate',
        }}
      />

      <style>{`
        @keyframes grid-move {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(80px) translateZ(-200px); }
        }
        @keyframes particle-float {
          0% { background-position: 0% 0%; opacity: 0.7; }
          100% { background-position: 5% 5%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Background;
