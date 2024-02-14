import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface LocationData {
  city: string;
  region: string;
  country: string;
}

interface TeamDetail {
  id: number;
  number: string;
  team_name: string;
  organization: string;
  location: LocationData;
}

interface JSONComponentProps {
  teams: number[] | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ teams }) => {
  const [teamDetails, setTeamDetails] = useState<TeamDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (teams && teams.length > 0) {
        try {
          const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/teams/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(teams)
          });
          if (response.ok) {
            const data = await response.json();
            setTeamDetails(data);
          }
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
    <div className="mx-auto bg-gray-700 text-white p-4 rounded-lg shadow-md mt-4">
      {loading ? (
        <p className="text-lg">Loading...</p>
      ) : teamDetails.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Teams List</h2>
          <table className="w-full">
            <tbody>
              {teamDetails.map((team, index) => (
                <tr key={index} className={index !== teamDetails.length - 1 ? "border-b border-gray-600 hover:text-blue-200" : "hover:text-blue-200"}>
                  <td className="py-4">
                    <Link to={`/teams/${team.id}`} className="flex items-center justify-between">
                      <span>{team.number}</span>
                    </Link>
                  </td>
                  <td className="py-4">
                    <Link to={`/teams/${team.id}`} className="flex items-center justify-between">
                      <span>{team.team_name}</span>
                    </Link>
                  </td>
                  <td className="py-4">
                    <Link to={`/teams/${team.id}`} className="flex items-center justify-between">
                      <span>{team.organization}</span>
                    </Link>
                  </td>
                  <td className="py-4">
                    <Link to={`/teams/${team.id}`} className="flex items-center justify-between">
                      <span>
                        {team.location.city && `${team.location.city}`}
                        {team.location.region && `, ${team.location.region}`}
                        {team.location.country && `, ${team.location.country}`}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-lg">No teams available</p>
      )}
    </div>

  );
};

export default JSONComponent;
