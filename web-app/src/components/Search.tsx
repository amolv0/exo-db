import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

// Search for whole website

const Search: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Change the query based on input
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
        handleSearch(event.target.value);
    };

    const handleSearchQuery = () => {
        handleSearch(query);
        setShowDropdown(true);
    };

    // While searching, query the results to display
    const handleSearch = async (searchQuery: string) => {
        try {
            if (searchQuery.length < 1) return;

            const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/search/${encodeURIComponent(searchQuery)}`);
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

    const handleClick = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setShowDropdown(false);
        }
    };

    // Listen for exit from the search
    useEffect(() => {
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, []);

    return (
        <div className="text-xl relative">
            {/* Adjust the margin and color as needed */}
            <TextField
                variant="outlined"
                size="small"
                placeholder="Search"
                value={query}
                onChange={handleInputChange}
                onClick={handleSearchQuery}
                style={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "5px"  /* Adjust the value to control the roundness */
                }}
            />
            {showDropdown && (
                <List
                    sx={{
                    position: 'absolute',
                    width: '100%',
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    borderRadius: '4px',
                    zIndex: 1,
                    }}
                    component="nav"
                    aria-labelledby="nested-list-subheader"
                    ref={dropdownRef}
                >
                    {searchResults.map((result, index) => (
                    <ListItem
                        key={index}
                        onClick={() => {
                        navigate(result.type === 'team' ? `/teams/${result.teamId}?activeElement=TeamInfo` : `/events/${result.eventId}`);
                        setShowDropdown(false);
                        }}
                    >
                        <ListItemText
                        primary={result.type === 'team' ? `${result.teamNumber}: ${result.teamName} | ${result.program}` : `${result.eventName} | ${result.eventStart?.substring(0, 10)}`}
                        primaryTypographyProps={{ style: { color: 'black' } }} // Adjust the text color here to ensure visibility against the dropdown's background
                        sx={{ pl: 1 }}
                        />
                    </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
};

export default Search;
