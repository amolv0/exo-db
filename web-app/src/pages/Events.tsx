import React, { useState, useEffect } from 'react';
import EventsListQuery from '../components/EventLists/EventsListQuery';
import { useLocation, useNavigate } from 'react-router-dom';
import RegionDropdown from '../components/Helper/RegionDropDown';

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
      <h1 className="text-black text-3xl mb-4 my-8">Events</h1>
      <div className="flex flex-wrap justify-center items-center">
        {/* Checkbox for Ongoing */}
        <label className="mr-2">
          Ongoing:
          <input
            className="ml-1"
            type="checkbox"
            checked={status === 'ongoing'}
            onChange={(e) => setStatus(e.target.checked ? 'ongoing' : '')}
          />
        </label>

        {/* Styled Dropdown for Program */}
        <div className="dropdown mr-4">
          <label htmlFor="program" className="mr-2">Program:</label>
          <select
            id="program"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="p-2 rounded-md bg-gray-200"
          >
            <option value="">--Select Program--</option>
            <option value="VRC">VRC</option>
            <option value="VEXU">VEXU</option>
            <option value="VIQRC">VIQRC</option>
            {/* Add more options dynamically if needed */}
          </select>
        </div>

        {/* Styled Dropdown for Region */}
        <label htmlFor="region" className="mr-4">Region:</label>
        <div>
          <RegionDropdown onSelect={setRegion} value = {region}/>
        </div>

        <label htmlFor="startAfterDate" className="mr-2 ml-2">Start After Date:</label>
        <input
          type="date"
          id="startAfterDate"
          value={startAfterDate}
          onChange={(e) => setStartAfterDate(e.target.value)}
          className="p-2 rounded-md bg-gray-200"
        />
      </div>
      <br />
      {/* Pass selected values as props to EventsListQuery */}
      <EventsListQuery
        numberOfEvents={50}
        status={status}
        startAfter={startAfterDate}
        region={region}
        programCode={program}
      />
    </div>
  );
};

export default Events;
