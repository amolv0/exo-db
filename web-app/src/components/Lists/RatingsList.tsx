import React, { useState, useEffect } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import '../../Stylesheets/eventTable.css';
import { getSeasonNameFromId } from '../../SeasonEnum';

// This component creates a list of the season rankings

interface RankingsListItem {
    team_name: string;
    season_team: string;
    season: number;
    team_org: string;
    team_number: string;
    mu: number;
    team_id: number;
    region: string;
    sigma: number;
    avg_ccwm: number;
    wins :number;
    losses: number;
    ties:number;
}

const RankingsList: React.FC<{ program:string; season: string; region?: string }> = ({ program, season, region }) => {
    const [seasonRanking, setSeasonRanking] = useState<RankingsListItem[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [lastPage, setLastPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [post, setPost] = useState<boolean>(true);
    const page = 25;

    // This use effect fetches the seasonRanking upon first load, 
    // given the program, season, or region has changed
    useEffect(() => {
        setCurrentPage(1);
        setPost(false);
        if (getSeasonNameFromId(parseInt(season)).includes("VEXU")) {
            if (program !== 'VEXU') {
                return;
            }
        } else {
            if (program === 'VEXU') {
                return ;
            }
        }
        const fetchSeasonRanking = async () => {
            try {
                setLoading(true);
                let apiUrl = `${process.env.REACT_APP_API_URL}/dev/tsranking?season=${season}&page=${1}`;
                if (region) {
                    apiUrl += `&region=${region}`;
                }
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    setError("Failed to find valid rankings leaderboard");
                    throw new Error('Failed to fetch season ranking');
                }
                const data = await response.json();
                setSeasonRanking(data.data);
                setError(null);
            } catch (error) {
                setError("Failed to find valid rankings leaderboard");
                console.error('Error fetching season ranking');
            } finally {
                setLoading(false); // Set loading to false after fetching data
            }
        };

        fetchSeasonRanking();
    }, [program, season, region]);

    // Find the last Page number
    useEffect(() => {

        // Generate the id to determine the last page ***
        const generateId = (): string => {
            return `elo-${season}${region ? `-${region}` : ''}`;
        };

        const fetchLastPage = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/lastpage/${generateId()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch last page');
                }
                const data = await response.json();
                setLastPage(data.lastPage);
            } catch (error) {
                console.error('Error fetching last page');
            }
        };

        fetchLastPage();
    }, [season, region, program]);

    // Load the new page if the page was changed
    useEffect(() => {
        if (!post) {
            return;
        }
        if (getSeasonNameFromId(parseInt(season)).includes("VEXU")) {
            if (program !== 'VEXU') {
                return;
            }
        } else {
            if (program === 'VEXU') {
                return ;
            }
        }
        const fetchSeasonRanking = async () => {
            try {
                setLoading(true); // Set loading to true when fetching data
                let apiUrl = `${process.env.REACT_APP_API_URL}/dev/tsranking?season=${season}&page=${currentPage}`;
                if (region) {
                    apiUrl += `&region=${region}`; // Add region to the API URL if it's provided
                }
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    setError("Failed to find valid rankings leaderboard");
                    throw new Error('Failed to fetch season ranking');
                }
                const data = await response.json();
                setSeasonRanking(data.data);
                setError(null);
            } catch (error) {
                setError("Failed to find valid rankings leaderboard");
                console.error('Error fetching season ranking:');
            } finally {
                setLoading(false);
            }
        };

        fetchSeasonRanking();
    }, [currentPage]);

    // Calculate the rank based on the current page
    const calculateRank = (index: number) => {
        return (currentPage - 1) * page + index + 1;
    };

    const handleFirstPage = () => {
        setPost(true);
        setCurrentPage(1);
    };

    const handleLastPage = () => {
        setPost(true);
        setCurrentPage(lastPage);
    };

    const handlePrevPage = () => {
        setPost(true);
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        setPost(true);
        if (currentPage >= 1 && currentPage < lastPage) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div>
            {loading ? ( // Render loading indicator if loading state is true
                <CircularProgress style={{ margin: '20px' }} />
            ) : error ? ( 
                <div>Error: {error}</div>
            ) : (
                <div>
                  <div className="flex justify-between items-center mt-4">
                        <div className = "tableTitle">
                            {region} {getSeasonNameFromId(parseInt(season))} Rankings
                        </div>
                        <div className = "page">
                            {/* Page selector */}
                            {(currentPage * page) - (page -1)} - {Math.min(currentPage * page, seasonRanking.length + 
                            (currentPage * page) - page)} of {Math.min(lastPage * page, seasonRanking.length + (lastPage * page) - (page))}
                            <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
                            <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
                            <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
                            <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
                        </div>
                    </div>

                  {/* Table */}
                    <div className = "table">
                        <div className="header col rank">
                            <div className = "header-cell rounded-tl-lg">
                                Rank
                            </div>
                            {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index, array) => (
                                <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                                    <div className = "flex justify-center items-center">
                                        {calculateRank(index)}
                                    </div>
                                </div>
                            ))}
                        </div>   
                        <div className="header col team">
                            <div className = "header-cell">
                                Team
                            </div>
                            {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index) => (
                                <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                                    <div>
                                        <Link to={`/teams/${rank.team_id}`} className = "hover:text-blue-200 flex gap-2 items-center justify-center">
                                            <div className = "teamBox"> {rank.team_number} </div>
                                            <div> {rank.team_name} </div>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="header col stat">
                            <div className = "header-cell">
                                W-L-T
                            </div>
                            {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index) => (
                                <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                                    <div>
                                        {rank.wins} - {rank.losses} - {rank.ties}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="header col stat">
                            <div className = "header-cell">
                                Avg CCWM
                            </div>
                            {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index) => (
                                <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                                    <div>
                                        {rank.avg_ccwm && rank.avg_ccwm.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>           
                        <div className="header col stat">
                            <div className = "header-cell">
                                mu
                            </div>
                            {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index) => (
                                <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                                    <div>
                                        {rank.mu.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>       
                    </div>
                    <div className = "flex justify-end items-center mb-10">
                        {(currentPage * page) - (page -1)} - {Math.min(currentPage * page, seasonRanking.length + 
                        (currentPage * page) - page)} of {Math.min(lastPage * page, seasonRanking.length + (lastPage * page) - (page))}
                        <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
                        <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
                        <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
                        <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingsList;
