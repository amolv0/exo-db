import React from 'react';

// Define a functional component that takes in a JSON object as a prop
interface SeasonData {
  name: string;
  id: number;
  code: string | null;
}

interface NameData {
  name: string;
  id: number;
  code: string | null;
}

interface ProgramData {
  name: string;
  id: number;
  code: string | null;
}

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
  location: LocationData | null;
  season: SeasonData | null;
  name: NameData | null;
  program: ProgramData | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ location, season, name, program }) => {
  return (
    <div className="max-w-md mx-auto bg-black text-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Event Data</h2>
        {location && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Location</h3>
            <p>Venue: {location.venue || 'N/A'}</p>
            <p>Country: {location.country || 'N/A'}</p>
            <p>City: {location.city || 'N/A'}</p>
            <p>Address 1: {location.address_1 || 'N/A'}</p>
            <p>Postcode: {location.postcode || 'N/A'}</p>
            <p>Region: {location.region || 'N/A'}</p>
          </div>
        )}
        {season && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Season</h3>
            <p>{season.name}</p>
          </div>
        )}
        {program && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Program</h3>
            <p>{program.code || 'N/A'}</p>
          </div>
        )}
    </div>
  );
};

export default JSONComponent;
