import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { getSeasonNameFromId } from '../../SeasonEnum';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';

interface TeammatchesProps {
  matches: number[];
}

const Teammatches: React.FC<TeammatchesProps> = ({ matches }) => {

  const [seasonMap, setSeasonMap] = useState<{ [key: number]: any[] }>({});
  const [selectedSeason, setSelectedSeason] = useState<number>(181);
  const [posts, setPosts] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [groupsOf50, setGroupsOf50] = useState<number[][]>([]);
  const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
  console.log(matches);
  const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
    const groups: number[][] = [];
    for (let i = 0; i < arr.length; i += groupSize) {
        groups.push(arr.slice(i, i + groupSize));
    }
    return groups;
  };
  /*
  useEffect(() => {
      if (matches) {
          const groupedIds: number[][] = divideIntoGroups(matches, 100);
          setGroupsOf50(groupedIds); 
          setIsFirstUseEffectDone(true);
      }
  }, [matches]);

  useEffect(() => {
    const fetchmatchesDetails = async () => {
      if (matches && matches.length > 0) {
        try {
          setLoading(true);
          const allEvents: any[] = [];
          for (let i = 0; i < groupsOf50.length; i++) {
              const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/matches/', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(groupsOf50[i])
              });
              const data = await response.json();
              allEvents.push(...data);
          }
          console.log(allEvents);

          const tempSeasonMap: { [season: number]: any[] } = {};
          allEvents.forEach(event => {
              if (!tempSeasonMap[event.season.id]) {
                  tempSeasonMap[event.season.id] = [];
              }
              tempSeasonMap[event.season.id].push(event);
          });

          setSeasonMap(tempSeasonMap);
          setSelectedSeason(Math.max(...Object.keys(tempSeasonMap).map(Number)));
          console.log(seasonMap);
        } catch (error) {
          console.error('Error fetching award details:', error);
        } finally {
          setPosts(false);
          setLoading(false);
        }
      }
    };

    fetchmatchesDetails();
  }, [matches, isFirstUseEffectDone]); */

  return (
    <div>
      {loading ? ( // Render loading indicator if loading state is true
        <CircularProgress style={{ margin: '20px' }} />
      ) : posts ? (  // no matches :)
        <div>No matches found</div>
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
          {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((matches, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                    <Link to={`/events/${matches.event_id}`}>
                      {matches.event_name}
                    </Link>
                    <div> 
                      matches Score: {matches.score}
                    </div>
                    <div>
                      matches Rank: {matches.rank}
                    </div>
                    <div>
                      Attempts: {matches.attempts}
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Teammatches;
