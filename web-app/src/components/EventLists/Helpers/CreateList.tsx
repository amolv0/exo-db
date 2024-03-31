import React, { useState, useEffect } from 'react';
import '../../../Stylesheets/eventTable.css'
import { Link } from 'react-router-dom';
import { IconButton, CircularProgress } from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';

interface EventListDisplayProps {
  eventIdsString: string | null;
}

const EventListDisplay: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
  const [maps, setMaps] = useState<any[]>([]);
  const [ascending, setAscending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [groupsOf25, setGroupsOf25] = useState<number[][]>([]);
  const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
  const [size, setSize] = useState<number> (1);
  const [error, setError] = useState<string | null>(null); // State to track error message

  const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
    const groups: number[][] = [];
    setSize(arr.length);
    for (let i = 0; i < arr.length; i += groupSize) {
      groups.push(arr.slice(i, i + groupSize));
    }
    return groups;
  };

useEffect(() => {
  if (eventIdsString) {
    setCurrentPage(1);
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
      const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/events/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupsOf25[currentPage - 1])
      });
      const data = await response.json();
      // Sort events by start date
      if (ascending) {
        data.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
      } else {
        data.sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());
      }
      setMaps(data);
      setError(null);
    } catch (error) {
      setError ("Failed to find valid events");
    } finally {
      setLoading(false);
    }
  };

  fetchData();

}, [currentPage, groupsOf25, isFirstUseEffectDone]);

useEffect(() => {
  const sortedMaps = [...maps].sort((a, b) => {
    if (ascending) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    } else {
      return new Date(b.end).getTime() - new Date(a.end).getTime();
    }
  });
  setMaps(sortedMaps);
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
    {loading ? ( // Render loading indicator if loading state is true
        <CircularProgress style={{ margin: '20px' }} />
      ) : error ? ( 
        <div>Error: {error}</div>
      ) :  (
      <div>

          <div style={{ textAlign: 'right' }}>
          {(currentPage * 25) - 24} - {Math.min(currentPage * 25, size)} of {size}
          <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
          <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
          <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
          <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
          </div>
        <div className="table">
        <div className="header col small">
          <div className = "header-cell rounded-tl-lg">
          PROGRAM
          </div>
          {maps && Array.isArray(maps) && maps.map((event, index, array) => (
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
          {maps && Array.isArray(maps) && maps.map((event, index) => (
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
          {maps && Array.isArray(maps) && maps.map((event, index) => (
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
          {maps && Array.isArray(maps) && maps.map((event, index, array) => (
            <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-br-lg rounded-b-none' : ''}`}>
              {event.start && (event.start.substring(0, 10) === event.end?.substring(0, 10)
                ? event.start.substring(0, 10) : event.start.substring(0, 10) + ' - ' + event.end?.substring(0, 10))}
            </div>
          ))}
        </div>
      </div>
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

export default EventListDisplay;