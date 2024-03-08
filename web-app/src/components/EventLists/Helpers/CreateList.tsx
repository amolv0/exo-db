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
        const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/events/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: eventIdsString
        });
        const data = await response.json();
        console.log(data);
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
    <Box>
      <div className="flex gap-0 justify-center text-xl max-md:flex-wrap">
        <div className="flex flex-col whitespace-nowrap bg-white basis-0">
          <div className="flex-wrap justify-center content-end items-start py-2.5 pr-16 pl-2.5 font-semibold bg-zinc-200 text-neutral-500 max-md:pr-5">
            Program
          </div>
        </div>
        <div className="flex flex-col flex-1 bg-white text-neutral-700 max-md:max-w-full">
          <div className="flex-wrap justify-center content-end items-start py-2.5 pr-16 pl-2.5 font-semibold whitespace-nowrap bg-zinc-200 text-neutral-500 max-md:pr-5 max-md:max-w-full">
            Event
          </div>
        </div>
        <div className="flex flex-col flex-1 bg-white text-neutral-700 max-md:max-w-full">
          <div className="flex-wrap justify-center content-end items-start py-2.5 pr-16 pl-2.5 font-semibold whitespace-nowrap bg-zinc-200 text-neutral-500 max-md:pr-5 max-md:max-w-full">
            Location
          </div>
        </div>
        <div className="flex flex-col flex-1 bg-white text-neutral-700 max-md:max-w-full">
          <div className="flex-wrap justify-center content-end items-start py-2.5 pr-16 pl-2.5 font-semibold whitespace-nowrap bg-zinc-200 text-neutral-500 max-md:pr-5 max-md:max-w-full">
            Date
          </div>
        </div>
      </div>
      {maps && Array.isArray(maps) && maps.map((event, index) => (
        <Box key={event.id} borderTop={index === 0 ? '1px solid #555' : 'none'} borderBottom={index !== maps.length - 1 ? '1px solid #555' : 'none'}>
          <div className="flex gap-0 justify-center text-xl max-md:flex-wrap">
            <div className="flex flex-col flex-1 bg-white text-neutral-700 max-md:max-w-full">
              <div className="flex-wrap justify-center content-center px-2.5 py-5 border-solid border-b-[3px] border-zinc-200 max-md:max-w-full">
                {event.name}
              </div>
            </div>
            <div className="flex flex-col flex-1 font-semibold text-orange-300 bg-white">
              <div className="flex flex-col justify-center py-2.5 pl-2.5 border-solid border-b-[3px] border-zinc-200">
                <div className="flex gap-1.5 py-2.5">
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/a4a77a549905c332600161501e10455be70697e3327d5b80ec7135826b8d68cb?" // This needs to be replaced with our own src for the image
                    className="shrink-0 my-auto w-5 aspect-[0.74] fill-orange-300"
                  />
                  <div className="text-black-500" style={{ flex: 2 }}>
                    {event.location?.city && (<div>{event.location.city}, {event.location.country}</div>)}
                    {!event.location?.city && event.location?.country}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col whitespace-nowrap basis-0 bg-slate-100 text-neutral-700">
              <div className="flex-wrap justify-center content-center px-2.5 py-8 border-solid border-b-[3px] border-zinc-200">
                {event.start && (event.start.substring(0, 10) === event.end?.substring(0, 10) ? event.start.substring(0, 10) : event.start.substring(0, 10) + ' - ' + event.end?.substring(0, 10))}
              </div>
            </div>
          </div>
        </Box>
      ))}
    </Box>
  );
};

export default EventListDisplay;
