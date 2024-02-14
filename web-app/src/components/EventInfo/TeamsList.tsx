import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface TeamDetail {
  id: number;
  name: string;
}

interface JSONComponentProps {
  teams: string | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ teams }) => {
  const [teamDetails, setTeamDetails] = useState<TeamDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  console.log(teams);
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (teams && teams.length > 0) {
        try {
          const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/teams/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: teams
          });
          if (response.ok) {
            const data = await response.json();
            setTeamDetails(data);
          } else {
            setError('Failed to fetch team details');
          }
        } catch (error) {
          setError('Error fetching team details');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teams]);

  return (
    <div className="max-w-md mx-auto bg-black text-white p-4 rounded-lg shadow-md">
      {loading ? (
        <p className="text-lg">Loading...</p>
      ) : error ? (
        <p className="text-lg">{error}</p>
      ) : teamDetails.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Teams List</h2>
          <div className="grid grid-cols-4 gap-4">
            {teamDetails.map((team, index) => (
              <div key={index} className="bg-gray rounded-lg p-2">
                <Link to={`/teams/${team.id}`} className="block hover:text-blue-200">
                  {team.name}
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
