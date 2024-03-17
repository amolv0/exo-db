import React, { useState, useEffect } from 'react';
import SeasonSkills from '../components/SkillsLadderList/SeasonSkills';
import RegionDropdown from '../components/Dropdowns/RegionDropDown';
import { useLocation, useNavigate } from 'react-router-dom';
import SeasonDropdown from '../components/Dropdowns/SeasonDropDown';
import GradeDropdown from '../components/Dropdowns/GradeDropDown';
import '../Stylesheets/pageLayout.css';

const Teams: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [seasonId, setSeasonId] = useState<number>(parseInt(searchParams.get('seasonId') || '181'));
  const [grade, setGrade] = useState<string>(searchParams.get('grade') || 'High School');
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || '');

  const navigate = useNavigate();

  useEffect(() => {
    const state = { grade, seasonId, region: selectedRegion };
    const url = `/skills?grade=${grade}&seasonId=${seasonId}&region=${selectedRegion}`;
    navigate(url, { state, replace: true });
  }, [grade, seasonId, selectedRegion, navigate]);

  return (
    <div>
      <h1 className="title leftDisplay mr-16">Skills</h1>
      <div className="dropdownDisplay"  style={{left: "-25px" }}>
        <div>
          <GradeDropdown setGrade={setGrade} grade={grade}/>
        </div>
        <div>
          <SeasonDropdown setSeasonId={setSeasonId} seasonId={seasonId} type='' grade={grade} />
        </div>
        <div>
          <RegionDropdown onSelect={setSelectedRegion} value = {selectedRegion}/>
        </div>
      </div>
      <div className = "eventDisplay">
        <SeasonSkills season={seasonId.toString()} grade={grade} region={selectedRegion}/>
      </div>

    </div>
  );
};

export default Teams;
