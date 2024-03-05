import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import logo from '../Assets/ignite.png';

const Navbar: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const navigate = useNavigate(); // Using useNavigate for navigation
  const dropdownRef = useRef<HTMLDivElement>(null); // Adding the missing dropdownRef declaration

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    handleSearch(event.target.value);
  };

  const handleSearchQuery = () => {
    handleSearch(query);
    setShowDropdown(true);
  };

  const handleSearch = async (searchQuery: string) => {
    try {
      if (searchQuery.length < 1) return;

      const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/search/${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!data.hits) return;

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
          return {
            type: 'event',
            eventId: hit._source.event_id,
            eventName: hit._source.event_name,
            eventStart: hit._source.event_start
          };
        }
        return null;
      }).filter((result: any) => result !== null);

      setSearchResults(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-700 p-4 text-xl">
    <div className="container mx-auto flex justify-between items-center">
      {/* Powered By */}
      <ul className="flex items-center space-x-4">
      <Link to="https://www.igniterobotics.org/" target="_blank" rel="noopener noreferrer">
        <li className="text-white flex items-center transition duration-400 hover:scale-110">
          <span className="text-xl mr-2">Powered By</span>
            <img className="h-8" src={logo} alt="Vex Stats" />
        </li>
        </Link>
      </ul>

      {/* Navigation Links */}
      <ul className="flex space-x-4 mr-auto ml-24">
        <li className="text-white transition duration-400 hover:text-gray-200  hover:scale-110">
          <Link to="/">Home</Link>
        </li>
        <li className="text-white transition duration-400 hover:text-gray-200  hover:scale-110">
          <Link to="/events">Events</Link>
        </li>
        <li className="text-white transition duration-400 hover:text-gray-200 hover:scale-110">
          <Link to="/skills">Skills</Link>
        </li>
        <li className="text-white transition duration-400 hover:text-gray-200  hover:scale-110">
          <Link to="/rankings">Ratings</Link>
        </li>
      </ul>


      {/* Search */}
      <div className="text-white text-xl relative">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search"
          value={query}
          onChange={handleInputChange}
          onClick={handleSearchQuery}
          style={{ backgroundColor: "#f5f5f5" }}
          // MUI TextField styles...
        />

        {showDropdown && (
          <List
            sx={{
              position: 'absolute',
              width: '100%',
              bgcolor: 'background.paper', // This sets the background to the theme's paper color, usually white
              boxShadow: 1,
              borderRadius: '4px',
              zIndex: 1,
              // If you want to change the dropdown background color, adjust bgcolor value. For example, to a light grey: bgcolor: 'grey.100'
            }}
            component="nav"
            aria-labelledby="nested-list-subheader"
          >
            {searchResults.map((result, index) => (
              <ListItem
                key={index}
                onClick={() => {
                  navigate(result.type === 'team' ? `/teams/${result.teamId}` : `/events/${result.eventId}`);
                  setShowDropdown(false);
                }}
              >
                <ListItemText
                  primary={result.type === 'team' ? `${result.teamNumber}: ${result.teamName} | ${result.program}` : `${result.eventName} | ${result.eventStart.substring(0, 10)}`}
                  primaryTypographyProps={{ style: { color: 'black' } }} // Adjust the text color here to ensure visibility against the dropdown's background
                  sx={{ pl: 1 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </div>
    </nav>
  );
};

export default Navbar;
