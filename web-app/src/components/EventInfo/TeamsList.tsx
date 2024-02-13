import React from 'react';
import { Link } from 'react-router-dom';

interface JSONComponentProps {
  teams: number[] | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ teams }) => {
  return (
    <div className="max-w-md mx-auto bg-black text-white p-4 rounded-lg shadow-md">
      {teams && teams.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Teams List</h2>
          <div className="grid grid-cols-4 gap-4">
            {teams.map((teamId, index) => (
              <div key={index} className="bg-gray rounded-lg p-2">
                <Link to={`/teams/${teamId}`} className="block hover:text-blue-200">
                  {teamId}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-lg">No teams available</p>
      )}
    </div>
  );
};

export default JSONComponent;
