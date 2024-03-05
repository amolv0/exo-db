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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Construct the API endpoint URL based on query parameters
        let apiUrl = 'EXODB_API_GATEWAY_BASE_URL/dev/events?';
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
        const formattedIds = JSON.stringify(result);
        setEventIdsString(formattedIds);
        setLoading(false); // Set loading to false after data fetching is complete
      } catch (error) {
        console.error('Error fetching event IDs:', error);
        setLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchData();
  }, [numberOfEvents, programCode, startAfter, startBefore, status, region]);

  return (
    <div>
      {loading ? ( // Display loading indicator if loading is true
        <div>Loading...</div>
      ) : (
        <CreateList eventIdsString={eventIdsString}/>
      )}
    </div>
  );
};

export default App;
