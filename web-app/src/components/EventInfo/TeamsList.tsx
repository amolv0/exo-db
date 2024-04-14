import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, CircularProgress } from '@mui/material';
import '../../Stylesheets/eventTable.css'

interface LocationData {
  city: string | null;
  region: string | null;
  country: string | null;
}

interface TeamDetail {
  id: number | null;
  number: string | null;
  team_name: string | null;
  organization: string | null;
  location: LocationData | null;
}

interface JSONComponentProps {
  teams: number[] | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ teams }) => {
  const [teamDetails] = useState<TeamDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
  const [groupsOf100, setGroupsOf100] = useState<number[][]>([]);

  const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
      const groups: number[][] = [];
      for (let i = 0; i < arr.length; i += groupSize) {
          groups.push(arr.slice(i, i + groupSize));
      }
      return groups;
  };

  useEffect(() => {
      if (teams) {
          const groupedIds: number[][] = divideIntoGroups(teams, 100);
          setGroupsOf100(groupedIds); 
          setIsFirstUseEffectDone(true);
      }
  }, [teams]);

  useEffect(() => {
    if (!isFirstUseEffectDone) {
      return;
    }
    const fetchTeamDetails = async () => {
      if (teams && teams.length > 0) {
        try {
          for (let i = 0; i < groupsOf100.length; i++) {
            const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/teams/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(groupsOf100[i])
            });
            if (response.ok) {
              const data = await response.json();
              teamDetails.push(...data);
            }
          }
          teamDetails.sort((a: TeamDetail, b: TeamDetail) => {
            const numA = parseInt(((a.number && a.number.match(/\d+/)) || ['0'])[0], 10);
            const numB = parseInt(((b.number && b.number.match(/\d+/)) || ['0'])[0], 10);
            return numA - numB;
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teams, isFirstUseEffectDone]);

  return (
    <div>
      {loading ? (
        <CircularProgress color="inherit" />
      ) : teamDetails.length > 0 ? (
        <div className = "p-10">
        <div className="eventsListsTitle">Teams List</div>
        <div className="table">
          <div className="header col small">
            <div className = "header-cell rounded-tl-lg">
            Number
            </div>
            {teamDetails && Array.isArray(teamDetails) && teamDetails.map((team, index, array) => (
              <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                <div>
                      <Link to={`/teams/${team.id}`} className = "teamBox">{team.number}</Link>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="header col mid">
              <div className = "header-cell">
              Team Name
              </div>
              {teamDetails && Array.isArray(teamDetails) && teamDetails.map((team, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                  <div>
                    <Link to={`/teams/${team.id}`}>{team.team_name}</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="header col mid">
              <div className = "header-cell">
              Organization
              </div>
              {teamDetails && Array.isArray(teamDetails) && teamDetails.map((team, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                  <div>
                    {team.organization}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="header col mid">
              <div className = "rounded-tr-lg header-cell">
              Location
              </div>
              {teamDetails && Array.isArray(teamDetails) && teamDetails.map((team, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                  <div>
                  {team.location?.city}{team.location?.city && team.location?.region ? ', ' : ''}
                  {team.location?.region}{team.location?.region && team.location?.country ? ', ' : ''}{team.location?.country}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      ) : (
        <Typography variant="h6" component="div" sx={{ p: 2, color: 'white', textAlign: 'center' }}>
          No teams available
        </Typography>
      )}
    </div>
  );
};

export default JSONComponent;
