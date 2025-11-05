import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer cube */}
          <path
            fill="none"
            stroke="#00FF84"
            strokeWidth="3.5"
            strokeLinejoin="miter"
            strokeLinecap="round"
            d="M30 35 L50 25 L70 35 L70 55 L50 65 L30 55 Z"
          />
          {/* Inner cube */}
          <path
            fill="none"
            stroke="#00FF84"
            strokeWidth="3.5"
            strokeLinejoin="miter"
            strokeLinecap="round"
            d="M40 50 L50 45 L60 50 L60 65 L50 70 L40 65 Z"
          />
          {/* Connecting lines */}
          <line x1="30" y1="35" x2="40" y2="50" stroke="#00FF84" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="25" x2="50" y2="45" stroke="#00FF84" strokeWidth="2" strokeLinecap="round" />
          <line x1="70" y1="35" x2="60" y2="50" stroke="#00FF84" strokeWidth="2" strokeLinecap="round" />
          <line x1="70" y1="55" x2="60" y2="65" stroke="#00FF84" strokeWidth="2" strokeLinecap="round" />
          <line x1="50" y1="65" x2="50" y2="70" stroke="#00FF84" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="55" x2="40" y2="65" stroke="#00FF84" strokeWidth="2" strokeLinecap="round" />
          {/* Center dot */}
          <circle cx="50" cy="55" r="4" fill="#00FF84" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}

