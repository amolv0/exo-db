import React from 'react';

interface Match {
  scheduled: string;
  started: string;
  matchnum: number;
  round: number;
  name: string;
  alliances: AllianceData[];
}

interface AllianceData {
  color: string;
  alliance: TeamData[];
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
  const { matchnum, scheduled, started, alliances } = match;

  return (
    <div className="max-w-xl mx-auto mt-8 bg-gray-700 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Match {matchnum}</h2>
    </div>
  );
};

export default MatchDisplay;
