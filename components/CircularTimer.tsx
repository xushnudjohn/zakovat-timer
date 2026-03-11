import React from 'react';
import { TimerMode } from '../types';
import { MODE_CONFIGS } from '../constants';

interface CircularTimerProps {
  currentTime: number;
  totalTime: number;
  statusText: string;
  mode: TimerMode;
  segmentIndex: number;
  isWritingPhase?: boolean;
  onReset?: () => void;
  useArrow?: boolean;
  counterClockwise?: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ 
  currentTime, 
  totalTime, 
  statusText,
  mode,
  segmentIndex,
  isWritingPhase,
  onReset,
  useArrow,
  counterClockwise
}) => {
  const radius = 130;
  const circumference = 2 * Math.PI * radius;

  const config = MODE_CONFIGS[mode];
  const globalTotal = isWritingPhase ? 10 : config.segments.reduce((a, b) => a + b, 0);
  
  const futureSegmentsTime = isWritingPhase ? 0 : config.segments.slice(segmentIndex + 1).reduce((a, b) => a + b, 0);
  const globalRemaining = isWritingPhase ? currentTime : futureSegmentsTime + currentTime;
  const globalElapsed = globalTotal - globalRemaining;

  const progress = (globalRemaining / globalTotal) * 100;
  const offset = circumference - (progress / 100) * circumference;

  let timerColor = 'var(--accent-color)';
  if (isWritingPhase) {
    timerColor = 'var(--danger-color)';
  } else if (globalRemaining <= 10 && globalRemaining > 0) {
    timerColor = '#eab308'; // Sariq
  }

  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6) - 90;
      const rad = (angle * Math.PI) / 180;
      
      let isSeparator = false;
      if (mode === TimerMode.DUPLET && (i === 0 || i === 30)) isSeparator = true;
      if (mode === TimerMode.BLITZ && (i === 0 || i === 20 || i === 40)) isSeparator = true;
      if (mode === TimerMode.NORMAL && i === 0) isSeparator = true;

      const innerR = radius + (isSeparator ? 8 : 12);
      const outerR = radius + 22;
      const x1 = 150 + innerR * Math.cos(rad);
      const y1 = 150 + innerR * Math.sin(rad);
      const x2 = 150 + outerR * Math.cos(rad);
      const y2 = 150 + outerR * Math.sin(rad);
      
      ticks.push(
        <line 
          key={i} 
          x1={x1} y1={y1} x2={x2} y2={y2} 
          style={{ 
            stroke: isSeparator ? timerColor : 'var(--tick-color)', 
            strokeWidth: isSeparator ? 3 : 1.5,
            opacity: isSeparator ? 1 : 0.6
          }} 
        />
      );
    }
    return ticks;
  };

  const getArrowAngle = () => {
    const p = globalRemaining / globalTotal;
    if (counterClockwise) {
      return (p * 360) - 90;
    } else {
      return ((1 - p) * 360) - 90;
    }
  };

  const arrowAngle = getArrowAngle();
  const radArrow = (arrowAngle * Math.PI) / 180;
  const arrowLength = radius - 10; 
  const arrowX = 150 + arrowLength * Math.cos(radArrow);
  const arrowY = 150 + arrowLength * Math.sin(radArrow);

  const displayTime = counterClockwise ? globalRemaining : globalElapsed;

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center my-8 transition-all duration-500">
      <svg 
        className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" 
        viewBox="0 0 300 300"
      >
        {renderTicks()}
        <circle
          className="progress-ring__circle"
          stroke={timerColor}
          strokeWidth="5"
          fill="transparent"
          r={radius}
          cx="150"
          cy="150"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset,
            opacity: 0.8,
            transform: counterClockwise ? 'rotate(-90deg)' : 'scaleX(-1) rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
        {useArrow && (
          <>
            <line 
              x1="150" 
              y1="150" 
              x2={arrowX} 
              y2={arrowY} 
              stroke={timerColor} 
              strokeWidth="5" 
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
            <circle cx="150" cy="150" r="6" fill={timerColor} />
            <circle cx="150" cy="150" r="2" fill="white" />
          </>
        )}
      </svg>
      
      <div className="w-60 h-60 md:w-72 md:h-72 rounded-full neumorphic-convex flex flex-col items-center justify-center z-10 relative">
        {!useArrow && (
          <span 
            className="text-7xl md:text-8xl font-bold tabular-nums transition-colors duration-300"
            style={{ color: timerColor }}
          >
            {displayTime < 10 && displayTime > 0 ? `${displayTime}` : displayTime}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularTimer;