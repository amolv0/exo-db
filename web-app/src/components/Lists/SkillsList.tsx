import React, { useState, useEffect } from 'react';
import { CircularProgress, IconButton} from '@mui/material';
import { Link } from 'react-router-dom';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import '../../Stylesheets/eventTable.css';
import { getSeasonNameFromId } from '../../SeasonEnum';

// This component creates a list of the skills rankings

interface SkillsListItem {
    driver_component: number | null;
    event_id: number | null;
    event_name: string | null;
    event_start: string | null;
    event_team_id: string | null;
    program: string | null;
    programming_component: number | null;
    region: string | null;
    score: number | null;
    season: number | null;
    team_grade: string | null;
    team_id: number | null;
    team_name: string | null;
    team_number: string | null;
    team_org: string | null;
}

const SkillsList: React.FC<{ season: string; grade: string; region?: string }> = ({ season, grade, region }) => {
    const [skillsRanking, setSkillsRanking] = useState<SkillsListItem[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [lastPage, setLastPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [post, setPost] = useState<boolean>(true);
    const page = 25;

    // This use effect fetches the seasonRanking upon first load,
    // given the season, region, or grade that  has changed
    useEffect(() => {
        setCurrentPage(1);
        setPost(false);
        if (getSeasonNameFromId(parseInt(season)).includes("VEXU")) {
            if (grade !== 'College') {
                return;
            }
        } else {
            if (grade === 'College') {
                return ;
            }
        }
        const fetchSkillsRanking = async () => {
            try {
                setLoading(true);
                let apiUrl = `${process.env.REACT_APP_API_URL}/dev/skillsranking?season=${season}&grade=${grade}&page=${1}`;
                if (region) {
                    apiUrl += `&region=${region}`;
                }
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    setError("Failed to find valid skills leaderboard");
                    throw new Error('Failed to fetch skills ranking');
                }
                const data = await response.json();
                setSkillsRanking(data);
                setError(null);
            } catch (error) {
                setError("Failed to find valid skills leaderboard");
            } finally {
                setLoading(false);
            }
        };
        fetchSkillsRanking();
    }, [season, region, grade]);
    
    // Find the last Page number
    useEffect(() => {
      const generateId = (): string => {
            let gradeCode = '';
            if (grade.toLowerCase() === 'high school') {
                gradeCode = 'hs';
            } else if (grade.toLowerCase() === 'middle school') {
                gradeCode = 'ms';
            } else {
                gradeCode = 'college';
            }
            return `skills-${season}-robot-${gradeCode}${region ? `-${region}` : ''}`;
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
                console.error('Error fetching last page:');
            }
      };

      fetchLastPage();
    }, [season, region, grade]);

    // Load the new page if the page was changed
    useEffect(() => {
        if (!post) {
            return;
        }
        if (getSeasonNameFromId(parseInt(season)).includes("VEXU")) {
            if (grade !== 'College') {
                return;
            }
        } else {
            if (grade === 'College') {
                return ;
            }
        }
        
        const fetchSkillsRanking = async () => {
            try {
                setLoading(true);
                let apiUrl = `${process.env.REACT_APP_API_URL}/dev/skillsranking?season=${season}&grade=${grade}&page=${currentPage}`;
                if (region) {
                    apiUrl += `&region=${region}`;
                }
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    setError("Failed to find valid skills leaderboard");
                    throw new Error('Failed to fetch skills ranking');
                }
                const data = await response.json();
                setSkillsRanking(data);
                setError(null);
            } catch (error) {
                setError("Failed to find valid skills leaderboard");
            } finally {
                setLoading(false);
            }
        };
        fetchSkillsRanking();
    }, [currentPage]);

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
                <div>No skills found</div>
            ) : (
                <div>
                    <div className = "tableTitle">{region} {getSeasonNameFromId(parseInt(season))} {grade} Skills</div>
                    {/* Page selector */}
                    <div className = "pageSelector">
                        <div className = "pageDisplay">
                            {(currentPage * page) - (page - 1)} - {Math.min(currentPage * page, skillsRanking.length + 
                            (currentPage * page) - (page))} of {Math.min(lastPage * page, skillsRanking.length + (lastPage * page) - (page))}
                        </div>
                        <div>
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
                            {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index, array) => (
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
                            {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index) => (
                                <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                                    <div>
                                        <Link to={`/teams/${rank.team_id}`} className = "hover:text-blue-200 flex gap-2 items-center justify-center">
                                            <div className = "teamBox"> {rank.team_number}</div>
                                            <div> {rank.team_name} </div>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div> 
                        <div className="header col score">
                            <div className = "header-cell">
                                Score
                            </div>
                            {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index) => (
                                <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                                    <div className = "flex gap-2 items-center justify-center">
                                        <div className = "scoreDisplay">
                                            {rank.score}
                                        </div> 
                                        <div>
                                            <div>
                                                (D:{rank.driver_component})
                                            </div>
                                            <div>
                                                (P:{rank.programming_component})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>              
                        <div className = "hide">
                            <div className="header col eventSkillsName">
                                <div className = "header-cell">
                                    Event
                                </div>
                                {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index) => (
                                    <div key = {index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                                        <Link to={`/events/${rank.event_id}`} className = "hover:text-blue-200">
                                            {rank.event_name && rank.event_name}
                                        </Link>
                                    </div>
                                ))}
                            </div>   
                        </div>
                    </div>
                    
                    <div className = "pageSelector mb-10">
                        <div className = "pageDisplay">
                            {(currentPage * page) - (page - 1)} - {Math.min(currentPage * page, skillsRanking.length + 
                            (currentPage * page) - (page))} of {Math.min(lastPage * page, skillsRanking.length + (lastPage * page) - (page))}
                        </div>
                        <div>
                            <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
                            <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
                            <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
                            <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsList;
