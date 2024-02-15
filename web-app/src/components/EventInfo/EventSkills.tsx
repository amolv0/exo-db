import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface TeamData {
  name: string;
  id: number;
}

interface Skill {
  score: number;
  name: string;
  rank: number;
  team: TeamData;
  type: string;
  attempts: number;
}

interface EventSkillsComponentProps {
  skills: Skill[];
}

const EventSkillsComponent: React.FC<EventSkillsComponentProps> = ({ skills }) => {
  const [selectedOption, setSelectedOption] = useState<'programming' | 'driver' | 'combined'>('combined');

  const programmingSkills = skills.filter(skill => skill.type === "programming");
  const driverSkills = skills.filter(skill => skill.type === "driver");

  const programmingScoresMap = new Map<number, number>();
  const driverScoresMap = new Map<number, number>();
  const combinedScoresMap = new Map<number, number>();
  
  programmingSkills.forEach(skill => {
    const teamId = skill.team.id;
    if (!programmingScoresMap.has(teamId)) {
      programmingScoresMap.set(teamId, skill.score);
    } else {
      programmingScoresMap.set(teamId, programmingScoresMap.get(teamId)! + skill.score);
    }
  });
  
  driverSkills.forEach(skill => {
    const teamId = skill.team.id;
    if (!driverScoresMap.has(teamId)) {
      driverScoresMap.set(teamId, skill.score);
    } else {
      driverScoresMap.set(teamId, driverScoresMap.get(teamId)! + skill.score);
    }
  });
  
  skills.forEach(skill => {
    const teamId = skill.team.id;
    const combinedScore = (programmingScoresMap.get(teamId) ?? 0) + (driverScoresMap.get(teamId) ?? 0);
    combinedScoresMap.set(teamId, combinedScore);
  });
  
  const sortedCombinedScores = Array.from(combinedScoresMap.entries()).sort((a, b) => b[1] - a[1]);
  const sortedProgScores = Array.from(programmingScoresMap.entries()).sort((a, b) => b[1] - a[1]);
  const sortedDriverScores = Array.from(driverScoresMap.entries()).sort((a, b) => b[1] - a[1]);
  

  return (
    <div className="mx-auto bg-gray-700 text-white p-4 rounded-lg shadow-md mt-4">
      <div className="flex flex-row space-x-4">
        <button className={`rounded-lg px-4 py-2 ${selectedOption === 'combined' ? 'bg-blue-200 text-white' : 'bg-gray-200 text-gray-800'}`} onClick={() => setSelectedOption('combined')}>Combined Scores</button>
        <button className={`rounded-lg px-4 py-2 ${selectedOption === 'driver' ? 'bg-blue-200 text-white' : 'bg-gray-200 text-gray-800'}`} onClick={() => setSelectedOption('driver')}>Driver Scores</button>
        <button className={`rounded-lg px-4 py-2 ${selectedOption === 'programming' ? 'bg-blue-200 text-white' : 'bg-gray-200 text-gray-800'}`} onClick={() => setSelectedOption('programming')}>Programming Scores</button>
      </div>
      <div>
        {selectedOption === 'programming' && (
          <ul className="ml-4">
            {sortedProgScores.map(([teamId, score], index) => {
              const team = skills.find(skill => skill.team.id === teamId)?.team;
              if (team) {
                return (
                  <li key={teamId} className="mb-4 border-b border-gray-300 py-2">
                    <Link to={`/teams/${teamId}`} className="hover:text-blue-500">
                      <span className="font-semibold">{index + 1}.</span> {team.name} - Score: {score}
                    </Link>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        )}
        {selectedOption === 'driver' && (
          <ul className="ml-4">
            {sortedDriverScores.map(([teamId, score], index) => {
              const team = skills.find(skill => skill.team.id === teamId)?.team;
              if (team) {
                return (
                  <li key={teamId} className="mb-4 border-b border-gray-300 py-2">
                    <Link to={`/teams/${teamId}`} className="hover:text-blue-500">
                      <span className="font-semibold">{index + 1}.</span> {team.name} - Score: {score}
                    </Link>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        )}
        {selectedOption === 'combined' && (
          <ul className="ml-4">
            {sortedCombinedScores.map(([teamId, score], index) => {
              const team = skills.find(skill => skill.team.id === teamId)?.team;
              if (team) {
                return (
                  <li key={teamId} className="mb-4 border-b border-gray-300 py-2">
                    <Link to={`/teams/${teamId}`} className="hover:text-blue-500">
                      <span className="font-semibold">{index + 1}.</span> {team.name} - Score: {score}
                    </Link>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        )}
      </div>
    </div>
  );  
}

export default EventSkillsComponent;
