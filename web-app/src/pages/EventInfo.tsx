import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventLocation from '../components/EventInfo/EventLocation';
import TeamsList from '../components/EventInfo/TeamsList';
import MatchesList from '../components/EventInfo/MatchesList';
import EventRankings from '../components/EventInfo/EventRankings';

const EventInfo: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeElement, setActiveElement] = useState<string>('EventInfo');

  const handleHeaderClick = (element: string) => {
    setActiveElement(element);
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`EXODB_API_GATEWAY_BASE_URL/dev/events/${eventId}`);
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
        <p className="text-gray-200 text-2xl mb-4 mt-8 text-center">Loading...</p>
      ) : (
        <div>
          {eventData && eventData.length > 0 ? (
            <React.Fragment>
              <h2 className="text-gray-200 text-2xl mb-4 mt-8 text-center">Event Details for {eventData[0].name}</h2>
              
              <div className="max-w-5xl mx-auto bg-gray-800 text-gray-200 p-4 rounded-lg shadow-md">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-600">
                      <th className="py-2 px-4 cursor-pointer" onClick={() => handleHeaderClick('EventInfo')}>Event Info</th>
                      <th className="py-2 px-4 cursor-pointer" onClick={() => handleHeaderClick('TeamsList')}>Teams List</th>
                      <th className="py-2 px-4 cursor-pointer" onClick={() => handleHeaderClick('MatchesList')}>Matches</th>
                      <th className="py-2 px-4 cursor-pointer" onClick={() => handleHeaderClick('Rankings')}>Rankings</th>
                      <th className="py-2 px-4 cursor-pointer" onClick={() => handleHeaderClick('Element4')}>Elims</th>
                      <th className="py-2 px-4 cursor-pointer" onClick={() => handleHeaderClick('Element5')}>Skills</th>
                    </tr>
                  </thead>
                </table>
                {activeElement === 'EventInfo' && <EventLocation 
                    location={eventData[0].location}
                    season={eventData[0].season}
                    program={eventData[0].program}
                    awards={eventData[0].awards}
                />}
                {activeElement === 'TeamsList' && <TeamsList teams={eventData[0].teams}/>}
                {activeElement === 'MatchesList' && <MatchesList division={eventData[0].divisions[0]}/>}
                {activeElement === 'Rankings' && <EventRankings rankings={eventData[0].divisions[0].rankings} />}
                {activeElement === 'Element4' && <Element4 />}
                {activeElement === 'Element5' && <Element5 />}
              </div>
            </React.Fragment>
          ) : (
            <p className="text-gray-200 text-2m mb-4 my-8">Match not found for Event ID {eventId}</p>
          )}
        </div>
      )}
    </div>
  );
};

const Element4: React.FC = () => <div className="mt-4 p-4 bg-gray-100 rounded-lg">Element 5 Content</div>;
const Element5: React.FC = () => <div className="mt-4 p-4 bg-gray-100 rounded-lg">Element 5 Content</div>;

export default EventInfo;
