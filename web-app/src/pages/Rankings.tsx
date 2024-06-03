import React, { useState, useEffect, useRef } from 'react';

import RatingsList from '../components/Lists/RatingsList';
import RegionDropdown from '../components/Dropdowns/RegionDropDown';
import SeasonDropdown from '../components/Dropdowns/SeasonDropDown';
import ProgramDropdown from '../components/Dropdowns/ProgramDropDown';
import { useLocation } from 'react-router-dom';
import '../Stylesheets/pageLayout.css';

// Controls display for general rankings page

const Rankings: React.FC = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [seasonId, setSeasonId] = useState<number>(parseInt(searchParams.get('seasonId') || '181'));
    const [program, setProgram] = useState<string>(searchParams.get('program')  || 'VRC'); 
    const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || '');
    
    const initialRender = useRef(true);

    // If the program changes, hardforce the program change
    useEffect(() => {
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

    // Change url based upon query updates
    useEffect(() => {
        const url = `/rankings?program=${program}&seasonId=${seasonId}&region=${selectedRegion}`;
        window.history.replaceState(null, '', url);
    }, [program, seasonId, selectedRegion]);
  
    return (
      <div className = "pageBackground">
            <h1 className="title leftDisplay ratingAdjust">Ratings</h1>

            {/* DropDowns*/}
            <div className="dropdownDisplay ratingDropdownAdjust">
                <ProgramDropdown setProgram={setProgram} program={program}  all = {false} />
                <SeasonDropdown setSeasonId={setSeasonId} seasonId={seasonId} type={program} grade='' restrict = {null} />
                <RegionDropdown onSelect={setSelectedRegion} value = {selectedRegion}/>
            </div>

            <div className = "eventDisplay"> 
                <RatingsList program={program} season={seasonId.toString()} region={selectedRegion} />
            </div>
      </div>
    );
};

export default Rankings;
