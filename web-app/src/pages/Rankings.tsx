import React, { useState, useEffect } from 'react';

import SeasonRankings from '../components/RankingsList/SeasonRankings';
import RegionDropdown from '../components/Dropdowns/RegionDropDown';
import SeasonDropdown from '../components/Dropdowns/SeasonDropDown';
import ProgramDropdown from '../components/Dropdowns/ProgramDropDown';
import { useLocation, useNavigate } from 'react-router-dom';

const Rankings: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [seasonId, setSeasonId] = useState<number>(parseInt(searchParams.get('seasonId') || '181'));
  const [program, setProgram] = useState<string>(searchParams.get('program')  || ''); 
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || '');

  const navigate = useNavigate();

  useEffect(() => {
    const state = { program, seasonId, region: selectedRegion };
    const url = `/rankings?program=${program}&seasonId=${seasonId}&region=${selectedRegion}`;
    navigate(url, { state, replace: true });
  }, [program, seasonId, selectedRegion, navigate]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-black text-3xl mb-4 my-8">Ratings Leaderboard</h1>
      <div className="flex items-center mb-4">
        <div >
          <ProgramDropdown setProgram={setProgram} program={program}  all = {false} />
        </div>
        <div>
          <SeasonDropdown setSeasonId={setSeasonId} seasonId={seasonId} type={program} grade='' />
        </div>
        <div>
          <RegionDropdown onSelect={setSelectedRegion} value = {selectedRegion}/>
        </div>
      </div>
      <SeasonRankings season={seasonId.toString()} region={selectedRegion} />
    </div>
  );
};

export default Rankings;
