import React from 'react';
import { Link } from 'react-router-dom';

interface LocationData {
  venue: string;
  country: string;
  city: string;
  address_1: string;
  address_2: string | null;
  postcode: string;
  coordinates: { lat: number; lon: number };
  region: string;
}

interface JSONComponentProps {
  name: String | null;
  eventID: number | null;
  program : String | null;
  location: LocationData | null;
  start: String | null;
  end: String | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ name, eventID, program, location, start, end }) => {
  return (
    <div>
      {name && (
        <div style={{ display: 'flex', width: '100%' }}>
          <div className = "text-stone-400" style={{ flex: 1 }}>{program}</div>
          <div className = "text-rose-100" style={{ flex: 3 }}>
            <Link to={`/events/${eventID}`}>
              {name || 'N/A'}
            </Link>
          </div>
          <div className="text-stone-400" style={{ flex: 2 }}>
            {location?.city && (<div>{location.city}, {location.country}</div>)}
            {!location?.city && location?.country}
          </div>
          <div className = "text-rose-100" style={{ flex: 2 }}>
            {start && (start.substring(0, 10) === end?.substring(0, 10) ? start.substring(0, 10) : start.substring(0, 10) + ' - ' + end?.substring(0, 10))}
          </div>
        </div>
      )}
      <br></br>
    </div>
  );
};

export default JSONComponent;
