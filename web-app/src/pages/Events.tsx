import React, { useState, useEffect } from 'react';
import EventsListQuery from '../components/EventLists/EventsListQuery';
import { useLocation, useNavigate } from 'react-router-dom';
import RegionDropdown from '../components/Dropdowns/RegionDropDown';
import ProgramDropdown from '../components/Dropdowns/ProgramDropDown';
import DateDropdown from '../components/Dropdowns/DateDropDown';
import OngoingDropdown from '../components/Dropdowns/OngoingDropDown';
import '../Stylesheets/pageLayout.css';

const Events: React.FC = () => {
  // State variables to manage selected values
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [status, setStatus] = useState<string>(searchParams.get('status')  || ''); // for Ongoing
  const [startAfterDate, setStartAfterDate] = useState<string>(searchParams.get('startAfterDate')  || ''); // for Start After Date
  const [region, setRegion] = useState<string>(searchParams.get('region')  || ''); // for Region
  const [program, setProgram] = useState<string>(searchParams.get('program')  || ''); // for Program Name
  const navigate = useNavigate();

  useEffect(() => {
    const state = { status, startAfterDate, region, program};
    const url = `/events?status=${status}&startAfterDate=${startAfterDate}&region=${region}&program=${program}`;
    navigate(url, { state, replace: true });
  }, [status, startAfterDate, region, program, navigate]);

  return (
    <div>
      <h1 className="title leftDisplay mr-12">Events</h1>
      {/* Checkbox for Ongoing */}
      <div className="leftDisplay mr-16">
        <OngoingDropdown ongoing={status} setOngoing={setStatus}></OngoingDropdown>
      </div>

      <div className="dropdownDisplay" style={{left: "-75px" }}>
        {/* Styled Dropdown for Program */}
        <div >
          <ProgramDropdown program={program} setProgram={setProgram} all = {true} />
        </div>

        {/* Styled Dropdown for Region */}
        <div>
          <RegionDropdown onSelect={setRegion} value = {region}/>
        </div>
        
        {/* Styled Dropdown for Dates */}
        <DateDropdown startAfterDate={startAfterDate} setStartAfterDate={setStartAfterDate} />
      </div>
      <br />
      <div className = "eventDisplay">
        <EventsListQuery
          numberOfEvents={100000000}
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
