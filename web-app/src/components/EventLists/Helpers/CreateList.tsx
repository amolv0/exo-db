import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import EventBasic from './EventBasic';

interface EventListDisplayProps {
  eventIdsString: string | null;
}

const EventListDisplay: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
  const [maps, setMaps] = useState<any[]>([]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/events/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: eventIdsString
        });
        const data = await response.json();

        // Sort events by start date
        data.sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());

        setMaps(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      }
    };

    if (eventIdsString) {
      fetchEventData();
    }
  }, [eventIdsString]);

  return (
    <Box bgcolor="#333" color="#fff" p={2} borderRadius={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" flex={1}>
          Program
        </Typography>
        <Typography variant="subtitle1" flex={3}>
          Event
        </Typography>
        <Typography variant="subtitle1" flex={2}>
          Location
        </Typography>
        <Typography variant="subtitle1" flex={2}>
          Date
        </Typography>
      </Box>

      {maps && Array.isArray(maps) && maps.map((event) => (
        <EventBasic 
          key={event.id} 
          name={event.name} 
          eventID={event.id}
          prog={event.program.code || event.program}
          location={event.location}
          start={event.start}
          end={event.end}
        />
      ))}
    </Box>
  );
};

export default EventListDisplay;
