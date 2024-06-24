import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress , Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import { getSeasonNameFromId } from '../../SeasonEnum';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';
import { Typography, Link as MuiLink, TableSortLabel  } from '@mui/material';

// This component gets all of the skills for a team
interface TeamSkillsProps {
    skills: number[];
}

const TeamSkills: React.FC<TeamSkillsProps> = ({ skills }) => {
    const [skillsMap, setSkillsMap] = useState<{ [key: number]: any[] }>({});
    const [selectedSeason, setSelectedSeason] = useState<number>(181);
    const [posts, setPosts] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [groupsOf50, setGroupsOf50] = useState<number[][]>([]);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
    const [showCurrentRankings, setShowCurrentRankings] = useState(true);
    const [rank, setRank] = useState<number>(0);
    const [attempts, setAttempts] = useState<number>(0);

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

    // On skills change, split it up into groups of 50
    useEffect(() => {
        if (skills) {
            const groupedIds: number[][] = divideIntoGroups(skills, 50);
            setGroupsOf50(groupedIds); 
            setIsFirstUseEffectDone(true);
        } else {
            setLoading(false);
        }
    }, [skills]);

    // Once first effect is done, query for all the skills matches
    useEffect(() => {
        if (!isFirstUseEffectDone) {
            return;
        }

        const fetchSkillsDetails = async () => {
            if (skills && skills.length > 0) {
                try {
                    setLoading(true);
                    const allSkills: any[] = [];

                    //console.log(JSON.stringify(groupsOf50[6])); "[46584492,46584493,46584493]" the first two is middle school skills? Skills post error 4610Z
                    for (let i = 0; i < groupsOf50.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/skills/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: (JSON.stringify(groupsOf50[i]))
                        });
                        const data = await response.json();
                        allSkills.push(...data);
                    }   
                    let tempRank = 0;
                    let size = 0;
                    let attemptsTotal = 0;
                    const tempSeasonEventsMap: { [season: number]: { [eventId: number]: any[] } } = {};
                    allSkills.forEach(skill => {
                        if (!tempSeasonEventsMap[skill.season.id]) {
                            tempSeasonEventsMap[skill.season.id] = {};
                        }
                        if (!tempSeasonEventsMap[skill.season.id][skill.event_id]) {
                            tempSeasonEventsMap[skill.season.id][skill.event_id] = [];
                        }
                        tempSeasonEventsMap[skill.season.id][skill.event_id].push(skill);
                        tempRank += skill.rank;
                        attemptsTotal += skill.attempts;
                        size++;
                    });
                    // Temp fix since skills api recoridng every attempt
                    for (const season in tempSeasonEventsMap) {
                        for (const eventId in tempSeasonEventsMap[season]) {
                            const entries = tempSeasonEventsMap[season][eventId];
                            if (entries.length > 2) {
                                const highestDriverEntry = entries
                                    .filter(entry => entry.type === 'driver')
                                    .sort((a, b) => b.score - a.score || a.rank - b.rank)[0];
                                const highestProgrammingEntry = entries
                                    .filter(entry => entry.type === 'programming')
                                    .sort((a, b) => b.score - a.score || a.rank - b.rank)[0];
                                tempSeasonEventsMap[season][eventId] = [
                                    highestDriverEntry,
                                    highestProgrammingEntry,
                                ];
                            }
                        }
                    }

                    const tempSeasonEventsMap2: { [key: number]: any[] } = {};

                    for (const season in tempSeasonEventsMap) {                    
                        for (const eventId in tempSeasonEventsMap[season]) {
                            const entries = tempSeasonEventsMap[season][eventId];
                    
                            if (!tempSeasonEventsMap2[season]) {
                                tempSeasonEventsMap2[season] = [];
                            }

                            const combinedEntry: any = {
                                rank: Math.max(entries[0].rank, entries[1].rank),
                                score: entries[0].score + entries[1].score,
                                driver: entries[1].score,
                                prog: entries[0].score,
                                event_name: entries[0].event_name,
                                event_id: entries[0].event_id,
                            };
                            tempSeasonEventsMap2[season].push(combinedEntry);
                        }
                    }
                    setAttempts(attemptsTotal)
                    setRank(Math.round(tempRank / size * 10) / 10);
                    setSkillsMap(tempSeasonEventsMap2);
                    setSelectedSeason(Math.max(...Object.keys(tempSeasonEventsMap2).map(Number)));
                } catch (error) {
                    console.error('Error fetching skills details:');
                } finally {
                    setPosts(false);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchSkillsDetails();
    }, [skills, isFirstUseEffectDone, groupsOf50]);

    const averageRank = (selectedSeason: number): number => {
        let rankTotal = 0;
        let totalSkills = 0;

        if (skillsMap[selectedSeason] && Array.isArray(skillsMap[selectedSeason])) {
            skillsMap[selectedSeason].forEach(skills => {
                rankTotal += skills.rank;
                totalSkills++;
            });
        }

        if (totalSkills === 0) return 0;
    
        return Math.round((rankTotal / totalSkills) * 10) / 10;
    };

    const maxScore = (selectedSeason: number): number => {
        let maxScore = 0;
    
        if (skillsMap[selectedSeason] && Array.isArray(skillsMap[selectedSeason])) {
            skillsMap[selectedSeason].forEach(skills => {
                const tempScore = skills.score;
                maxScore = Math.max(tempScore, maxScore);
            });
        }
    
        return maxScore;
    };
    
    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedSkills = skillsMap[selectedSeason]?.slice().sort((a, b) => {
        if (orderBy === 'rank' ) {
            return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
        } else if (orderBy === 'score' || orderBy === 'driver' || orderBy === 'prog') {
            return order === 'asc' ? b[orderBy] - a[orderBy] : a[orderBy] - b[orderBy];
        }
        return 0;
    });

    return (
        <div>
            {loading ? ( // Render loading indicator if loading state is true
                <CircularProgress style={{ margin: '20px' }} />
            ) : (posts || Object.keys(skillsMap).length === 0) ? (  // no skills :)
                <div>No skills found :I</div>
            ) : (
                <div className="text-black">
                    {/* General event info */}
                    {showCurrentRankings === true ? (
                        <div>
                            <div className = "team-profile-subtitle">
                                {getSeasonNameFromId(selectedSeason)} Skills
                            </div>
                            <div className = "team-profile-info">
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Average Rank</span>
                                    <span className="team-profile-rank-value">{averageRank(selectedSeason)}</span>
                                    <span className="team-profile-rank-label">{getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label"> Highest Score </span>
                                    <span className="team-profile-rank-value">{maxScore(selectedSeason)}</span>
                                    <span className="team-profile-rank-label">{getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className = "team-profile-subtitle">
                                All-time Skills
                            </div>
                            <div className = "team-profile-info">
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Average Rank</span>
                                    <span className="team-profile-rank-value">{rank}</span>
                                    <span className="team-profile-rank-label">All Seasons</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label"> Total Attempts </span>
                                    <span className="team-profile-rank-value">{attempts}</span>
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
                            restrict={Object.keys(skillsMap)}
                        />      
                    </div>
                    <br />
                    <div className="flex justify-center mx-10">
                        <ThemeProvider theme={theme}>
                            <TableContainer component={Paper} style={{ width: '1000px', overflowX: 'auto', marginBottom: '20px'}}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
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
                                                    active={orderBy === 'score'}
                                                    direction={orderBy === 'score' ? order : 'asc'}
                                                    onClick={() => handleRequestSort('score')}
                                                >
                                                    Combined
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'driver'}
                                                    direction={orderBy === 'driver' ? order : 'asc'}
                                                    onClick={() => handleRequestSort('driver')}
                                                >
                                                    Driver
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                        active={orderBy === 'prog'}
                                                        direction={orderBy === 'prog' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('prog')}
                                                    >
                                                    Prog
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>Event</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sortedSkills.map((skills, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div className="rankBox"> 
                                                        {skills.rank}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{skills.score}</TableCell>
                                                <TableCell>{skills.driver}</TableCell>
                                                <TableCell>{skills.prog}</TableCell>
                                                <TableCell>
                                                    <MuiLink component={Link} to={`/events/${skills.event_id}`} underline="hover" className="flex">
                                                        <Typography>{skills.event_name}</Typography>
                                                    </MuiLink>
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

export default TeamSkills;
