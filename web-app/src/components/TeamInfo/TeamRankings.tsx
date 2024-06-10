import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress, Switch, TableSortLabel } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import '../../Stylesheets/eventTable.css';
import { getSeasonNameFromId } from '../../SeasonEnum';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

interface TeamrankingsProps {
    rankings: number[];
}

const Teamrankings: React.FC<TeamrankingsProps> = ({ rankings }) => {
    const [seasonMap, setSeasonMap] = useState<{ [key: number]: any[] }>({});
    const [selectedSeason, setSelectedSeason] = useState<number>(181);
    const [posts, setPosts] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [groupsOf50, setGroupsOf50] = useState<number[][]>([]);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
    const [wins, setWins] = useState<number>(0);
    const [losses, setLosses] = useState<number>(0);
    const [rank, setRank] = useState<number>(0);
    const [showCurrentRankings, setShowCurrentRankings] = useState(true);

    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('rank');

    const toggleRankingsDisplay = () => {
        setShowCurrentRankings(prevState => !prevState);
    };

    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        const groups: number[][] = [];
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };

    useEffect(() => {
        if (rankings) {
            const uniqueRankings = rankings.filter((value, index, self) => {
                return self.indexOf(value) === index;
            });
            const groupedIds: number[][] = divideIntoGroups(uniqueRankings, 50);
            setGroupsOf50(groupedIds); 
            setIsFirstUseEffectDone(true);
        } else {
            setLoading(false);
        }
    }, [rankings]);

    useEffect(() => {
        if (!isFirstUseEffectDone) {
            return;
        }
        const fetchrankingsDetails = async () => {
            if (rankings && rankings.length > 0) {
                try {
                    setLoading(true);
                    const allEvents: any[] = [];
                    for (let i = 0; i < groupsOf50.length; i++) {
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/rankings/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(groupsOf50[i])
                        });
                        const data = await response.json();
                        allEvents.push(...data);
                    }
                    const tempSeasonMap: { [season: number]: any[] } = {};
                    let tempRank = 0;
                    let tempLosses = 0;
                    let tempWins = 0;
                    let size = 0;
                    allEvents.forEach(event => {
                        if (event.season) {
                            if (!tempSeasonMap[event.season]) {
                                tempSeasonMap[event.season] = [];
                            }
                            tempSeasonMap[event.season].push(event);
                            tempRank += event.rank;
                            tempWins += event.wins;
                            tempLosses += event.losses;
                            size++;
                        }
                    });
                    setRank(Math.round(tempRank / size * 10) / 10);
                    setWins(tempWins);
                    setLosses(tempLosses);
                    setSeasonMap(tempSeasonMap);
                    setSelectedSeason(Math.max(...Object.keys(tempSeasonMap).map(Number)));
                } catch (error) {
                    console.error('Error fetching award details:');
                } finally {
                    setPosts(false);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchrankingsDetails();
    }, [rankings, isFirstUseEffectDone, groupsOf50]);

    const calculateWins = (selectedSeason: number) => {
        let totalWins = 0;
        if (seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason])) {
            seasonMap[selectedSeason].forEach(rankings => {
                totalWins += rankings.wins;
            });
        }
        return totalWins;
    };

    const calculateLosses = (selectedSeason: number) => {
        let totalLosses = 0;
        if (seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason])) {
            seasonMap[selectedSeason].forEach(rankings => {
                totalLosses += rankings.losses;
            });
        }
        return totalLosses;
    };

    const averageRank = (selectedSeason: number) => {
        let rank = 0;
        let size = 0;
        if (seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason])) {
            seasonMap[selectedSeason].forEach(rankings => {
                rank += rankings.rank;
                size++;
            });
        }
        return Math.round(rank / size * 10) / 10;
    };

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedRankings = seasonMap[selectedSeason]?.slice().sort((a, b) => {
        if (orderBy === 'rank' || orderBy === 'wins' || orderBy === 'losses' || orderBy === 'average_points' || orderBy === 'total_points' || orderBy === 'opr' || orderBy === 'dpr') {
            return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
        }
        return 0;
    });

    return (
        <div>
            {loading ? (
                <CircularProgress style={{ margin: '20px' }} />
            ) : posts ? (
                <div>No rankings found</div>
            ) : (
                <div>
                    {showCurrentRankings ? (
                        <div>
                            <div className="team-profile-subtitle">
                                {getSeasonNameFromId(selectedSeason)} Rankings
                            </div>
                            <div className="team-profile-info">
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Average Rank</span>
                                    <span className="team-profile-rank-value">{averageRank(selectedSeason)}</span>
                                    <span className="team-profile-rank-label">{getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Match Wins</span>
                                    <span className="team-profile-rank-value">{calculateWins(selectedSeason)}</span>
                                    <span className="team-profile-rank-label">{getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Match Losses</span>
                                    <span className="team-profile-rank-value">{calculateLosses(selectedSeason)}</span>
                                    <span className="team-profile-rank-label">{getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="team-profile-subtitle">
                                All-time Rankings
                            </div>
                            <div className="team-profile-info">
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Average Rank</span>
                                    <span className="team-profile-rank-value">{rank}</span>
                                    <span className="team-profile-rank-label">All Seasons</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Match Wins</span>
                                    <span className="team-profile-rank-value">{wins}</span>
                                    <span className="team-profile-rank-label">All Seasons</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Match Losses</span>
                                    <span className="team-profile-rank-value">{losses}</span>
                                    <span className="team-profile-rank-label">All Seasons</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-center items-center h-full">
                        <Switch
                            checked={!showCurrentRankings}
                            onChange={toggleRankingsDisplay}
                        />
                    </div>
                    <br />
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
                        {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && (
                            <ThemeProvider theme={theme}>
                                <TableContainer component={Paper} style={{ width: '1000px', overflowX: 'auto', marginBottom: '20px' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Event</TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'rank'}
                                                        direction={orderBy === 'rank' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('rank')}
                                                    >
                                                        Rank
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'wins'}
                                                        direction={orderBy === 'wins' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('wins')}
                                                    >
                                                        W-L-T
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'average_points'}
                                                        direction={orderBy === 'average_points' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('average_points')}
                                                    >
                                                        Avg Points
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'total_points'}
                                                        direction={orderBy === 'total_points' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('total_points')}
                                                    >
                                                        Total Points
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'opr'}
                                                        direction={orderBy === 'opr' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('opr')}
                                                    >
                                                        Opr
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'dpr'}
                                                        direction={orderBy === 'dpr' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('dpr')}
                                                    >
                                                        Dpr
                                                    </TableSortLabel>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedRankings.map((rankings, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Link to={`/events/${rankings.event_id}`}>
                                                            {rankings.event_name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{rankings.rank}</TableCell>
                                                    <TableCell>{rankings.wins}-{rankings.losses}-{rankings.ties}</TableCell>
                                                    <TableCell>{rankings.average_points}</TableCell>
                                                    <TableCell>{rankings.total_points}</TableCell>
                                                    <TableCell>{rankings.opr}</TableCell>
                                                    <TableCell>{rankings.dpr}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </ThemeProvider>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teamrankings;
