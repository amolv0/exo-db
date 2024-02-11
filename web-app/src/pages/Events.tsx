import React from 'react';
import RecentEventsList from '../components/EventLists/RecentEventsList';

const Teams: React.FC = () => {
  console.log("wtf");
  return (
    <div className="flex flex-col items-center">
        <h1 className="text-white text-2xl font-bold mb-4 my-8">Recent Events</h1>
        <RecentEventsList/>
    </div>
  );
};

export default Teams;