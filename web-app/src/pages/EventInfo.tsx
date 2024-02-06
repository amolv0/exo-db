import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventLocation from '../components/EventInfo/EventLocation';
import TeamsList from '../components/EventInfo/TeamsList';

const EventInfo: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/events/${eventId}`);
        const data = await response.json();
        setEventData(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {eventData && eventData.length > 0 ? (
            <React.Fragment>
              <h2 className="text-white text-2xl mb-4 mt-8 text-center">Event Details for {eventData[0].name}</h2>

              <div className = "flex flex-nowrap">
                <EventLocation 
                  location = {eventData[0].location}
                  season= {eventData[0].season}
                  name = {eventData[0].name}
                  program = {eventData[0].program}
                />
                <TeamsList 
                  teams = {eventData[0].teams}
                />
              </div>

            </React.Fragment>
          ) : (
            <p className="text-white text-2m mb-4 my-8">Match not found for Event ID {eventId}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventInfo;
