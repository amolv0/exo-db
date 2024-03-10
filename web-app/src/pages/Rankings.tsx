import React, { useState, useEffect } from 'react';
import { getSeasonNameFromId } from '../SeasonEnum';
import SeasonRankings from '../components/RankingsList/SeasonRankings';
import RegionDropdown from '../components/Helper/RegionDropDown';
import { useLocation, useNavigate } from 'react-router-dom';

const Rankings: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [seasonId, setSeasonId] = useState<number>(parseInt(searchParams.get('seasonId') || '181'));
  const [seasons, setSeasons] = useState<number[]>([]);
  const [eventType, setEventType] = useState<string>(searchParams.get('type')  || '');
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || '');

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

  const handleEventTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEventType(event.target.value);
  };


  useEffect(() => {
    const state = { eventType, seasonId, region: selectedRegion };
    const url = `/rankings?grade=${eventType}&seasonId=${seasonId}&region=${selectedRegion}`;
    navigate(url, { state, replace: true });
  }, [eventType, seasonId, selectedRegion, navigate]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-black text-3xl mb-4 my-8">Ratings Leaderboard</h1>
      <div className="flex items-center mb-4">
        <label htmlFor="eventType" className="mr-4">Type:</label>
        <select id="eventType" value={eventType} onChange={handleEventTypeChange} className="p-2 rounded-md bg-gray-200 mr-4">
          <option value="VEX">VEX</option>
          <option value="VEXU">VEXU</option>
        </select>
        <label htmlFor="season" className="mr-4">Season:</label>
        <select id="season" value={seasonId} onChange={handleSeasonChange} className="p-2 rounded-md bg-gray-200 mr-4">
          {seasons
            .filter(s => eventType === 'VEXU' ? getSeasonNameFromId(s).includes('VEXU') :
            (!getSeasonNameFromId(s).includes('VEXU') && getSeasonNameFromId(s).includes('VEX')))
            .map(s => (
              <option key={s} value={s}>{getSeasonNameFromId(s)}</option>
            ))}
        </select>
        {/* Dropdown for Region */}
        <label htmlFor="region" className="mr-4">Region:</label>
        <div>
          <RegionDropdown onSelect={setSelectedRegion} value = {selectedRegion}/>
        </div>
      </div>
      <SeasonRankings season={seasonId.toString()} region={selectedRegion} /> {/* Pass region to SeasonRankings */}
    </div>
  );
};

export default Rankings;
