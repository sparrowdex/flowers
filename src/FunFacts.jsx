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