import React, { useState, useEffect } from 'react';
import EventBasic from './EventBasic';

const App: React.FC = () => {
  const [eventIds, setEventIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the JSON file for ids of recent 10
        const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/events?numberOfEvents=40');
        const result = await response.json();

        // Extract ids and convert them to numbers
        const ids = result.map((event: { id: number }) => event.id);

        setEventIds(ids);
      } catch (error) {
        console.error('Error fetching event IDs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        eventIds.map((eventId) => (
          <EventBasic key={eventId} eventId={eventId} />
        ))
      )}
    </div>
  );
};

export default App;
