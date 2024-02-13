import React, { useState, useEffect } from 'react';
import EventBasic from './EventBasic';

interface EventListDisplayProps {
  eventIdsString: string | null;
}

const EventListDisplay: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
  const [eventData, setEventData] = useState<any[]>([]);

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
        setEventData(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      }
    };

    if (eventIdsString) {
      fetchEventData();
    }
  }, [eventIdsString]);

  return (
    <div>
  {/* Header for larger screens */}
  <div className="text-xl font-bold text-gray-50 flex flex-wrap" style={{ width: '100%' }}>
    <div className= "hidden md:block" style={{ flex: 1 }}>Program</div>
    <div style={{ flex: 3 }}>Event</div>
    <div style={{ flex: 2 }}>Location</div>
    <div style={{ flex: 2 }}>Date</div>
  </div>

  {/* Header for smaller screens (invisible) */}
  <div className="text-xl font-bold text-gray-50 invisible flex flex-wrap" style={{ width: '100%' }}>
    <div className = "hidden md:block">Thisissomeweird</div>
    <div className = "hidden md:block">solutionbutitworkthisijustfiller bufferheheIcantwithmyself</div>
    <div className = "hidden md:block">soisitrightorwronglmao</div>
    <div className = "hidden md:block">xdxdxdxdxd</div>
  </div>

  <div>
    {eventData.map((event) => (
      <EventBasic 
        key={event.id} 
        name={event.name} 
        eventID={event.id} 
        program={event.program}
        location={event.location}
        start={event.start}
        end={event.end}
      />
    ))}
  </div>
</div>

  );
};

export default EventListDisplay;
