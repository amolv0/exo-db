import React, { useState, useEffect } from 'react';

const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use a relative or path-based URL instead of the full domain
        const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/events?status=ongoing');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
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
        <div>
          {/* Display your data here */}
          {data ? (
            <p>{JSON.stringify(data)}</p>
          ) : (
            <p>No data available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MyComponent;
