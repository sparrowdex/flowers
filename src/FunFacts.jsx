import React, { useState, useEffect } from 'react';
import './FunFacts.css';

const FunFacts = ({ facts }) => {
  const [fact, setFact] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const [lastFact, setLastFact] = useState(null);

  useEffect(() => {
    if (!facts || facts.length === 0) return;

    const showRandomFact = () => {
      let newFact;
      do {
        newFact = facts[Math.floor(Math.random() * facts.length)];
      } while (newFact === lastFact);

      // Define safe zones to avoid overlapping with the 3D flower model
      // The flower is typically centered, so avoid the center area
      const safeZones = [
        { top: [10, 35], left: [10, 35] }, // Top-left corner
        { top: [10, 35], left: [65, 90] }, // Top-right corner
        { top: [65, 90], left: [10, 35] }, // Bottom-left corner
        { top: [65, 90], left: [65, 90] }, // Bottom-right corner
        { top: [10, 35], left: [35, 65] }, // Top center (above flower)
        { top: [65, 90], left: [35, 65] }, // Bottom center (below flower)
        { top: [35, 65], left: [10, 35] }, // Left center (left of flower)
        { top: [35, 65], left: [65, 90] }, // Right center (right of flower)
      ];

      const selectedZone = safeZones[Math.floor(Math.random() * safeZones.length)];
      const newPosition = {
        top: Math.random() * (selectedZone.top[1] - selectedZone.top[0]) + selectedZone.top[0],
        left: Math.random() * (selectedZone.left[1] - selectedZone.left[0]) + selectedZone.left[0],
      };

      setFact(newFact);
      setLastFact(newFact);
      setPosition(newPosition);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 4000);
    };

    const interval = setInterval(showRandomFact, 9000);
    return () => clearInterval(interval);
  }, [facts, lastFact]);

  return (
    <div
      className={`fun-fact ${visible ? 'visible' : ''}`}
      style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
      {fact}
    </div>
  );
};

export default FunFacts;