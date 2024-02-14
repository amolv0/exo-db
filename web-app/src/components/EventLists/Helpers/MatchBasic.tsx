import React from 'react';

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

const MatchDisplay: React.FC<{ match: Match }> = ({ match }) => {
  const { name, field, scheduled, started, alliances } = match;

  // Determine if the match has started and get the starting time
  const startTime = started ? new Date(started).toLocaleTimeString() : new Date(scheduled).toLocaleTimeString();

  const blueAlliance = alliances[0];
  const redAlliance = alliances[1];
  
  // Determine the higher score
  const blueScore = blueAlliance.score;
  const redScore = redAlliance.score;
  if (blueScore === 0 && redScore === 0) {
    return null;
  }
  const winningColor = blueScore > redScore ? 'blue' : 'red';
  return (
<div className="max-w-6xl mx-auto mt-4 bg-gray-700 p-4 rounded-lg flex">
  <div className="flex-grow">
    <h2 className="text-lg font-semibold mb-2">{name}</h2>
    <p className="mb-2">Field: {field}</p>
    <p>Start Time: {startTime}</p>
  </div>
  <div className={`flex-grow w-1/3 ${winningColor === 'blue' ? 'bg-blue-600' : 'bg-gray-700'} p-4 rounded-lg`}>
    {blueAlliance.teams.map((teamData, index) => (
      <p key={index} className="text-white">{teamData.team.name}</p>
    ))}
    <p>Score: {blueScore}</p>
  </div>
  <div className={`flex-grow w-1/3 ${winningColor === 'red' ? 'bg-red-600' : 'bg-gray-700'} p-4 rounded-lg`}>
    {redAlliance.teams.map((teamData, index) => (
      <p key={index} className="text-white">{teamData.team.name}</p>
    ))}
    <p>Score: {redScore}</p>
  </div>
</div>


  );
};

export default MatchDisplay;
