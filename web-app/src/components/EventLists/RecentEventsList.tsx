import React, { useState, useEffect } from 'react';
import CreateList from './Helpers/CreateList';

const App: React.FC = () => {
  const [eventIdsString, setEventIdsString] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the JSON file for ids of recent 10
        const response = await fetch('https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?numberOfEvents=50&program=VRC');
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

  return (
    <CreateList eventIdsString={eventIdsString}/>
  );
};

export default App;
