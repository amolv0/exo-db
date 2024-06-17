import React, { useState, useEffect } from 'react';
import EventsListQuery from '../components/Lists/EventsList';
import { useLocation} from 'react-router-dom';
import RegionDropdown from '../components/Dropdowns/RegionDropDown';
import ProgramDropdown from '../components/Dropdowns/ProgramDropDown';
import DateDropdown from '../components/Dropdowns/DateDropDown';
import OngoingDropdown from '../components/Dropdowns/OngoingDropDown';
import '../Stylesheets/pageLayout.css';

// Controls display for general events page

const Events: React.FC = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [status, setStatus] = useState<string>(searchParams.get('status') || ''); 
    const [startAfterDate, setStartAfterDate] = useState<string>(searchParams.get('startAfterDate') || ''); 
    const [region, setRegion] = useState<string>(searchParams.get('region') || 'All');
    const [program, setProgram] = useState<string>(searchParams.get('program') || 'VRC');

    // Change the url based upon changes in the query
    useEffect(() => {
        const url = `/events?status=${status}&startAfterDate=${startAfterDate}&region=${region}&program=${program}`;
        window.history.replaceState(null, '', url);
    }, [status, startAfterDate, region, program]);
  
    return (
        <div className = "pageBackground">
            <h1 className="title leftDisplay eventAdjust">Events</h1>
            {/* DropDowns*/}
            <div className="eventOngoingAdjust leftDisplay">
            <OngoingDropdown ongoing={status} setOngoing={setStatus}></OngoingDropdown>
            </div>
            <div className="dropdownDisplay eventDropdownAdjust">
                <ProgramDropdown program={program} setProgram={setProgram} all={true} />
                <RegionDropdown onSelect={setRegion} value={region} />
                <DateDropdown startAfterDate={startAfterDate} setStartAfterDate={setStartAfterDate} />
            </div>
            <br/>
            <div className="eventDisplay">
                <EventsListQuery
                  numberOfEvents={100000}
                  status={status}
                  startAfter={startAfterDate}
                  region={region}
                  programCode={program}
                />
            </div>
        </div>
    );
};

export default Events;
