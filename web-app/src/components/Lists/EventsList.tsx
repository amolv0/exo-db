import React, { useState, useEffect } from 'react';
import '../../Stylesheets/eventTable.css'
import { Link } from 'react-router-dom';
import { IconButton, CircularProgress } from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';

// This displays the proper events list given the parameters

interface EventFilter {
    numberOfEvents?: number | null;
    programCode?: string | null;
    startAfter?: string | null;
    startBefore?: string | null;
    status?: string | null;
    region?: string | null;
}

const  EventsList: React.FC<EventFilter> = ({numberOfEvents, programCode, startAfter, startBefore, status = 'ongoing', region}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [eventsMap, setEventsMap] = useState<any[]>([]);
    const [ascending, setAscending] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [groupsOf25, setGroupsOf25] = useState<number[][]>([]);
    const [size, setSize] = useState<number> (1);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);

    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        const groups: number[][] = [];
        setSize(arr.length);
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };

    // Requery information if the query changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                let apiUrl = `${process.env.REACT_APP_API_URL}/dev/events?`;
                const queryParams: string[] = [];

                // Insert the filter quries
                if (numberOfEvents !== null && numberOfEvents !== undefined) queryParams.push(`numberOfEvents=${numberOfEvents}`);
                if (status) queryParams.push(`status=${status}`);
                if (programCode != 'All') queryParams.push(`program=${programCode}`);
                if (startAfter) queryParams.push(`start_after=${startAfter}`);
                if (startBefore) queryParams.push(`start_before=${startBefore}`);
                if (region !== 'All') queryParams.push(`region=${region}`);

                apiUrl += queryParams.join('&')
                // Fetch data using constructed URL
                const response = await fetch(apiUrl);
                const result = await response.json();
                if (result.length === 0 || result.error) {
                    setLoading(false);
                    if (status === 'ongoing') {
                        setError("No ongoing events");
                    } else {
                        setError("No events found")
                    }
                    return;
                }
                const formattedIds = JSON.stringify(result);
                setError(null);
                if (formattedIds) {
                    setCurrentPage(1);
                    const parsedEventIdsArray: number[] = JSON.parse(formattedIds);
                    const groupedIds: number[][] = divideIntoGroups(parsedEventIdsArray, 25);
                    setGroupsOf25(groupedIds); 
                    setIsFirstUseEffectDone(true);
                }
            } catch (error) {
                setError("Failed to find valid events");
                setLoading(false);
            }
        };

        fetchData();
    }, [numberOfEvents, programCode, startAfter, startBefore, status, region]);

    // If the page changes, the firstUseEffect is done, this indicates that we need to update the page
    // And thus we also need to update they query
    useEffect(() => {
        if (!isFirstUseEffectDone) {
            return;
        }
        setLoading(true);
        const fetchData = async () => {
            try {
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

    }, [currentPage, isFirstUseEffectDone, groupsOf25]);

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
    }, [ascending]);

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
            {loading ? ( // Display loading indicator if loading is true
                <CircularProgress style={{ margin: '20px' }} />
            ) : error ? ( 
                <div>{error}</div>
            ) :  (
                <div>
                    <div className="tableTitle">
                        {(region === 'All' && programCode === 'All') && "All Events"}
                        {(region && programCode !== 'All') && `${region} ${programCode} Events`}
                        {(region !== 'All' && programCode === 'All') && `All ${region}  Events`}
                    </div>
                    {/* Page selector */}
                    <div className = "pageSelector">
                        <div className = "pageDisplay">
                            {(currentPage * 25) - 24} - {Math.min(currentPage * 25, size)} of {size}
                        </div>
                        <div>
                            <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
                            <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
                            <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
                            <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
                        </div>
                    </div>

                    {/* Events Table */}
                    <div className="table">
                        <div className="header col eventProgram">
                            <div className = "header-cell rounded-tl-lg">
                                PROGRAM
                            </div>
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index, array) => (
                                <div key={event.id} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
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
                        <div className="header col eventName">
                            <div className = "header-cell">
                                EVENT
                            </div>
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index) => (
                                <div key={event.id} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                                    <Link to={`/events/${event.id}`}>
                                        {event.name && event.name}
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <div className="header col eventLocation">
                            <div className = "header-cell">
                                LOCATION
                            </div>
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index) => (
                                <div key={event.id} className={`body-cell location ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
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
                        <div className="header col date">
                            <div className = "rounded-tr-lg header-cell" onClick={toggleSortingDirection} style={{ cursor: 'pointer' }}>
                                DATE {ascending ? '▲' : '▼'}
                            </div>
                            {eventsMap && Array.isArray(eventsMap) && eventsMap.map((event, index, array) => (
                                <div key={event.id} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-br-lg rounded-b-none' : ''}`}>
                                    {event.start && (event.start.substring(0, 10) === event.end?.substring(0, 10)
                                    ? event.start.substring(0, 10) : event.start.substring(0, 10) + ' - ' + event.end?.substring(0, 10))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* EndPage selector */}
                    <div className = "pageSelector mb-10">
                        <div className = "pageDisplay">
                            {(currentPage * 25) - 24} - {Math.min(currentPage * 25, size)} of {size}
                        </div>
                        <div>
                            <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
                            <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
                            <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
                            <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsList;
