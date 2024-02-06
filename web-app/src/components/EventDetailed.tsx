import React, { useState, useEffect } from 'react';

interface MyComponentProps {
  eventId: number;
}

const MyComponent: React.FC<MyComponentProps> = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events/${eventId}`);
        const eventData = await response.json();
        // Extract the 'name' property
        const name = eventData[0].name;

        console.log('Extracted Name:', name);

        setEventName(name); // Set the 'name' to the state
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p className="text-white text-2m mb-4 my-8">{eventName || 'N/A'}</p>
        </div>
      )}
    </div>
  );
};

export default MyComponent;