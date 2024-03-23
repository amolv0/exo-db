import React, { useState } from 'react';
import MatchBasic from '../EventLists/Helpers/MatchBasic';

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

interface Division {
  name: string;
  matches: Match[];
}

interface Props {
  divisions: Division[];
}

const MatchesDisplay: React.FC<Props> = ({ divisions }) => {
  console.log(divisions);
  const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(0);

  const handleDivisionChange = (index: number) => {
    setSelectedDivisionIndex(index);
  };

  if (!divisions[selectedDivisionIndex] || !divisions[selectedDivisionIndex].matches || divisions[selectedDivisionIndex].matches.length === 0) {
    return <p>No matches</p>;
  }

  const division = divisions[selectedDivisionIndex];
  const customOrder = [1, 2, 6, 3, 4, 5];

  // Sort the matches according to the custom order
  const sortedMatches = division.matches.sort((a, b) => {
    let indexA = customOrder.indexOf(a.round);
    let indexB = customOrder.indexOf(b.round);

    if (indexA === -1) indexA = customOrder.length;
    if (indexB === -1) indexB = customOrder.length;

    return indexA - indexB;
  });

  return (
    <div>
      <select value={selectedDivisionIndex} onChange={(e) => handleDivisionChange(Number(e.target.value))}>
        {divisions.map((division, index) => (
          <option key={index} value={index}>
            {division.name}
          </option>
        ))}
      </select>

      {sortedMatches.map((match, index) => (
        <MatchBasic key={index} match={match} />
      ))}
    </div>
  );
};

export default MatchesDisplay;
