import React, { useState, useEffect } from 'react';
import SeasonSkills from '../components/SkillsLadderList/SeasonSkills';
import { getSeasonNameFromId } from '../SeasonEnum';

const Teams: React.FC = () => {
  const [seasonId, setSeasonId] = useState<number>(181);
  const [seasonName, setSeasonName] = useState<string>(getSeasonNameFromId(seasonId));
  const [grade, setGrade] = useState<string>('High School');
  const [seasons, setSeasons] = useState<number[]>([]);

  useEffect(() => {
    setSeasonName(getSeasonNameFromId(seasonId));
  }, [seasonId]);

  useEffect(() => {
    const filteredSeasons: number[] = [];
    for (let i = 50; i <= 250; i++) {
      const seasonName = getSeasonNameFromId(i);
      if (seasonName !== i.toString()) {
        filteredSeasons.push(i);
      }
    }
    setSeasons(filteredSeasons);
  }, []);

  const handleSeasonChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSeasonId(parseInt(event.target.value));
  };

  const handleGradeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setGrade(event.target.value);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-white text-2xl font-bold mb-4 my-8">Skills</h1>
      <div className="flex items-center mb-4">
        <label htmlFor="grade" className="mr-4">Grade:</label>
        <select id="grade" value={grade} onChange={handleGradeChange} className="p-2 rounded-md bg-gray-200 mr-4">
          <option value="High School">High School</option>
          <option value="Middle School">Middle School</option>
          <option value="College">College</option>
        </select>
        <label htmlFor="season" className="mr-4">Season:</label>
        <select id="season" value={seasonId} onChange={handleSeasonChange} className="p-2 rounded-md bg-gray-200">
          {seasons
            .filter(s => (grade === 'College' ? getSeasonNameFromId(s).includes('VEXU') : !getSeasonNameFromId(s).includes('VEXU') && getSeasonNameFromId(s).includes('VEX')))
            .map(s => (
              <option key={s} value={s}>{getSeasonNameFromId(s)}</option>
            ))}
        </select>
      </div>
      <SeasonSkills season={seasonId.toString()} grade={grade}/>
    </div>
  );
  
};

export default Teams;
