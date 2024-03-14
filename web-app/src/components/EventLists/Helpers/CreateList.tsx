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
    <div className="table rounded-lg">
      <div className="header col">
        <div className = "header-cell">
          Program
        </div>
        {maps && Array.isArray(maps) && maps.map((event) => (
          <div className={`body-cell ${event.program === 'VRC' ? 'vrc' : ''}`}>
            {event.program}
          </div>
        ))}
      </div>
      <div className="header col">
        <div className = "header-cell">
          Event
        </div>
        {maps && Array.isArray(maps) && maps.map((event) => (
            <div className = "body-cell">
              <Link to={`/events/${event.eventID}`}>
                {event.name}
              </Link>

            </div>
          ))}
      </div>
      <div className="header col">
        <div className = "header-cell">
          Location
        </div>
        {maps && Array.isArray(maps) && maps.map((event) => (
            <div className = "body-cell">
              {event.location?.city && (<div>{event.location.city}, {event.location.country}</div>)}
              {!event.location?.city && event.location?.country}
            </div>
          ))}
      </div>
      <div className="header col">
        <div className = "header-cell" onClick={toggleSortingDirection} style={{ cursor: 'pointer' }}>
          Date {ascending ? '▲' : '▼'}
        </div>
        {maps && Array.isArray(maps) && maps.map((event) => (
          <div className = "body-cell">
            {event.start && (event.start.substring(0, 10) === event.end?.substring(0, 10)
            ? event.start.substring(0, 10) : event.start.substring(0, 10) + ' - ' + event.end?.substring(0, 10))}
          </div>
        ))}
      </div>
    </div>
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