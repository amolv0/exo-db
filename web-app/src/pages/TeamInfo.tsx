import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const TeamInfo: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`EXODB_API_GATEWAY_BASE_URL/dev/teams/${teamId}`);
        const data = await response.json();
        setEventData(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      }
    };

    fetchEventData();
  }, [teamId]);

  return (
    <div>
        <p>{JSON.stringify(eventData)}</p>
    </div>
  );
};

export default TeamInfo;
