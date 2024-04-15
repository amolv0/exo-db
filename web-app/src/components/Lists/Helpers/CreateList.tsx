import React, { useState, useEffect } from 'react';
import '../../../Stylesheets/eventTable.css'
import { Link } from 'react-router-dom';
import { IconButton, CircularProgress } from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';

// This component creates a list based on the given eventIdsString

interface Events {
    eventIdsString: string | null;
}

const EventsList: React.FC<Events> = ({ eventIdsString }) => {
    const [eventsMap, setEventsMap] = useState<any[]>([]);
    const [ascending, setAscending] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [groupsOf25, setGroupsOf25] = useState<number[][]>([]);
    const [size, setSize] = useState<number> (1);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        const groups: number[][] = [];
        setSize(arr.length);
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };

    // Divides the all given event Ids to groups of 25
    useEffect(() => {
        if (eventIdsString) {
            setCurrentPage(1);
            const parsedEventIdsArray: number[] = JSON.parse(eventIdsString);
            const groupedIds: number[][] = divideIntoGroups(parsedEventIdsArray, 25);
            setGroupsOf25(groupedIds); 
            setIsFirstUseEffectDone(true);
        } else {
            setLoading(false);
        }
    }, [eventIdsString]);

    // If the page changes, the firstUseEffect is done, this indicates that we need to update the page
    // And thus we also need to update they query
    useEffect(() => {
        if (!isFirstUseEffectDone) {
            return;
        }
        if (!eventIdsString) {
            setError ("Failed to find valid events");
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/events/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(groupsOf25[currentPage - 1])
                });
                const data = await response.json();
                data.sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());
                setEventsMap(data);
                setError(null);
            } catch (error) {
                setError ("Failed to find valid events");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [currentPage, isFirstUseEffectDone, eventIdsString, groupsOf25]);

    // If the user changes the order of events, display the other way
    useEffect(() => {
        const sortedMaps = [...eventsMap].sort((a, b) => {
            if (ascending) {
                return new Date(a.start).getTime() - new Date(b.start).getTime();
            } else {
                return new Date(b.end).getTime() - new Date(a.end).getTime();
            }
        });
        setEventsMap(sortedMaps);
    }, [ascending, eventsMap]);

    const toggleSortingDirection = () => {
        setAscending((prevAscending) => !prevAscending);
    };

    const handleFirstPage = () => {
        setCurrentPage(1);
    };

    const handleLastPage = () => {
        setCurrentPage(groupsOf25.length);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < groupsOf25.length) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };

    return (
        <div>
            {loading ? (
                <CircularProgress style={{ margin: '20px' }} />
            ) : error ? ( 
                <div>Error: {error}</div>
            ) :  (
                <div>
                    {/* Page selector */}
                    <div style={{ textAlign: 'right' }}>
                        {(currentPage * 25) - 24} - {Math.min(currentPage * 25, size)} of {size}
                        <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
                        <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
                        <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
                        <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
                    </div>

                    {/* Events Table */}
                    <div className="table">
                        <div className="header col small">
                            <div className = "header-cell rounded-tl-lg">
                                PROGRAM
                            </div>
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index, array) => (
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
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index) => (
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
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index) => (
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
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index, array) => (
                                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-br-lg rounded-b-none' : ''}`}>
                                    {event.start && (event.start.substring(0, 10) === event.end?.substring(0, 10)
                                    ? event.start.substring(0, 10) : event.start.substring(0, 10) + ' - ' + event.end?.substring(0, 10))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* EndPage selector */}
                    <div className = "mb-10" style={{ textAlign: 'right' }}>
                      {(currentPage * 25) - 24} - {Math.min(currentPage * 25, size)} of {size}
                      <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
                      <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
                      <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
                      <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsList;