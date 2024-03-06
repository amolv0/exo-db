import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import EventBasic from './EventBasic';
import { getSeasonNameFromId } from '../../../SeasonEnum';

interface EventListDisplayProps {
  eventIdsString: string | null;
}

const EventSeasonListDisplay: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
  const [maps, setMaps] = useState<any[]>([]);
  const [ascending, setAscending] = useState<boolean>(false); // State to track sorting direction
  const [eventsMap, setEventsMap] = useState<Map<any, any[]>>(new Map());
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

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
        const eventsMapData = new Map();
        data.forEach((event: any) => {
            const seasonId = event.season.id;
            const eventId = event.id;
            if (eventsMapData.has(seasonId)) {
              eventsMapData.get(seasonId).push(eventId);
            } else {
              eventsMapData.set(seasonId, [eventId]);
            }
        });
        setEventsMap(eventsMapData);
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
    <div>
        <br />
        <div className="flex justify-center"> {/* Apply flexbox styles to center */}
            <select
                value={selectedSeason ?? ''}
                onChange={(e) => setSelectedSeason(e.target.value ? parseInt(e.target.value) : null)}
                className="p-2 rounded-md bg-neutral-700 mr-4"
            >
                <option value="">Select Season</option>
                {Array.from(eventsMap.keys()).map(season => (
                    <option key={season} value={season} className="text-white">{getSeasonNameFromId(parseInt(season))}</option>
                ))}
            </select>
        </div>

        <br />
        
        <Box bgcolor="#333" color="#FFFFFF" p={2} borderRadius={4}>
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

        {maps && Array.isArray(maps) && maps
            .filter(event => selectedSeason ? eventsMap.get(selectedSeason)?.includes(event.id) : true)
            .map((event, index) => (
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
    </div>
  );
};

export default EventSeasonListDisplay;
