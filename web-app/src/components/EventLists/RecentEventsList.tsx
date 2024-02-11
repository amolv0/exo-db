import React, { useState, useEffect } from 'react';
import CreateList from './Helpers/CreateList';

const App: React.FC = () => {
  const [eventIdsString, setEventIdsString] = useState<string>('');
  const [eventData, setEventData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the JSON file for ids of recent 10
        const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?numberOfEvents=20?program=VRC');
        const result = await response.json();
        // Convert the array of IDs to the desired format
        const formattedIds = JSON.stringify(result);
        setEventIdsString(formattedIds);
      } catch (error) {
        console.error('Error fetching event IDs:', error);
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
    <CreateList eventData={eventData}/>
  );
};

export default App;
