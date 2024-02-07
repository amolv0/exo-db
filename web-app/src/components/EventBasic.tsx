import React from 'react';
import { Link } from 'react-router-dom';

interface JSONComponentProps {
  name: String | null;
  eventID: number | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ name, eventID }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4"></h2>
        {name && (
          <div>
            <Link to={`/events/${eventID}`}>
              <p className="text-white text-2m mb-4 my-8">{name || 'N/A'}</p>
            </Link>
          </div>
        )}
    </div>
  );
};

export default JSONComponent;
