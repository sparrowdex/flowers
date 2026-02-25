import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import plantData from './plantData';
import FunFacts from './FunFacts';
import BirthdayMessage from './BirthdayMessage';
import PetalPortal from './PetalPortal';
import LetterStyle from './LetterStyle'; // <-- New import

export default function App() {
  const [stage, setStage] = useState('input');
  const [name, setName] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [showBirthdayMessage, setShowBirthdayMessage] = useState(true);
  const [currentPlant, setCurrentPlant] = useState(null);
  const audioRef = useRef(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hint, setHint] = useState({ text: '', visible: false });

  const handleSubmit = () => {
    // Normalize input for robust matching
    const userInput = name.trim().toLowerCase().replace(/\s+/g, ' ');

    // First, try to match by the friend's name (the key in plantData)
    let plant = plantData[userInput];

    if (!plant) {
      // If no match by name, try to match by the flower's name
      const plantKey = Object.keys(plantData).find(key =>
        plantData[key].plantName && plantData[key].plantName.toLowerCase() === userInput
      );
      if (plantKey) {
        plant = plantData[plantKey];
      }
    }

    if (plant) {
      setCurrentPlant(plant);
      setIsRevealing(true);
    }
  };

  const handleBurstComplete = () => {
    if (currentPlant) {
      if (currentPlant.plantName === 'The Heart Bloom') {
        setStage('animation');
      } else {
        setStage('message');
        setTimeout(() => setFadeIn(true), 100);
      }
      setIsRevealing(false);
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSubmit(); };

  // Background logic based on mode
  const isValentine = name.trim().toLowerCase() === 'valentine' || currentPlant?.plantName === 'The Heart Bloom';
  const audioSrc = (currentPlant?.plantName === 'The Heart Bloom') ? "/audio/Grounded.mp3" : "/audio/soft_melody.m4a";

  // Dynamic theme color for UI elements
  const themeColor = (() => {
    const userInput = name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (userInput === 'valentine') return '#ff2d75';

    let plant = plantData[userInput];

    if (!plant) {
      const plantKey = Object.keys(plantData).find(key =>
        plantData[key].plantName && plantData[key].plantName.toLowerCase() === userInput
      );
      if (plantKey) {
        plant = plantData[plantKey];
      }
    }
    if (plant) {
      const colorMap = {
        'Peace Lily': '#ffffff',
        'Gladiolus': '#ff8c00',
        'Pink Carnation': '#ffb7c5',
        'Blue Orchid': '#3b82f6',
        'Sweet Pea': '#ff69b4',
        'Lotus': '#ffb6c1'
      };
      return colorMap[plant.plantName] || '#4ade80';
    }
    return '#4ade80';
  })();

  // Handle audio playback safely after React updates the DOM
  useEffect(() => {
    if (audioRef.current && currentPlant?.hasAudio && stage !== 'input') {
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed. Please verify that the file exists at public/audio/Grounded.mp3 and is a valid audio format.", err);
      });
    }
  }, [currentPlant, stage, audioSrc]);

  // Hint popup logic
  useEffect(() => {
    if (stage !== 'input') {
      setHint({ text: '', visible: false });
      return;
    }

    // Create hint options. For 'valentine', the trigger is the key, not the plantName.
    const hintOptions = Object.entries(plantData).map(([key, value]) => {
      if (key === 'valentine') {
        return 'valentine';
      }
      return value.plantName;
    }).filter(Boolean); // Filter out any null/undefined entries

    let hintInterval;

    const showRandomHint = () => {
      const randomHint = hintOptions[Math.floor(Math.random() * hintOptions.length)];
      setHint({ text: `Type: "${randomHint}"`, visible: true });

      setTimeout(() => {
        setHint(h => ({ ...h, visible: false }));
      }, 4000); // Hint visible for 4 seconds
    };

    const initialTimeout = setTimeout(() => {
      showRandomHint();
      hintInterval = setInterval(showRandomHint, 10000); // New hint every 10 seconds
    }, 7000); // Initial delay of 7 seconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(hintInterval);
    };
  }, [stage]);

  const PlantComponent = currentPlant ? currentPlant.component : null;

  const bgClass = isValentine 
    ? "bg-gradient-to-br from-[#4d0026] via-[#a62051] to-[#4d0026]" 
    : "bg-gradient-to-br from-slate-900 via-green-900 to-slate-900";

  return (
    <div className={`animated-gradient w-full h-screen transition-colors duration-1000 ${bgClass}`}>
      <audio ref={audioRef} src={audioSrc} loop hidden />

      {stage === 'input' && (
        <div className="flex items-center justify-center h-full relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 20], fov: 35 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <PetalPortal 
                name={name} 
                isRevealing={isRevealing} 
                onBurstComplete={handleBurstComplete} 
              />
            </Canvas>
          </div>
          
          <div className="text-center space-y-8 p-8 z-10">
            <h1 className="text-5xl font-light text-white mb-4">Discover Your Plant Identity</h1>
            <p className="text-xl italic text-pink-200 mb-8">special gifts await ✿ </p>
            <div className="space-y-4 flex flex-col items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your name"
                className="px-6 py-4 text-2xl bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none w-80 transition-all duration-500"
                style={{ boxShadow: `0 0 20px ${themeColor}44` }}
              />
              <button
                onClick={handleSubmit}
                className="w-80 px-6 py-4 text-xl rounded-lg transition-all duration-300 shadow-lg text-white font-bold"
                style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px ${themeColor}66` }}
              >
                Reveal
              </button>
            </div>
          </div>

          {/* Hint Popup */}
          <div
            className={`absolute bottom-24 text-center w-full transition-opacity duration-1000 pointer-events-none ${hint.visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: 20 }}
          >
            <p className="text-white/60 italic text-lg backdrop-blur-sm p-2 rounded-lg inline-block">
              {hint.text}
            </p>
          </div>
        </div>
      )}

      {/* --- THE UPDATED 3D LETTER SECTION --- */}
      {stage === 'message' && currentPlant && (
        <div className={`relative w-full h-full transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          
          <div className="absolute inset-0 z-0">
            <Canvas shadows camera={{ position: [0, 0, 12], fov: 45 }}>
              {/* MUCH brighter lights so the paper isn't dark! */}
              <ambientLight intensity={1.8} />
              <spotLight position={[0, 5, 15]} intensity={2.5} penumbra={0.8} castShadow />
              <pointLight position={[-10, -10, -10]} intensity={0.8} />
              
              <Suspense fallback={null}>
                <LetterStyle name={name} description={currentPlant.description} />
              </Suspense>
            </Canvas>
          </div>

          {/* The Button is now smaller and shifted up slightly from the absolute bottom */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-[280px] px-4">
            <button
              onClick={() => setStage('animation')}
              className="w-full px-4 py-3 text-sm tracking-widest uppercase transition-all duration-300 bg-transparent border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm hover:bg-white/10"
              style={{ 
                borderColor: themeColor, 
                color: themeColor,
                borderRadius: '0px'
              }}
            >
              See It Bloom 
            </button>
          </div>
        </div>
      )}

      {stage === 'animation' && currentPlant && (
        <div className="relative w-full h-full">
          {!isValentine && showBirthdayMessage && <BirthdayMessage />}
          <PlantComponent onBack={() => setStage('input')} />
          {!isValentine && currentPlant.funFacts && <FunFacts facts={currentPlant.funFacts} />}
          {!isValentine && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
              <h3 className="text-3xl font-light text-white mb-2">{currentPlant.plantName}</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}