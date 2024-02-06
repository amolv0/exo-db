import React from 'react';

interface JSONComponentProps {
  teams: number[] | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ teams }) => {
  return (
    <div className="max-w-md mx-auto bg-black text-white p-4 rounded-lg shadow-md">
      {teams && teams.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Teams List</h2>
          <ul className="pl-4">
            {teams.map((teamId, index) => (
              <li key={index}>{teamId}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-lg">No teams available</p>
      )}
    </div>
  );
};

export default JSONComponent;
