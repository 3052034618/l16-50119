import { useMemo } from 'react';

interface RingProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  gradient?: [string, string];
  bgColor?: string;
  showValue?: boolean;
  valueSuffix?: string;
}

export function RingProgress({
  value,
  size = 160,
  strokeWidth = 14,
  label,
  subLabel,
  gradient = ['#2E7D32', '#66BB6A'],
  bgColor = '#E8F5E9',
  showValue = true,
  valueSuffix = '%',
}: RingProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedValue / 100) * circumference;

  const gradientId = useMemo(
    () => `ring-gradient-${Math.random().toString(36).slice(2, 10)}`,
    []
  );

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span
            className="font-serif font-bold text-gray-800"
            style={{ fontSize: size * 0.28 }}
          >
            {clampedValue.toFixed(0)}
            <span className="font-sans text-brand-600" style={{ fontSize: size * 0.14 }}>
              {valueSuffix}
            </span>
          </span>
        )}
        {label && (
          <span className="text-sm font-medium text-gray-600 mt-1">{label}</span>
        )}
        {subLabel && (
          <span className="text-xs text-gray-400 mt-0.5">{subLabel}</span>
        )}
      </div>
    </div>
  );
}

export default RingProgress;
