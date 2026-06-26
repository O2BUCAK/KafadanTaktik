import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export default function KafadanTaktikLogo({ className = '', size = '100%', showText = false }: LogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`} style={{ width: size }}>
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-md transition-transform duration-300 hover:scale-[1.02]"
      >
        {/* Rounded Beige Logo Canvas Backdrop Card */}
        <rect width="500" height="500" rx="44" fill="#FAF6EB" />

        {/* 1. Tactical Soccer Pitch Frame (Green card background in the logo) */}
        <g id="pitch-background">
          <rect
            x="90"
            y="70"
            width="320"
            height="230"
            rx="14"
            fill="#5D8268"
            stroke="#0C251C"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* Pitch Corner Markings */}
          <path
            d="M90 100 C 110 100, 110 70, 110 70"
            stroke="#0C251C"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M410 100 C 390 100, 390 70, 390 70"
            stroke="#0C251C"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M90 270 C 110 270, 110 300, 110 300"
            stroke="#0C251C"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M410 270 C 390 270, 390 300, 390 300"
            stroke="#0C251C"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Center Pitch Circle line (behind brain) */}
          <circle
            cx="250"
            cy="185"
            r="80"
            stroke="#0C251C"
            strokeWidth="8"
            fill="none"
            opacity="0.9"
          />
        </g>

        {/* 2. Cozy Coral Pink Mind/Brain ("Kafadan" layer) */}
        <g id="brain-cerebral">
          {/* Main Brain Symmetrical Outlines & Coral Fill */}
          <path
            d="M 250 85 
               C 210 85, 180 100, 175 130 
               C 150 125, 130 150, 135 180 
               C 120 185, 125 215, 145 225 
               C 140 245, 165 265, 195 255 
               C 205 270, 235 275, 250 260
               C 265 275, 295 270, 305 255
               C 335 265, 360 245, 355 225
               C 375 215, 380 185, 365 180
               C 370 150, 350 125, 325 130
               C 320 100, 290 85, 250 85 Z"
            fill="#E75A51"
            stroke="#0C251C"
            strokeWidth="12"
            strokeLinejoin="round"
          />

          {/* Symmetrical central divider line */}
          <path
            d="M 250 85 L 250 260"
            stroke="#0C251C"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Left Brain Folds */}
          <path
            d="M 200 120 C 180 130, 185 160, 215 155"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 175 180 C 155 190, 175 220, 205 200"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 220 170 C 200 190, 215 220, 240 210"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 235 110 C 210 115, 215 140, 235 135"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />

          {/* Right Brain Folds */}
          <path
            d="M 300 120 C 320 130, 315 160, 285 155"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 325 180 C 345 190, 325 220, 295 200"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 280 170 C 300 190, 285 220, 260 210"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 265 110 C 290 115, 285 140, 265 135"
            stroke="#0C251C"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* 3. Deep Green Gamepad Controller (overlapped bottom left) */}
        <g id="gamepad-controller">
          <path
            d="M 135 210
               C 120 210, 100 230, 105 265
               C 110 300, 140 295, 160 280
               L 180 280
               C 195 295, 225 300, 235 270
               C 245 240, 220 215, 195 215
               L 185 220
               Z"
            fill="#335E46"
            stroke="#0C251C"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* Gamepad Details - D-pad Cross */}
          <path
            d="M 135 235 L 135 255"
            stroke="#0C251C"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 125 245 L 145 245"
            stroke="#0C251C"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Gamepad Buttons */}
          <circle cx="205" cy="245" r="7" fill="#0C251C" />
          <circle cx="218" cy="258" r="7" fill="#0C251C" />
          <circle cx="192" cy="258" r="5" fill="#0C251C" />
          <circle cx="205" cy="270" r="5" fill="#0C251C" />
        </g>

        {/* 4. Yellow/Ochre Regular Dice Cube (isometric bottom right) */}
        <g id="dice-tactical">
          {/* Isometric Cube (Top, Left, Right Faces) */}
          {/* Face 1: Left-bottom face (shows 2 dots) */}
          <path
            d="M 260 220 L 315 255 L 315 315 L 260 275 Z"
            fill="#E07A16"
            stroke="#0C251C"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* Face 2: Right-bottom face (shows 6 dots) */}
          <path
            d="M 315 255 L 370 220 L 370 275 L 315 315 Z"
            fill="#F69E1C"
            stroke="#0C251C"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* Face 3: Top face (shows 5 dots) */}
          <path
            d="M 260 220 L 315 180 L 370 220 L 315 255 Z"
            fill="#FAB942"
            stroke="#0C251C"
            strokeWidth="12"
            strokeLinejoin="round"
          />

          {/* Dots on Dice Left Face (2) */}
          <circle cx="280" cy="245" r="5.5" fill="#0C251C" />
          <circle cx="295" cy="290" r="5.5" fill="#0C251C" />

          {/* Dots on Dice Right Face (6) */}
          <circle cx="330" cy="255" r="5" fill="#0C251C" />
          <circle cx="330" cy="285" r="5" fill="#0C251C" />
          <circle cx="345" cy="245" r="5" fill="#0C251C" />
          <circle cx="345" cy="275" r="5" fill="#0C251C" />
          <circle cx="360" cy="235" r="5" fill="#0C251C" />
          <circle cx="360" cy="265" r="5" fill="#0C251C" />

          {/* Dots on Dice Top Face (5) */}
          <circle cx="315" cy="217.5" r="6" fill="#0C251C" /> {/* Center dot */}
          <circle cx="290" cy="207" r="5" fill="#0C251C" />
          <circle cx="340" cy="228" r="5" fill="#0C251C" />
          <circle cx="340" cy="207" r="5" fill="#0C251C" />
          <circle cx="290" cy="228" r="5" fill="#0C251C" />
        </g>
      </svg>

      {showText && (
        <span 
          className="text-4xl font-extrabold tracking-tight mt-6 select-none font-sans"
          style={{ color: '#0C251C' }}
        >
          KafadanTaktik
        </span>
      )}
    </div>
  );
}
