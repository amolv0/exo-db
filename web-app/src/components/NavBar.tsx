import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    handleSearch(event.target.value.replace(/\s/g, ''));
  };

  const handleSearchQuery = () => {
    // Trigger search
    handleSearch(query.replace(/\s/g, ''));
    setShowDropdown(true); // Show dropdown
  };
  
  const handleSearch = async (searchQuery: string) => {
    try {
      const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/search/${searchQuery}`);
      const data = await response.json();
      if (!data.hits){
        console.log("No hits")
        return;
      }  

      const hits = data.hits.hits;
      const results = hits.map((hit: any) => {
        if (hit._source.team_id !== undefined) {
          return {
            type: 'team',
            teamId: hit._source.team_id,
            teamNumber: hit._source.team_number,
            teamName: hit._source.team_name,
            program: hit._source.program,
            registered: hit._source.team_registered
          };
        } else if (hit._source.event_id !== undefined) {
          // This is event data
          return {
            type: 'event',
            eventId: hit._source.event_id,
            eventName: hit._source.event_name,
            eventStart: hit._source.event_start
          };
        }
        return null;
      }).filter((result: any) => result !== null); // Filter out null values

      setSearchResults(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleClick = (event: MouseEvent) => {
    setShowDropdown(false);
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <nav className="bg-gray-800 p-4 text-xl">
      <div className="container mx-auto flex justify-between items-center">
        <ul className="flex space-x-4">
            <li>
              <div className="text-white text-xl font-bold lg:mr-36">
                <Link to="/">Vex Stats</Link>
              </div>
            </li>
            <li className="text-white">
              <Link to="/">Home</Link>
            </li>
            <li className="text-white">
              <Link to="/teams">Teams</Link>
            </li>
            <li className="text-white">
              <Link to="/events">Events</Link>
            </li>
            <li className="text-white">
              <Link to="/skills">Skills</Link>
            </li>
          </ul>

        <div className="text-white text-xl relative">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={handleInputChange}
            className="px-2 py-1 rounded-md bg-gray-700 text-white focus:outline-none"
            onClick={handleSearchQuery}
          />

          {showDropdown && (
            <div ref={dropdownRef} className="absolute bg-gray-800 mt-2 w-full rounded-md overflow-hidden shadow-md">
              {searchResults.map((result, index) => (
                <Link
                  to={result.type === 'team' ? `/teams/${result.teamId}` : `/events/${result.eventId}`}
                  key={index}
                  className="block px-4 py-2 text-white hover:bg-gray-700"
                >
                  {result.type === 'team' ? (
                    <>
                      {result.teamNumber}: {result.teamName} | {result.program}
                    </>
                  ) : (
                    <>
                      {result.eventName} | {result.eventStart.substring(0, 4)}
                    </>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
