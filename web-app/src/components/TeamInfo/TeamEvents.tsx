import React, { useState, useEffect } from 'react';
import '../../Stylesheets/eventTable.css'
import { Link } from 'react-router-dom';
import { IconButton, CircularProgress } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import { getSeasonNameFromId } from '../../SeasonEnum';

interface EventListDisplayProps {
  eventIdsString: string | null;
}

const EventListDisplay: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
    const [seasonMap, setMapsBySeason] = useState<{ [key: number]: any[] }>({});
    const [ascending, setAscending] = useState<boolean>(false);
    const [groupsOf25, setGroupsOf25] = useState<number[][]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(181);
    const [total, setTotal] = useState<number>(181);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // State to track error message


    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        setTotal(arr.length);
        const groups: number[][] = [];
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };

    useEffect(() => {
        if (eventIdsString) {
            const parsedEventIdsArray: number[] = JSON.parse(eventIdsString);
            const groupedIds: number[][] = divideIntoGroups(parsedEventIdsArray, 25);
            setGroupsOf25(groupedIds); 
            setIsFirstUseEffectDone(true);
        }
    }, [eventIdsString]);

    useEffect(() => {
        if (!isFirstUseEffectDone || !eventIdsString) {
            setError ("Failed to find valid events");
            return;
        }
        const fetchData = async () => {
        try {
            setLoading(true);
            const allEvents: any[] = [];
            for (let i = 0; i < groupsOf25.length; i++) {
                const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupsOf25[i])
                });
                const data = await response.json();
                allEvents.push(...data);
            }
            const tempSeasonMap: { [season: number]: any[] } = {};
            allEvents.forEach(event => {
                if (!tempSeasonMap[event.season.id]) {
                    tempSeasonMap[event.season.id] = [];
                }
                tempSeasonMap[event.season.id].push(event);
            });

            if (ascending) {
                for (const season in tempSeasonMap) {
                    if (Object.prototype.hasOwnProperty.call(tempSeasonMap, season)) {
                        tempSeasonMap[season].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
                    }
                }
            } else {
                for (const season in tempSeasonMap) {
                    if (Object.prototype.hasOwnProperty.call(tempSeasonMap, season)) {
                        tempSeasonMap[season].sort((a, b) =>  new Date(b.start).getTime() - new Date(a.start).getTime());
                    }
                }
            }

            setMapsBySeason(tempSeasonMap);

            setSelectedSeason(Math.max(...Object.keys(tempSeasonMap).map(Number)));
            setError(null);
            } catch (error) {
                setError ("Failed to find valid events");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [eventIdsString, isFirstUseEffectDone]);

    const toggleSortingDirection = () => {
        setAscending((prevAscending) => !prevAscending);
        if (ascending) {
            for (const season in seasonMap) {
                if (Object.prototype.hasOwnProperty.call(seasonMap, season)) {
                    seasonMap[season].sort((a, b) =>  new Date(b.start).getTime() - new Date(a.start).getTime());
                }
            }
        } else {
            for (const season in seasonMap) {
                if (Object.prototype.hasOwnProperty.call(seasonMap, season)) {
                    seasonMap[season].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                }
            }
        }
    };

    return (
    <div>
        {loading ? ( // Render loading indicator if loading state is true
            <CircularProgress style={{ margin: '20px' }} />
        ) : error ? ( 
            <div>Error: {error}</div>
        ) :  (
        <div style={{ color: 'black' }}>
            <br />
            <div className = "team-profile-info">
              <div className="team-profile-row">
                <span className="team-profile-rank-label">Total Events: </span>
                <span className="team-profile-rank-value">{total}</span>
              </div>
              <div className="team-profile-row">
                <span className="team-profile-rank-label"> {getSeasonNameFromId(selectedSeason)} Events </span>
                <span className="team-profile-rank-value">{seasonMap[selectedSeason].length}</span>
              </div>
          </div>
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
            <div className="table">
            <div className="header col small">
            <div className = "header-cell rounded-tl-lg">
            PROGRAM
            </div>
            {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((event, index, array) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                <div className={
                    `${event.program.code || event.program === 'VRC' ? 'vrc' : 
                    event.program.code || event.program === 'VEXU' ? 'vexu' : 
                    event.program.code || event.program === 'VIQRC' ? 'viqrc' : ''}`
                }>
                    {event.program.code || event.program}
                </div>
                </div>
            ))}
            </div>
            <div className="header col big">
            <div className = "header-cell">
                EVENT
            </div>
            {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((event, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                    <Link to={`/events/${event.id}`}>
                    {event.name && event.name}
                    </Link>

                </div>
                ))}
            </div>
            <div className="header col normal">
            <div className = "header-cell">
                LOCATION
            </div>
            {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((event, index) => (
                <div className={`body-cell location ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                    {event.location && (
                        <div>
                            {event.location.city && <span>{event.location.city}, </span>}
                            {event.location.region && <span>{event.location.region}, </span>}
                            {event.location.country}
                        </div>
                    )}
                </div>
                ))}
            </div>
            <div className="header col small">
            <div className = "rounded-tr-lg header-cell" onClick={toggleSortingDirection} style={{ cursor: 'pointer' }}>
                DATE {ascending ? '▲' : '▼'}
            </div>
            {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((event, index, array) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-br-lg rounded-b-none' : ''}`}>
                {event.start && (event.start.substring(0, 10) === event.end?.substring(0, 10)
                    ? event.start.substring(0, 10) : event.start.substring(0, 10) + ' - ' + event.end?.substring(0, 10))}
                </div>
            ))}
            </div>
        </div>
        <br>
        </br>
        <br>
        </br>
        </div>
    )}
    </div>

    );
};

export default EventListDisplay;