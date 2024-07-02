import React, { useState, useEffect } from 'react';
import { CircularProgress, Link as MuiLink, Switch } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import MatchBasic2 from '../Lists/Helpers/MatchBasic2';
import { Link } from 'react-router-dom';
import { getSeasonNameFromId } from '../../SeasonEnum';
import '../../Stylesheets/matches.css'

// This component gets all of the matches and displays for a team

interface TeamMatchesProps {
    matches: number[];
    currTeam?: string;
}

interface AllianceData {
    color: string;
    teams: TeamData[];
    score: number;
}

interface TeamInfo {
    name: string;
    id: number;
}

interface TeamData {
    team: TeamInfo;
}

const TeamMatches: React.FC<TeamMatchesProps> = ({ matches, currTeam }) => {
    const [seasonEventsMap, setSeasonEventsMap] = useState<{ [season: number]: { [event_id: number]: any[] } }>({});
    const [selectedSeason, setSelectedSeason] = useState<number>(181);
    const [groupsOf100, setGroupsOf100] = useState<number[][]>([]);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
    const [posts, setPosts] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [showCurrentRankings, setShowCurrentRankings] = useState(true);
    const[wins, setWins] = useState<number>(0);
    const[losses, setLosses] = useState<number>(0);
    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        const groups: number[][] = [];
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };
    
    const toggleRankingsDisplay = () => {
        setShowCurrentRankings(prevState => !prevState);
    };

    // On matches change, split it up into groups of 100
    useEffect(() => {
        if (matches) {
            const uniqueMatches: number[] = Array.from(new Set(matches));
            const groupedIds: number[][] = divideIntoGroups(uniqueMatches, 100);
            setGroupsOf100(groupedIds); 
            setIsFirstUseEffectDone(true);
        } else {
          setLoading(false);
        }
    }, [matches]);

    // Once first effect is done, query for all the matches
    useEffect(() => {
        if (!isFirstUseEffectDone) {
            return;
        }

        const fetchMatchesDetails = async () => {
            if (matches && matches.length > 0) {
                try {
                    setLoading(true);
                    const allEvents: any[] = [];
                    for (let i = 0; i < groupsOf100.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/matches/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(groupsOf100[i])
                        });
                        const data = await response.json();
                        allEvents.push(...data);
                    }
                    const tempSeasonEventsMap: { [season: number]: { [event_name: string]: any[] } } = {};
                    allEvents.forEach(event => {
                        if (event.season !== undefined) {
                            if (!tempSeasonEventsMap[event.season]) {
                                tempSeasonEventsMap[event.season] = {};
                            }
                            if (!tempSeasonEventsMap[event.season][event.event_name]) {
                                tempSeasonEventsMap[event.season][event.event_name] = [];
                            }
                            tempSeasonEventsMap[event.season][event.event_name].push(event);
                        }
                    });
                    setSeasonEventsMap(tempSeasonEventsMap);
                    setWins(calculateTotalWins(tempSeasonEventsMap));
                    setLosses(calculateTotalLosses(tempSeasonEventsMap));
                    setSelectedSeason(Math.max(...Object.keys(tempSeasonEventsMap).map(Number)));
                } catch (error) {
                    console.error('Error fetching match details:');
                } finally {
                    setPosts(false);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchMatchesDetails();
    }, [matches, isFirstUseEffectDone, groupsOf100]); 

    const getTotalMatchCountForSeason = (season: number): number => {
        let totalMatches = 0;
        if (seasonEventsMap[season]) {
            Object.values(seasonEventsMap[season]).forEach(matches => {
                totalMatches += matches.length;
            });
        }
        return totalMatches;
    };
    
    const getTotalWinsForSeason = (season: number): number => {
        let totalWins = 0;
        if (seasonEventsMap[season]) {
            Object.values(seasonEventsMap[season]).forEach(matches => {
                matches.forEach(match => {
                    const { alliances } = match;
                    if (alliances) {
                        const blueAlliance = alliances.find((alliance: AllianceData)=> alliance.color === 'blue');
                        const redAlliance = alliances.find((alliance: AllianceData) => alliance.color === 'red');
                        if (blueAlliance && blueAlliance.score > redAlliance.score && blueAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalWins++;
                        } else if (redAlliance && redAlliance.score > blueAlliance.score && redAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalWins++;
                        }
                    }
                });
            });
        }
        return totalWins;
    };

    const getTotalLossesForSeason = (season: number): number => {
        let totalLosses = 0;
        if (seasonEventsMap[season]) {
            Object.values(seasonEventsMap[season]).forEach(matches => {
                matches.forEach(match => {
                    const { alliances } = match;
                    if (alliances) {
                        const blueAlliance = alliances.find((alliance: AllianceData)=> alliance.color === 'blue');
                        const redAlliance = alliances.find((alliance: AllianceData) => alliance.color === 'red');
                        if (blueAlliance && blueAlliance.score < redAlliance.score && blueAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalLosses++;
                        } else if (redAlliance && redAlliance.score < blueAlliance.score && redAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalLosses++;
                        }
                    }
                });
            });
        }
        return totalLosses;
    };

    const calculateTotalWins = (tempSeasonEventsMap: { [season: number]: { [event_name: string]: any[] } }) => {
        let totalWins = 0;
    
        Object.values(tempSeasonEventsMap).forEach(season => {
            Object.values(season).forEach(matches => {
                matches.forEach(match => {
                    const { alliances } = match;
                    if (alliances) {
                        const blueAlliance = alliances.find((alliance: AllianceData)=> alliance.color === 'blue');
                        const redAlliance = alliances.find((alliance: AllianceData) => alliance.color === 'red');
                        
                        if (blueAlliance && blueAlliance.score > redAlliance.score && blueAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalWins++;
                        } else if (redAlliance && redAlliance.score > blueAlliance.score && redAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalWins++;
                        }
                    }
                });
            });
        });
    
        return totalWins;
    };

    const calculateTotalLosses = (tempSeasonEventsMap: { [season: number]: { [event_name: string]: any[] } }) => {
        let totalLosses = 0;
    
        Object.values(tempSeasonEventsMap).forEach(season => {
            Object.values(season).forEach(matches => {
                matches.forEach(match => {
                    const { alliances } = match;
                    if (alliances) {
                        const blueAlliance = alliances.find((alliance: AllianceData)=> alliance.color === 'blue');
                        const redAlliance = alliances.find((alliance: AllianceData) => alliance.color === 'red');
                        
                        if (blueAlliance && blueAlliance.score < redAlliance.score && blueAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalLosses++;
                        } else if (redAlliance && redAlliance.score < blueAlliance.score && redAlliance.teams.some((team: TeamData) => team.team.id.toString() === currTeam)) {
                            totalLosses++;
                        }
                    }
                });
            });
        });
    
        return totalLosses;
    };

    const getTotalMatches = (): number => {
        let totalMatches = 0;
        Object.values(seasonEventsMap).forEach(season => {
            Object.values(season).forEach(matches => {
                totalMatches += matches.length;
            });
        });
        return totalMatches;
    };

    return (
        <div>
            {loading ? (
                <div className = "loader">
                    <CircularProgress style={{ margin: '20px' }} />
                </div>
            ) : posts ? (
                <div>No matches found</div>
            ) : (
                <div>
                    {showCurrentRankings ? (
                        <div>

                            <div className = "team-profile-subtitle">
                                Team Matches
                            </div>
                            <div className = "team-profile-info">
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label"> Match Count </span>
                                    <span className="team-profile-rank-value">{getTotalMatchCountForSeason(selectedSeason)}</span>
                                    <span className="team-profile-rank-label"> {getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Match Wins</span>
                                    <span className="team-profile-rank-value">{ getTotalWinsForSeason(selectedSeason)}</span>
                                    <span className="team-profile-rank-label">{getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Match Losses</span>
                                    <span className="team-profile-rank-value">{getTotalLossesForSeason(selectedSeason)}</span>
                                    <span className="team-profile-rank-label">{getSeasonNameFromId(selectedSeason)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className = "team-profile-subtitle">
                                Team Matches
                            </div>
                            <div className = "team-profile-info">
                                <div className="team-profile-row">
                                    <span className="team-profile-rank-label">Match Count</span>
                                    <span className="team-profile-rank-value">{getTotalMatches()}</span>
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
                    {/* DropDown */}
                    <div className="flex justify-center">
                        <SeasonDropdown
                            seasonId={selectedSeason}
                            setSeasonId={setSelectedSeason}
                            type=""
                            grade=""
                            restrict={Object.keys(seasonEventsMap)}
                        />
                    </div>
                    <br />

                    {/* Content */}
                    <div className="match">
                        {seasonEventsMap[selectedSeason] &&
                            Object.entries(seasonEventsMap[selectedSeason])
                            .sort(([, matches1], [, matches2]) => {
                                const startTime1 = matches1[0].started ? new Date(matches1[0].started).getTime() : new Date(matches1[0].scheduled).getTime();
                                const startTime2 = matches2[0].started ? new Date(matches2[0].started).getTime() : new Date(matches2[0].scheduled).getTime();
                                return startTime1 - startTime2;
                            })
                            .map(([event_name, matches], eventIndex, eventArray) => (
                                <React.Fragment key={event_name}>
                                    <MuiLink component={Link} to={`/events/${matches[0].event_id}`} underline="hover">
                                        <div className="matchesTitle">{event_name}</div>
                                    </MuiLink>
                                    {matches
                                        .sort((match1, match2) => {
                                        const time1 = match1.started ? new Date(match1.started).getTime() : new Date(match1.scheduled).getTime();
                                        const time2 = match2.started ? new Date(match2.started).getTime() : new Date(match2.scheduled).getTime();
                                        return time1 - time2;
                                        })
                                        .map((match, index) => (
                                        currTeam ? <MatchBasic2 key={index} match={match} teamName={currTeam} /> : <MatchBasic2 key={index} match={match} />
                                        ))}
                                    {eventIndex < eventArray.length - 1 && <div style={{ borderBottom: '3px solid grey', margin: '25px 0' }} />}
                                </React.Fragment>
                            ))}
                    </div>
                    <br />
                    <br />
                </div>
            )}
        </div>
    );
};

export default TeamMatches;
