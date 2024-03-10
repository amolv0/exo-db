import React, { useState, useEffect } from 'react';
import SeasonSkills from '../components/SkillsLadderList/SeasonSkills';
import { getSeasonNameFromId } from '../SeasonEnum';
import RegionDropdown from '../components/Helper/RegionDropDown';
import { useLocation, useNavigate } from 'react-router-dom';

const Teams: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [seasonId, setSeasonId] = useState<number>(parseInt(searchParams.get('seasonId') || '181'));
  const [grade, setGrade] = useState<string>(searchParams.get('grade')  || '');
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || '');

  const [seasons, setSeasons] = useState<number[]>([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    const state = { grade, seasonId, region: selectedRegion };
    const url = `/skills?grade=${grade}&seasonId=${seasonId}&region=${selectedRegion}`;
    navigate(url, { state, replace: true });
  }, [grade, seasonId, selectedRegion, navigate]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-black text-3xl mb-4 my-8">Skills</h1>
      <div className="flex items-center mb-4">
        <label htmlFor="grade" className="mr-4">Grade:</label>
        <select id="grade" value={grade} onChange={handleGradeChange} className="p-2 rounded-md bg-gray-200 mr-4">
          <option value="College">College</option>
          <option value="High School">High School</option>
          <option value="Middle School">Middle School</option>
        </select>
        <label htmlFor="season" className="mr-4">Season:</label>
        <select id="season" value={seasonId} onChange={handleSeasonChange} className="p-2 rounded-md bg-gray-200 mr-4">
          {seasons
            .filter(s => (grade === 'College' ? getSeasonNameFromId(s).includes('VEXU') : !getSeasonNameFromId(s).includes('VEXU') && getSeasonNameFromId(s).includes('VEX')))
            .map(s => (
              <option key={s} value={s}>{getSeasonNameFromId(s)}</option>
            ))}
        </select>
        <label htmlFor="region" className="mr-4">Region:</label>
        <div>
          <RegionDropdown onSelect={setSelectedRegion} value = {selectedRegion}/>
        </div>
      </div>
      <SeasonSkills season={seasonId.toString()} grade={grade} region={selectedRegion}/> {/* Pass region as a prop */}
    </div>
  );
};

export default Teams;
