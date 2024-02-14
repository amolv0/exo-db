import React from 'react';
import MatchBasic from '../EventLists/Helpers/MatchBasic';

interface Division {
  matches : Match[];
}

interface Match {
  scheduled: string;
  started: string;
  matchnum: number;
  round: number;
  field: string;
  name: string;
  alliances: AllianceData[];
}

interface AllianceData {
  color: string;
  teams: TeamData[];
  score: number;
}

interface TeamData {
  team: TeamInfo;
}

interface TeamInfo {
  name: string;
  id: number;
}

const MatchesDisplay: React.FC<{ division: Division }> = ({ division }) => {

  if (!division.matches || division.matches.length === 0) {
    return <p>No matches</p>;
  }

  return (
    <div>
      {division.matches.map((match, index) => (
        <MatchBasic key={index} match={match} />
      ))}
    </div>
  );
};

export default MatchesDisplay;
