import React, { useState, useEffect } from 'react';
import './BirthdayMessage.css';

const BirthdayMessage = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000); // Message disappears after 4 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="birthday-message-container">
      <div className="birthday-message shimmer">
        Happy Birthday &lt;3
      </div>
    </div>
  );
};

export default BirthdayMessage;
