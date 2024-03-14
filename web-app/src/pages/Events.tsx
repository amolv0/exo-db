import React, { useState, useEffect } from 'react';
import EventsListQuery from '../components/EventLists/EventsListQuery';
import { useLocation, useNavigate } from 'react-router-dom';
import RegionDropdown from '../components/Helper/RegionDropDown';
import ProgramDropdown from '../components/Helper/ProgramDropDown';
import DateDropdown from '../components/Helper/DateDropDown';

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
    <div className="flex flex-col items-center">
      <h1 className="text-black text-3xl mb-4 my-8 text-left">Events</h1>
              {/* Checkbox for Ongoing */}
      <label>
        Ongoing:
        <input
          className="ml-1"
          type="checkbox"
          checked={status === 'ongoing'}
          onChange={(e) => setStatus(e.target.checked ? 'ongoing' : '')}
        />
      </label>
      <div className="flex flex-wrap justify-center items-center">
        {/* Styled Dropdown for Program */}
        <div >
          <ProgramDropdown program={program} setProgram={setProgram} />
        </div>

        {/* Styled Dropdown for Region */}
        <div>
          <RegionDropdown onSelect={setRegion} value = {region}/>
        </div>
        
        {/* Styled Dropdown for Dates */}
        <DateDropdown startAfterDate={startAfterDate} setStartAfterDate={setStartAfterDate} />
      </div>
      <br />
      
      {/* EventsListQuery */}
      <EventsListQuery
        numberOfEvents={25}
        status={status}
        startAfter={startAfterDate}
        region={region}
        programCode={program}
      />
    </div>
  );
};

export default Events;
