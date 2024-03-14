import React, { useState, useEffect } from 'react';
import '../../../Stylesheets/table.css'
import { Link } from 'react-router-dom';

interface EventListDisplayProps {
  eventIdsString: string | null;
}

const EventListDisplay: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
  const [maps, setMaps] = useState<any[]>([]);
  const [ascending, setAscending] = useState<boolean>(false); // State to track sorting direction

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/events/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: eventIdsString
        });
        const data = await response.json();
        console.log(data);
        // Sort events by start date
        if (ascending) {
          data.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
        } else {
          data.sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());
        }
        setMaps(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      }
    };

    if (eventIdsString) {
      fetchEventData();
    }
  }, [eventIdsString, ascending]); // Include ascending in the dependency array

  // Function to toggle sorting direction
  const toggleSortingDirection = () => {
    setAscending((prevAscending) => !prevAscending);
  };

  return (
    <table className="table">
      <div className="header col">
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
      <div className="header col">
        <div className = "header-cell">
          EVENT
        </div>
        {maps && Array.isArray(maps) && maps.map((event, index) => (
          <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
              <Link to={`/events/${event.id}`}>
                {event.name}
              </Link>

            </div>
          ))}
      </div>
      <div className="header col">
        <div className = "header-cell">
          LOCATION
        </div>
        {maps && Array.isArray(maps) && maps.map((event, index) => (
          <div className={`body-cell location ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
              {event.location?.city && (<div>{event.location.city}, {event.location.country}</div>)}
              {!event.location?.city && event.location?.country}
            </div>
          ))}
      </div>
      <div className="header col">
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
    </table>
  );
};

export default EventListDisplay;

/*        <div className = "column">
          {maps && Array.isArray(maps) && maps.map((event, index) => (
            <Box key={event.id} borderTop={index === 0 ? '1px solid #555' : 'none'} borderBottom={index !== maps.length - 1 ? '1px solid #555' : 'none'} className="body-cell">
              <EventBasic 
                name={event.name} 
                eventID={event.id}
                prog={event.program.code || event.program}
                location={event.location}
                start={event.start}
                end={event.end}
              />
            </Box>
          ))}
        </div>*/