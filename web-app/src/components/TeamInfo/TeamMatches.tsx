import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { getSeasonNameFromId } from '../../SeasonEnum';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import MatchBasic from '../EventLists/Helpers/MatchBasic';
interface TeammatchesProps {
  matches: number[];
}

const Teammatches: React.FC<TeammatchesProps> = ({ matches }) => {

  const [seasonEventsMap, setSeasonEventsMap] = useState<{ [season: number]: { [event_id: number]: any[] } }>({});
  const [selectedSeason, setSelectedSeason] = useState<number>(181);
  const [posts, setPosts] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [groupsOf100, setGroupsOf100] = useState<number[][]>([]);
  const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);

  const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
    const groups: number[][] = [];
    for (let i = 0; i < arr.length; i += groupSize) {
        groups.push(arr.slice(i, i + groupSize));
    }
    return groups;
  };
  
  useEffect(() => {
      if (matches) {
          const groupedIds: number[][] = divideIntoGroups(matches, 100);
          setGroupsOf100(groupedIds); 
          setIsFirstUseEffectDone(true);
      } else {
        setLoading(false);
      }
  }, [matches]);

  useEffect(() => {
    if (!isFirstUseEffectDone) {
      return;
    }
    const fetchMatchesDetails = async () => {
      if (matches && matches.length > 0) {
        try {
          setLoading(true);
          const allEvents: any[] = [];
          for (let i = 0; i < groupsOf100.length; i++) {
            const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/matches/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(groupsOf100[i])
            });
            const data = await response.json();
            allEvents.push(...data);
          }

          const tempSeasonEventsMap: { [season: number]: { [event_name: string]: any[] } } = {};
          allEvents.forEach(event => {
            if (event.season != undefined) {
              if (!tempSeasonEventsMap[event.season]) {
                tempSeasonEventsMap[event.season] = {};
              }
              if (!tempSeasonEventsMap[event.season][event.event_name]) {
                tempSeasonEventsMap[event.season][event.event_name] = [];
              }
              tempSeasonEventsMap[event.season][event.event_name].push(event);
            }
          });

          Object.values(tempSeasonEventsMap).forEach(seasonEvents => {
            Object.values(seasonEvents).forEach(events => {
              events.sort((a: any, b: any) => new Date(a.started).getTime() - new Date(b.started).getTime());
            });
          });

          setSeasonEventsMap(tempSeasonEventsMap);
          setSelectedSeason(Math.max(...Object.keys(tempSeasonEventsMap).map(Number)));
          console.log(Math.max(...Object.keys(tempSeasonEventsMap).map(Number)));
        } catch (error) {
          console.error('Error fetching match details:', error);
        } finally {
          setPosts(false);
          setLoading(false);
        }
      } else {
         setLoading(false);
      }
    };
  
    // Sort the matches according to the custom order
    fetchMatchesDetails();
  }, [matches, isFirstUseEffectDone]); 

  return (
    <div>
      {loading ? (
        <CircularProgress style={{ margin: '20px' }} />
      ) : posts ? (
        <div>No matches found</div>
      ) : (
        <div className="text-black">
          <br />
            <div className="flex justify-center">
              <SeasonDropdown
                seasonId={selectedSeason}
                setSeasonId={setSelectedSeason}
                type=""
                grade=""
                restrict={Object.keys(seasonEventsMap)}
              />
            </div>
            <br />
            <div>
              {seasonEventsMap[selectedSeason] &&
                Object.entries(seasonEventsMap[selectedSeason]).map(([event_name, matches]) => (
                  <div className = "mt-10" key={event_name}>
                    <div>{event_name}</div>
                    {matches.map((match, index) => (
                      <MatchBasic key={index} match={match} />
                    ))}
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default Teammatches;
