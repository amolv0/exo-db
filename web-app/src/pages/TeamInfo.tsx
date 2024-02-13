import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TeamLocation from '../components/TeamInfo/TeamLocation';
import CreateList from '../components/EventLists/Helpers/CreateList';

const TeamInfo: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [teamData, setTeamData] = useState<any>(null);
  const [eventIdsString, setEventIdsString] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true); // State for loading indicator

  useEffect(() => {
    const fetchteamData = async () => {
      try {
        const response = await fetch(`EXODB_API_GATEWAY_BASE_URL/dev/teams/${teamId}`);
        const data = await response.json();
        setTeamData(data);

        if (data && data.length > 0 && data[0].events) {
          const eventIds = data[0].events.map((event: any) => String(event.id)); // Convert id to string
          setEventIdsString(JSON.stringify(eventIds));
        }
        setLoading(false); // Set loading state to false when data fetching is completed
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      }
    };
  
    fetchteamData();
  }, [teamId]);

  // Loading indicator while fetching data
  if (loading) {
    return <div className="text-white text-2xl mb-4 mt-8 text-center">Loading...</div>;
  }

  return (
    <div>
      <React.Fragment>
        <h2 className="text-white text-2xl mb-4 mt-8 text-center">{teamData[0].number}: {teamData[0].team_name}</h2>

        <TeamLocation location={teamData[0].location} org={teamData[0].Orginization} program={teamData[0].program}></TeamLocation>
        <div className="text-white text-2xl mb-4 mt-8 text-center">
          Events Attended
          <div className="flex justify-center text-sm">
            <CreateList eventIdsString={eventIdsString}></CreateList>
          </div>
        </div>
      </React.Fragment>
    </div>
  );
};

export default TeamInfo;
