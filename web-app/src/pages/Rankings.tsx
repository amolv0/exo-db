import React, { useState, useEffect, useRef } from 'react';

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
  const [loading, setLoading] = useState<boolean>(true);
  
  const initialRender = useRef(true);

  console.log(program + " " + seasonId + " " + loading);

  useEffect(() => {
    // Skip the effect on the initial render
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (program === 'VRC') {
      setSeasonId(181);
    } else {
      setSeasonId(182);
    }
  }, [program]);

  useEffect(() => {
    const url = `/rankings?program=${program}&seasonId=${seasonId}&region=${selectedRegion}`;
    window.history.replaceState(null, '', url);
  }, [seasonId, selectedRegion]);
  
  return (
    <div>
      <h1 className="title leftDisplay ml-4">Ratings</h1>
      <div className="dropdownDisplay" style={{left: "-23px" }}>
        <div >
          <ProgramDropdown setProgram={setProgram} program={program}  all = {false} />
        </div>
        <div>
          <SeasonDropdown setSeasonId={setSeasonId} seasonId={seasonId} type={program} grade='' restrict = {null} />
        </div>
        <div>
          <RegionDropdown onSelect={setSelectedRegion} value = {selectedRegion}/>
        </div>
      </div>
      <div className = "eventDisplay"> 
        <SeasonRankings program={program} season={seasonId.toString()} region={selectedRegion} />
      </div>
    </div>
  );
};

export default Rankings;
