import React, { useState, useEffect } from 'react';

import SeasonRankings from '../components/RankingsList/SeasonRankings';
import RegionDropdown from '../components/Dropdowns/RegionDropDown';
import SeasonDropdown from '../components/Dropdowns/SeasonDropDown';
import ProgramDropdown from '../components/Dropdowns/ProgramDropDown';
import { useLocation, useNavigate } from 'react-router-dom';
import '../Stylesheets/pageLayout.css';

const Rankings: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [seasonId, setSeasonId] = useState<number>(parseInt(searchParams.get('seasonId') || '181'));
  const [program, setProgram] = useState<string>(searchParams.get('program')  || 'VRC'); 
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || '');

  const navigate = useNavigate();

  useEffect(() => {
    const state = { program, seasonId, region: selectedRegion };
    const url = `/rankings?program=${program}&seasonId=${seasonId}&region=${selectedRegion}`;
    navigate(url, { state, replace: true });
  }, [program, seasonId, selectedRegion, navigate]);

  return (
    <div>
      <h1 className="title leftDisplay ml-4">Ratings</h1>
      <div className="dropdownDisplay" style={{left: "-23px" }}>
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
      <div className = "eventDisplay"> 
        <SeasonRankings season={seasonId.toString()} region={selectedRegion} />
      </div>
    </div>
  );
};

export default Rankings;
