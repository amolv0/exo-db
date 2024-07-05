import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {  CircularProgress } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import { getSeasonNameFromId } from '../../SeasonEnum';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';
import { Typography, Link as MuiLink } from '@mui/material';

// The component displays all the events of a Team

interface EventListDisplayProps {
    eventIdsString: string | null;
}

const TeamEvents: React.FC<EventListDisplayProps> = ({ eventIdsString }) => {
    const [seasonMap, setMapsBySeason] = useState<{ [key: number]: any[] }>({});
    const [ascending, setAscending] = useState<boolean>(false);
    const [groupsOf25, setGroupsOf25] = useState<number[][]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(181);
    const [total, setTotal] = useState<number>(181);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);


    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        setTotal(arr.length);
        const groups: number[][] = [];
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };

    // If the eventId changes, change the events display / split into groups
    useEffect(() => {
        if (eventIdsString) {
            const parsedEventIdsArray: number[] = JSON.parse(eventIdsString);
            const groupedIds: number[][] = divideIntoGroups(parsedEventIdsArray, 25);
            setGroupsOf25(groupedIds); 
            setIsFirstUseEffectDone(true);
        } else {
            setError ("Failed to find valid events");
            setLoading(false);
        }
    }, [eventIdsString]);

    // Once its split into groups, get the data values
    useEffect(() => {
        if (!isFirstUseEffectDone ) {
            return;
        }
        if (!eventIdsString) {
            setError ("Failed to find valid events");
            setLoading(false);
            return;
        }
        const fetchData = async () => {
        try {
            setLoading(true);
            const allEvents: any[] = [];
            for (let i = 0; i < groupsOf25.length; i++) {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/events/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupsOf25[i])
                });
                const data = await response.json();
                allEvents.push(...data);
            }
            const tempSeasonMap: { [season: number]: any[] } = {};
            allEvents.forEach(event => {
                if (!tempSeasonMap[event.season.id]) {
                    tempSeasonMap[event.season.id] = [];
                }
                tempSeasonMap[event.season.id].push(event);
            });

            for (const season in tempSeasonMap) {
                if (Object.prototype.hasOwnProperty.call(tempSeasonMap, season)) {
                    tempSeasonMap[season].sort((a, b) =>  new Date(b.start).getTime() - new Date(a.start).getTime());
                }
            }
            setMapsBySeason(tempSeasonMap);
            setSelectedSeason(Math.max(...Object.keys(tempSeasonMap).map(Number)));
            setError(null);
            } catch (error) {
                setError ("Failed to find valid events");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [eventIdsString, isFirstUseEffectDone, groupsOf25]);

    const toggleSortingDirection = () => {
        setAscending((prevAscending) => !prevAscending);
        if (ascending) {
            for (const season in seasonMap) {
                if (Object.prototype.hasOwnProperty.call(seasonMap, season)) {
                    seasonMap[season].sort((a, b) =>  new Date(b.start).getTime() - new Date(a.start).getTime());
                }
            }
        } else {
            for (const season in seasonMap) {
                if (Object.prototype.hasOwnProperty.call(seasonMap, season)) {
                    seasonMap[season].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                }
            }
        }
    };

    return (
        <div>
            {loading ? (
                <div className = "loader">
                    <CircularProgress style={{ margin: '20px' }} />
                </div>
            ) : error ? ( 
                <div className = "team-profile-subtitle">
                    Team Events
                </div>
            ) :  (
                <div style={{ color: 'black' }}>
                    <div className = "team-profile-subtitle">
                        Team Events
                    </div>
                    {/* General event info */}
                    <div className = "team-profile-info">
                        <div className="team-profile-row">
                            <span className="team-profile-rank-label">Events Attended</span>
                            <span className="team-profile-rank-value">{total}</span>
                            <span className="team-profile-rank-label">All Seasons</span>
                        </div>
                        <div className="team-profile-row">
                            <span className="team-profile-rank-label"> Events Attended </span>
                            <span className="team-profile-rank-value">{seasonMap[selectedSeason] ? seasonMap[selectedSeason].length : 0}</span>
                            <span className="team-profile-rank-label"> {getSeasonNameFromId(selectedSeason)}  </span>
                            
                        </div>
                    </div>
                    <div className="flex justify-center"> 
                        <SeasonDropdown
                        seasonId={selectedSeason}
                        setSeasonId={setSelectedSeason}
                        type=''
                        grade=''
                        restrict={Object.keys(seasonMap)}
                        />      
                    </div>
                    <br />
                    <div className="flex justify-center mx-10">
                        <ThemeProvider theme={theme}>
                            <TableContainer component={Paper} style={{ width: '1100px', overflowX: 'auto', marginBottom: '20px' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Program</TableCell>
                                            <TableCell>
                                                Event
                                            </TableCell>
                                            <TableCell>
                                                Location
                                            </TableCell>
                                            <TableCell>
                                                Date
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((event, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div
                                                        className="progBox"
                                                        style={{
                                                        backgroundColor: event.program === 'VRC'
                                                            ? 'var(--banner-color)'  // Light gray with 50% opacity
                                                            : event.program === 'VEXU'
                                                            ? 'var(--primary-color)'  // Light gray with 30% opacity
                                                            : event.program === 'VIQRC'
                                                            ? 'var(--orange-color)'  // Light gray with 70% opacity
                                                            : 'rgba(128, 128, 128, 0)'
                                                        }}
                                                    >
                                                        {typeof event.program === 'string' ? event.program : event.program.code || event.program}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <MuiLink component={Link} to={`/events/${event.id}`} underline="hover" className = "flex">
                                                        <Typography>
                                                            {event.name}
                                                        </Typography>
                                                    </MuiLink>
                                                </TableCell>
                                                <TableCell>
                                                    {event.location.city && <span>{event.location.city}, </span>}
                                                    {event.location.region && <span>{event.location.region}, </span>}
                                                    {event.location.country}
                                                </TableCell>
                                                <TableCell>
                                                    {event.start && (event.start.substring(0, 10) === event.end?.substring(0, 10)
                                                    ? event.start.substring(0, 10) : event.start.substring(0, 10) + ' - ' + event.end?.substring(0, 10))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </ThemeProvider>
                    </div>
                </div>
            )}
        </div>

    );
};

export default TeamEvents;