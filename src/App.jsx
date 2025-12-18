import React, { useState, useRef } from 'react';
import plantData from './plantData';
import FunFacts from './FunFacts';
import BirthdayMessage from './BirthdayMessage';

// Main App
export default function App() {
  const [stage, setStage] = useState('input');
  const [name, setName] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [showBirthdayMessage, setShowBirthdayMessage] = useState(true);
  const [currentPlant, setCurrentPlant] = useState(null);
  const audioRef = useRef(null);


  const handleSubmit = () => {
    const plant = plantData[name.trim().toLowerCase()];
    if (plant) {
      setCurrentPlant(plant);
      if (plant.hasAudio && audioRef.current) {
        audioRef.current.play().catch(error => {
          // Log errors if playback is prevented
          console.error("Audio playback error:", error);
        });
      }
      setStage('message');
      setTimeout(() => setFadeIn(true), 100);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };


  const showAnimation = () => {
    setStage('animation');
  };


  const PlantComponent = currentPlant ? currentPlant.component : null;


  return (
    <div className="animated-gradient w-full h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <audio ref={audioRef} src="/audio/soft_melody.m4a" loop hidden />
      {stage === 'input' && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-8 p-8">
            <h1 className="text-5xl font-light text-white mb-4">
              Discover Your Plant Identity
            </h1>
            <p className="text-xl text-green-200 mb-8">
              A special birthday gift awaits...
            </p>
            <div className="space-y-4 flex flex-col items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your name"
                className="px-6 py-4 text-2xl bg-white/10 border-2 border-green-300/50 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-300 w-80"
              />
              <button
                onClick={handleSubmit}
                className="w-80 px-6 py-4 text-xl bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/50"
              >
                Reveal
              </button>
            </div>
          </div>
        </div>
      )}


      {stage === 'message' && currentPlant && (
        <div className={`flex items-center justify-center h-full transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-2xl p-12 bg-white/5 backdrop-blur-md rounded-2xl border border-green-300/30 shadow-2xl">
            <h2 className="text-4xl font-light text-white mb-6 text-center">
              Happy Birthday, {name}! 🌸
            </h2>
            <div className="space-y-4 text-green-100 text-lg leading-relaxed mb-8">
              {currentPlant.description.map((text, index) => (
                <p key={index} dangerouslySetInnerHTML={{ __html: text }} />
              ))}
            </div>
            <button
              onClick={showAnimation}
              className="w-full px-8 py-4 text-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/50"
            >
              See Your {currentPlant.plantName} Bloom ✨
            </button>
          </div>
        </div>
      )}


      {stage === 'animation' && currentPlant && (
        <div className="relative w-full h-full">
          {showBirthdayMessage && <BirthdayMessage />}
          <PlantComponent />
          <FunFacts facts={currentPlant.funFacts} />
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
            <h3 className="text-3xl font-light text-white mb-2">Your {currentPlant.plantName}</h3>
            <p className="text-green-200">Drag to rotate • Scroll to zoom</p>
          </div>
        </div>
      )}
    </div>
  );
}