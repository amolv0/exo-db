// EventInfo.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const EventInfo: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        console.log(eventId);
        const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events/${eventId}`);
        const data = await response.json();
        setEventData(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {eventData && eventData.length > 0 ? (
            <React.Fragment>
              <h2 className="text-white text-2m mb-4 my-8">Event Details for {eventData[0].name}</h2>
              <p className="text-white text-2m mb-4 my-8">{JSON.stringify(eventData[0])}</p>
            </React.Fragment>
          ) : (
            <p className="text-white text-2m mb-4 my-8">Match not found for Event ID {eventId}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventInfo;
