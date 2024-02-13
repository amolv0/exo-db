import React from 'react';

// Define a functional component that takes in a JSON object as a prop

interface LocationData {
  country: string;
  city: string;
  address_1: string;
  region: string;
}

interface JSONComponentProps {
  location: LocationData | null;
  org: String | null;
  program: String | null;

}

const JSONComponent: React.FC<JSONComponentProps> = ({ location, org, program}) => {
  return (
    <div className="max-w-md mx-auto bg-black text-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Team Data</h2>
        {location && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Location</h3>
            <p>Country: {location.country || 'N/A'}</p>
            <p>City: {location.city || 'N/A'}</p>
            <p>Address: {location.address_1 || 'N/A'}</p>
            <p>Region: {location.region || 'N/A'}</p>
          </div>
        )}
        {org && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Orginization</h3>
            <p>{org}</p>
          </div>
        )}
        {program && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Program</h3>
            <p>{program || 'N/A'}</p>
          </div>
        )}
    </div>
  );
};

export default JSONComponent;
