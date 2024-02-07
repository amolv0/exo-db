import React, { useState, useEffect } from 'react';
import EventBasic from './EventBasic';

const App: React.FC = () => {
  const [eventIdsString, setEventIdsString] = useState<string>('');
  const [eventData, setEventData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the JSON file for ids of recent 10
        const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?numberOfEvents=20');
        const result = await response.json();

        // Extract ids and convert them to numbers
        const ids = result.map((event: { id: number }) => event.id);

        // Convert the array of IDs to the desired format
        const formattedIds = JSON.stringify(ids);
        setEventIdsString(formattedIds);
      } catch (error) {
        console.error('Error fetching event IDs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events/', {
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
      {loading ? (
        <p>Loading...</p>
      ) : (
        eventData.map((event: any) => (
          <EventBasic 
            key = {event.id} 
            name= {event.name} 
            eventID = {event.id} 
          />
        ))
      )}
    </div>
  );
};

export default App;
