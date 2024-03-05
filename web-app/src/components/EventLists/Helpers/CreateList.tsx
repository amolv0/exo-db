import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import EventBasic from './EventBasic';

interface EventListDisplayProps {
  eventIdsString: string | null;
}

const EventListDisplay: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
  const [maps, setMaps] = useState<any[]>([]);
  const [ascending, setAscending] = useState<boolean>(false); // State to track sorting direction

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

        // Sort events by start date
        if (ascending) {
          data.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
        } else {
          data.sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());
        }
        setMaps(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      }
    };

    if (eventIdsString) {
      fetchEventData();
    }
  }, [eventIdsString, ascending]); // Include ascending in the dependency array

  // Function to toggle sorting direction
  const toggleSortingDirection = () => {
    setAscending((prevAscending) => !prevAscending);
  };

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
        <Typography variant="subtitle1" flex={2} onClick={toggleSortingDirection} style={{ cursor: 'pointer' }}>
          Date {ascending ? '▲' : '▼'}
        </Typography>
      </Box>

      {maps && Array.isArray(maps) && maps.map((event, index) => (
        <Box key={event.id} borderTop={index === 0 ? '1px solid #555' : 'none'} borderBottom={index !== maps.length - 1 ? '1px solid #555' : 'none'}>
          <EventBasic 
            name={event.name} 
            eventID={event.id}
            prog={event.program.code || event.program}
            location={event.location}
            start={event.start}
            end={event.end}
          />
        </Box>
      ))}
    </Box>
  );
};

export default EventListDisplay;
