import React from 'react';
import { Link } from 'react-router-dom';

// Define a functional component that takes in a JSON object as a prop
interface SeasonData {
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

interface TeamData {
  name: string;
  id: number;
}

interface WinnersData {
  team: TeamData;
}

interface AwardData {
  title: string;
  teamWinners: WinnersData[];
}

interface JSONComponentProps {
  location: LocationData | null;
  season: SeasonData | null;
  program: String | null;
  awards: AwardData[] | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ location, season, program, awards }) => {
  return (
    <div className = "grid grid-cols-2">
      <div className="mx-10 bg-gray-700 text-white p-4 rounded-lg shadow-md mt-4">
        <h2 className="text-xl font-semibold mb-4">Event Data</h2>
          {location && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Location</h3>
              <p>Venue: {location.venue || 'N/A'}</p>
              <p>Country: {location.country || 'N/A'}</p>
              <p>City: {location.city || 'N/A'}</p>
              <p>Address: {location.address_1 || 'N/A'}</p>
              <p>Region: {location.region || 'N/A'}</p>
            </div>
          )}
          {season && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Season</h3>
              <p>{season.name || 'N/A'}</p>
            </div>
          )}
          {program && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Program</h3>
              <p>{program || 'N/A'}</p>
            </div>
          )}
      </div>
      <div className="mx-10 bg-gray-700 text-white p-4 rounded-lg shadow-md mt-4">
        {awards && awards.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Award Winners</h2>
            {awards.map((award, index) => (
              <div key={index} className="mb-6">
                <h3 className="text-lg font-medium mb-2">{award.title && award.title.substring(0, award.title.indexOf('('))}</h3>
                <div className="flex">
                  {award.teamWinners && award.teamWinners.map((winner, winnerIndex) => (
                    <div key={winnerIndex} className="mr-4">
                      <Link to={`/teams/${winner.team.id}`} className = "hover:text-blue-200">
                        {winner.team.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

  );
};

export default JSONComponent;
