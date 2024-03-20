import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { getSeasonNameFromId } from '../../SeasonEnum';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';

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
  const [selectedSeason, setSelectedSeason] = useState<number>(181);
  const [posts, setPosts] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAwardDetails = async () => {
      if (awards && awards.length > 0) {
        try {
          setLoading(true);
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
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAwardDetails();
  }, [awards]);

  useEffect(() => {
    if (awardData.length === 0) {
      return;
    }
    if (awardData.length > 0) {
      const highestIdAward = awardData.reduce((prev, current) => (prev.event.id > current.event.id ? prev : current));
      if (highestIdAward.season !== null) {
        setSelectedSeason(highestIdAward.season);
      } else {
        setSelectedSeason(181);
      }
    }
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
    setSeasonMap(seasonMap)
    setPosts(false);
  }, [awardData]);
  return (
    <div>
      {loading ? ( // Render loading indicator if loading state is true
        <CircularProgress style={{ margin: '20px' }} />
      ) : posts ? ( 
        <div>No awards found</div>
      ) : (
        <div className="text-black">
          <br />
          <div className="flex justify-center"> 
            <SeasonDropdown
              seasonId={selectedSeason}
              setSeasonId={setSelectedSeason}
              type=''
              grade=''
              restrict={Object.keys(seasonMap)}
            />      
          </div>
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
                      <Link to={`/events/${a.event.id}`} key={i}>
                        <li>{a.event.name}</li>
                      </Link>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamAwards;
