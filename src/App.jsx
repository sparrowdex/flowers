import React, { useState, useRef, useEffect } from 'react';
import plantData from './plantData';
import FunFacts from './FunFacts';
import BirthdayMessage from './BirthdayMessage';

export default function App() {
  const [stage, setStage] = useState('input');
  const [name, setName] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [showBirthdayMessage, setShowBirthdayMessage] = useState(true);
  const [currentPlant, setCurrentPlant] = useState(null);
  const audioRef = useRef(null);

  const handleSubmit = () => {
    const userInput = name.trim().toLowerCase();
    
    // Valentine Special Trigger: If they type "valentine"
    let plant = (userInput === 'valentine') 
      ? plantData['valentine'] 
      : plantData[userInput];

    if (!plant) {
      const plantKey = Object.keys(plantData).find(key => plantData[key].plantName.toLowerCase() === userInput);
      if (plantKey) plant = plantData[plantKey];
    }

    if (plant) {
      setCurrentPlant(plant);
      if (plant.hasAudio && audioRef.current) {
        audioRef.current.play().catch(err => console.error(err));
      }
      setStage('message');
      setTimeout(() => setFadeIn(true), 100);
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSubmit(); };
  const showAnimation = () => setStage('animation');

  const PlantComponent = currentPlant ? currentPlant.component : null;

  // Background logic based on mode
  const isValentine = name.trim().toLowerCase() === 'valentine' || currentPlant?.plantName === 'The Heart Bloom';
  const bgClass = isValentine 
    ? "bg-gradient-to-br from-[#4d0026] via-[#a62051] to-[#4d0026]" 
    : "bg-gradient-to-br from-slate-900 via-green-900 to-slate-900";

  return (
    <div className={`animated-gradient w-full h-screen transition-colors duration-1000 ${bgClass}`}>
      <audio ref={audioRef} src="/audio/soft_melody.m4a" loop hidden />

      {stage === 'input' && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-8 p-8">
            <h1 className="text-5xl font-light text-white mb-4">
              {isValentine ? "Discover Your Heart Bloom" : "Discover Your Plant Identity"}
            </h1>
            <p className="text-xl text-pink-200 mb-8">
              {isValentine ? "A special Valentine gift awaits..." : "A special birthday gift awaits..."}
            </p>
            <div className="space-y-4 flex flex-col items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your name"
                className={`px-6 py-4 text-2xl bg-white/10 border-2 rounded-lg text-white placeholder-white/50 focus:outline-none w-80 transition-colors ${isValentine ? 'border-pink-400' : 'border-green-300/50'}`}
              />
              <button
                onClick={handleSubmit}
                className={`w-80 px-6 py-4 text-xl rounded-lg transition-all duration-300 shadow-lg ${isValentine ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-500/50' : 'bg-green-600 hover:bg-green-500 shadow-green-500/50'}`}
              >
                Reveal
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'message' && currentPlant && (
        <div className={`flex items-center justify-center h-full transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-2xl p-12 bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
            <h2 className="text-4xl font-light text-white mb-6 text-center">
              {isValentine ? `For You, ${name} ❤️` : `Happy Birthday, ${name}! 🌸`}
            </h2>
            <div className="space-y-4 text-white text-lg leading-relaxed mb-8">
              {currentPlant.description.map((text, index) => (
                <p key={index} dangerouslySetInnerHTML={{ __html: text }} />
              ))}
            </div>
            <button
              onClick={showAnimation}
              className={`w-full px-8 py-4 text-xl text-white rounded-lg transition-all duration-300 shadow-lg ${isValentine ? 'bg-gradient-to-r from-pink-600 to-rose-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}
            >
              See It Bloom ✨
            </button>
          </div>
        </div>
      )}

      {stage === 'animation' && currentPlant && (
        <div className="relative w-full h-full">
          {!isValentine && showBirthdayMessage && <BirthdayMessage />}
          <PlantComponent onBack={() => setStage('input')} />
          <FunFacts facts={currentPlant.funFacts} />
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
            <h3 className="text-3xl font-light text-white mb-2">{currentPlant.plantName}</h3>
          </div>
        </div>
      )}
    </div>
  );
}