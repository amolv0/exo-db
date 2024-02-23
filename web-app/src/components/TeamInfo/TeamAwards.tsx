import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface TeamAwardsProps {
  awards: number[];
}

interface AwardData {
  event: { name: string; id: number; code: string | null };
  title: string;
  season: number;
}

const TeamAwards: React.FC<TeamAwardsProps> = ({ awards }) => {
  const [awardData, setAwardData] = useState<AwardData[]>([]);
  const [seasonMap, setSeasonMap] = useState<{ [season: number]: AwardData[] }>({});
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  useEffect(() => {
    const fetchAwardDetails = async () => {
      if (awards && awards.length > 0) {
        try {
          const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/awards/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(awards)
          });
          if (response.ok) {
            const data: AwardData[] = await response.json();
            setAwardData(data);
          } else {
            console.error('Failed to fetch award details:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching award details:', error);
        }
      }
    };

    fetchAwardDetails();
  }, [awards]);

  useEffect(() => {
    const seasonMap: { [season: number]: AwardData[] } = {};
    awardData.forEach(award => {
      if (!seasonMap[award.season]) {
        seasonMap[award.season] = [];
      }
      // Check if the award title already exists for this season
      if (!seasonMap[award.season].some(existingAward => existingAward.title === award.title)) {
        seasonMap[award.season].push(award);
      }
    });
    setSeasonMap(seasonMap);
  }, [awardData]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Awards</h2>
      {/* Dropdown to select season */}
      <select
        value={selectedSeason ?? ''}
        onChange={(e) => setSelectedSeason(e.target.value ? parseInt(e.target.value) : null)}
        className="block appearance-none bg-black border border-gray-300 text-white py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-black focus:border-gray-500"
      >
        <option value="">Select Season</option>
        {Object.keys(seasonMap).map(season => (
          <option key={season} value={season} className="text-white">{season}</option>
        ))}
      </select>

      <br />
      <br />

      {/* Display awards and events for selected season */}
      {selectedSeason && seasonMap[selectedSeason] && (
        <div className="border border-gray-300 rounded-md p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">Season {selectedSeason}</h3>
          {seasonMap[selectedSeason].map((award, index) => (
            <div key={index} className="border border-gray-300 rounded-md p-4 mb-4">
              <h4 className="text-md font-semibold mb-2">{award.title}</h4>
              <ul>
                {awardData.filter(a => a.title === award.title && a.season === selectedSeason).map((a, i) => (
                  <Link to={`/events/${a.event.id}`}>
                    <li key={i}>{a.event.name}</li>
                  </Link>

                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default TeamAwards;
