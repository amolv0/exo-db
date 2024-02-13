import React, { useState, useEffect } from 'react';
import CreateList from './Helpers/CreateList';

const App: React.FC = () => {
  const [eventIdsString, setEventIdsString] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the JSON file for ids of ongoing
        const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/events?status=ongoing');
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
