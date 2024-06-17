import React, { useState, useEffect } from 'react';
import SkillsList from '../components/Lists/SkillsList';
import RegionDropdown from '../components/Dropdowns/RegionDropDown';
import { useLocation} from 'react-router-dom';
import SeasonDropdown from '../components/Dropdowns/SeasonDropDown';
import GradeDropdown from '../components/Dropdowns/GradeDropDown';
import '../Stylesheets/pageLayout.css';

// Controls display for general skills page

const Teams: React.FC = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [seasonId, setSeasonId] = useState<number>(parseInt(searchParams.get('seasonId') || '181'));
    const [grade, setGrade] = useState<string>(searchParams.get('grade') || 'High School');
    const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || 'All');

    // Change the url based upon changes in the query
    useEffect(() => {
        const url = `/skills?grade=${grade}&seasonId=${seasonId}&region=${selectedRegion}`;
        window.history.replaceState(null, '', url);
    }, [grade, seasonId, selectedRegion]);

    // If the grade changes, hard force the season id change
    useEffect(() => {
        if (grade === 'College') {
            setSeasonId(182);
        }
        if ((grade === 'High School' || grade === 'Middle School')) {
            setSeasonId(181);
        }
    }, [grade]);

    return (
        <div className = "pageBackground">
            <h1 className="title leftDisplay skillsAdjust">Skills</h1>

            {/* DropDowns*/}
            <div className="dropdownDisplay skillsDropdownAdjust">
                <div>
                    <GradeDropdown setGrade={setGrade} grade={grade}/>
                </div>
                <div>
                    <SeasonDropdown setSeasonId={setSeasonId} seasonId={seasonId} type='' grade={grade} restrict={null}/>
                </div>
                <div>
                    <RegionDropdown onSelect={setSelectedRegion} value = {selectedRegion}/>
                </div>
            </div>
            <br/>
            <div className = "eventDisplay">
                <SkillsList season={seasonId.toString()} grade={grade} region={selectedRegion}/>
            </div>

        </div>
    );
};

export default Teams;
