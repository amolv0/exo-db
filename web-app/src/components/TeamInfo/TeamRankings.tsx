import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';
import '../../Stylesheets/eventTable.css'

// Display the historic rankings for each event for a team

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

    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        const groups: number[][] = [];
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };

    // On rankings change, split it up into groups of 50
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

    // Once first effect is done, query for all the rankings
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


    return (
        <div>
            {loading ? ( // Render loading indicator if loading state is true
              <CircularProgress style={{ margin: '20px' }} />
            ) : posts ? (  // no rankings :)
              <div>No rankings found</div>
            ) : (
                <div className="text-black">
                    <div className = "team-profile-subtitle">
                        Team Rankings
                    </div>  
                    <div className = "team-profile-info">
                        <div className="team-profile-row">
                            <span className="team-profile-rank-label">Historic Average Rank</span>
                            <span className="team-profile-rank-value">{rank}</span>
                        </div>
                        <div className="team-profile-row">
                            <span className="team-profile-rank-label">Total Wins</span>
                            <span className="team-profile-rank-value">{wins}</span>
                        </div>
                        <div className="team-profile-row">
                            <span className="team-profile-rank-label">Total Losses</span>
                            <span className="team-profile-rank-value">{losses}</span>
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
                    <div>
                        {seasonMap[selectedSeason] && Array.isArray(seasonMap[selectedSeason]) && seasonMap[selectedSeason].map((rankings, index) => (
                            <div key = {index}>
                                <Link to={`/events/${rankings.event_id}`}>
                                    <div className = 'matchesTitle'>
                                        {rankings.event_name}
                                    </div>
                                </Link>
                                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                                    <div> 
                                        Rank: {rankings.rank}
                                    </div>
                                    <div> 
                                        W-L-T: {rankings.wins}-{rankings.losses}-{rankings.ties}
                                    </div>
                                    <div> 
                                        Avg Points: {rankings.average_points}
                                    </div>
                                    <div>
                                        Total Points: {rankings.total_points}
                                    </div>
                                    <div>
                                        Opr: {rankings.opr}
                                    </div>
                                    <div>
                                        Dpr: {rankings.dpr}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teamrankings;
