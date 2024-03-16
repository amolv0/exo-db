import React, { useState, useEffect } from 'react';
import CreateList from './Helpers/CreateList';

interface AppProps {
  numberOfEvents?: number | null;
  programCode?: string | null;
  startAfter?: string | null;
  startBefore?: string | null;
  status?: string | null;
  region?: string | null;
}

const App: React.FC<AppProps> = ({
  numberOfEvents,
  programCode,
  startAfter,
  startBefore,
  status = 'ongoing',
  region
}) => {
  const [eventIdsString, setEventIdsString] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true); // Introduce loading state
  const [found, setFound] = useState<boolean>(true); // Introduce loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFound(true);
        // Construct the API endpoint URL based on query parameters
        let apiUrl = 'https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events?';
        const queryParams: string[] = [];

        if (numberOfEvents !== null && numberOfEvents !== undefined) queryParams.push(`numberOfEvents=${numberOfEvents}`);
        if (programCode) queryParams.push(`program=${programCode}`);
        if (startAfter) queryParams.push(`start_after=${startAfter}`);
        if (startBefore) queryParams.push(`start_before=${startBefore}`);
        if (status) queryParams.push(`status=${status}`);
        if (region) queryParams.push(`region=${region}`);

        apiUrl += queryParams.join('&');

        // Fetch data using constructed URL
        const response = await fetch(apiUrl);
        const result = await response.json();
        if (result.length === 0 || result.error) {
          setFound(false);
          setLoading(false);
          return;
        }
        const formattedIds = JSON.stringify(result);
        setEventIdsString(formattedIds);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event IDs:', error);
        setFound(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [numberOfEvents, programCode, startAfter, startBefore, status, region]);

  return (
    <div>
      {loading ? ( // Display loading indicator if loading is true
        <div>Loading...</div>
      ) : (
        found ? (
          <CreateList eventIdsString={eventIdsString}/>
        ) : (
          <div> No Events Found </div>
        )
      )}
    </div>
  );
};

export default App;
