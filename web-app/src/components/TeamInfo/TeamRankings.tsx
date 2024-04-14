import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { getSeasonNameFromId } from '../../SeasonEnum';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';

interface TeamrankingsProps {
  rankings: number[];
}

const Teamrankings: React.FC<TeamrankingsProps> = ({ rankings }) => {
  const [seasonMap, setSeasonMap] = useState<{ [key: number]: any[] }>({});
  const [selectedSeason, setSelectedSeason] = useState<number>(181);
  const [posts, setPosts] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [groupsOf50, setGroupsOf50] = useState<number[][]>([]);
  const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);

  const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
    const groups: number[][] = [];
    for (let i = 0; i < arr.length; i += groupSize) {
        groups.push(arr.slice(i, i + groupSize));
    }
    return groups;
  };

  useEffect(() => {
      if (rankings) {
        const uniqueRankings = rankings.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });
        // Divide uniqueRankings into groups of 50
        const groupedIds: number[][] = divideIntoGroups(uniqueRankings, 50);
        setGroupsOf50(groupedIds); 
        setIsFirstUseEffectDone(true);
      } else {
        setLoading(false);
      }
  }, [rankings]);

  useEffect(() => {
    const fetchrankingsDetails = async () => {
      if (rankings && rankings.length > 0) {
        try {
          setLoading(true);
          const allEvents: any[] = [];
          for (let i = 0; i < groupsOf50.length; i++) {
                const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/rankings/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupsOf50[i])
              });
              const data = await response.json();
              allEvents.push(...data);
          }
          const tempSeasonMap: { [season: number]: any[] } = {};
          
          // THIS IS TEMPORARY UNTIL SEASON SUPPORT
          allEvents.forEach(event => {
            if (event.season) {
                if (!tempSeasonMap[event.season]) {
                  tempSeasonMap[event.season] = [];
              }
              tempSeasonMap[event.season].push(event);
            }
          });

          setSeasonMap(tempSeasonMap);
          setSelectedSeason(Math.max(...Object.keys(tempSeasonMap).map(Number)));
        } catch (error) {
          console.error('Error fetching award details:', error);
        } finally {
          setPosts(false);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchrankingsDetails();
  }, [rankings, isFirstUseEffectDone]);

  return (
    <div>
      {loading ? ( // Render loading indicator if loading state is true
        <CircularProgress style={{ margin: '20px' }} />
      ) : posts ? (  // no rankings :)
        <div>No rankings found</div>
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
          <div>
          {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((rankings, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                    <Link to={`/events/${rankings.event_id}`}>
                      {rankings.event_name}
                    </Link>
                    <div> 
                      Event Average: {rankings.average_points}
                    </div>
                    <div>
                      Total Points: {rankings.total_points}
                    </div>
                    <div>
                      Dpr: {rankings.dpr}
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Teamrankings;
