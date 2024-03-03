import React, { useState, useEffect } from 'react';
import { getSeasonNameFromId } from '../SeasonEnum';
import SeasonRankings from '../components/RankingsList/SeasonRankings';

const Rankings: React.FC = () => {
  const [seasonId, setSeasonId] = useState<number>(181);
  const [seasonName, setSeasonName] = useState<string>(getSeasonNameFromId(seasonId));
  const [seasons, setSeasons] = useState<number[]>([]);
  const [eventType, setEventType] = useState<string>('VEX');

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

  const handleEventTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEventType(event.target.value);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-white text-2xl font-bold mb-4 my-8">Rankings</h1>
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
      </div>
      <SeasonRankings season={seasonId.toString()}/>
    </div>
  );
};

export default Rankings;
