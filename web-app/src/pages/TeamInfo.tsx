import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TeamLocation from '../components/TeamInfo/TeamLocation';
import TeamAwards from '../components/TeamInfo/TeamAwards';
import CreateList from '../components/EventLists/Helpers/CreateList';

const TeamInfo: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [teamData, setTeamData] = useState<any>(null);
  const [eventIdsString, setEventIdsString] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true); // State for loading indicator

  useEffect(() => {
    const fetchteamData = async () => {
      try {
        const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/teams/${teamId}`);
        const data = await response.json();
        setTeamData(data);

        if (data && data.length > 0 && data[0].events) {
          setEventIdsString(JSON.stringify(data[0].events));
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
        <div className="max-w-max mx-auto bg-black text-white p-4 rounded-lg shadow-md flex">
          <TeamLocation location={teamData[0].location} org={teamData[0].Orginization} program={teamData[0].program}></TeamLocation>
          <TeamAwards awards={teamData[0].awards}></TeamAwards>
        </div>
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
