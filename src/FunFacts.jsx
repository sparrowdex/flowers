import React, { useState, useEffect } from 'react';
import './FunFacts.css';

const funFacts = [
  "Peace lilies are not true lilies.",
  "They are native to tropical regions of the Americas and southeastern Asia.",
  "The white 'flower' is actually a specialized leaf bract.",
  "Peace lilies are known for their air-purifying qualities.",
  "They can thrive in low-light conditions.",
  "The scientific name for the peace lily is Spathiphyllum.",
  "They are a symbol of peace, purity, and innocence.",
  "Overwatering is a common mistake with peace lilies.",
  "They can grow up to 3 feet tall indoors.",
  "Peace lilies can be toxic to cats and dogs if ingested.",
  "They prefer high humidity environments.",
  "Yellow leaves can be a sign of overwatering or underwatering.",
  "They are a popular gift for funerals and as a sign of sympathy.",
  "Peace lilies can rebloom with the right care.",
  "They are relatively low-maintenance plants."
];

const FunFacts = () => {
  const [fact, setFact] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const [lastFact, setLastFact] = useState(null);

  useEffect(() => {
    const showRandomFact = () => {
      let newFact;
      do {
        newFact = funFacts[Math.floor(Math.random() * funFacts.length)];
      } while (newFact === lastFact);

      const newPosition = {
        top: Math.random() * 80 + 10,
        left: Math.random() * 80 + 10,
      };
      setFact(newFact);
      setLastFact(newFact);
      setPosition(newPosition);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 4000);
    };

    const interval = setInterval(showRandomFact, 5000);
    return () => clearInterval(interval);
  }, [lastFact]);

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
