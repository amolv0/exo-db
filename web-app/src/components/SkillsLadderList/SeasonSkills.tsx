import React, { useState, useEffect } from 'react';
import { CircularProgress, IconButton} from '@mui/material';
import { Link } from 'react-router-dom';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import '../../Stylesheets/skillsTable.css';

interface SkillsRankingItem {
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

const SkillsRanking: React.FC<{ season: string; grade: string; region?: string }> = ({ season, grade, region }) => {
  const [skillsRanking, setSkillsRanking] = useState<SkillsRankingItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1); // State to track the last page
  const [loading, setLoading] = useState<boolean>(true); // State to track loading

  useEffect(() => {
    setCurrentPage(1); // Reset page number when season changes
  }, [season]);
  
  // Fetch skills ranking when currentPage changes
  useEffect(() => {
    const fetchSkillsRanking = async () => {
      try {
        setLoading(true);
        let apiUrl = `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/skillsranking?season=${season}&grade=${grade}&page=${currentPage}`;
        if (region) {
          apiUrl += `&region=${region}`;
        }
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch skills ranking');
        }
        const data = await response.json();
        setSkillsRanking(data);
      } catch (error) {
        console.error('Error fetching skills ranking:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSkillsRanking();
  }, [season, grade, region, currentPage]);

  useEffect(() => {
    // Define generateId function inside the useEffect hook
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
            const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/lastpage/${generateId()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch last page');
            }
            const data = await response.json();
            setLastPage(data.lastPage);
        } catch (error) {
            console.error('Error fetching last page:', error);
        }
    };

    fetchLastPage();

      // Remove generateId from the dependency array
  }, [season, region, grade]);


  // Calculate the rank based on the current page
  const calculateRank = (index: number) => {
    return (currentPage - 1) * 50 + index + 1;
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(lastPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage >= 1 && currentPage < lastPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
  <div>

    {loading ? ( // Render loading indicator if loading state is true
        <CircularProgress style={{ margin: '20px' }} />
      ) : (
      <div>
        <div className="flex items-center">
          <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
          <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
          <span className="mx-1 px-3 py-1 rounded-md bg-gray-200 text-black">{currentPage}</span>
          <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
          <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
        </div>
        <div className = "table">
          <div className="header col rank">
            <div className = "header-cell rounded-tl-lg">
            Rank
            </div>
            {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index, array) => (
              <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                <div className = "flex justify-center items-center">
                  {calculateRank(index)}
                </div>
              </div>
            ))}
          </div>
          <div className="header col score">
            <div className = "header-cell">
            Score
            </div>
            {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index) => (
              <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                <div className = "flex gap-2 items-center justify-center">
                  <div className = "scoreDisplay">
                    {rank.score}
                  </div> 
                  <div>
                    (D: {rank.driver_component})
                    (P: {rank.programming_component})
                  </div>
                </div>
              </div>
            ))}
          </div>      
          <div className="header col team">
            <div className = "header-cell">
                Team
            </div>
            {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index) => (
              <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                <div>
                  <Link to={`/teams/${rank.team_id}`} className = "hover:text-blue-200 flex gap-2 items-center justify-center">
                    <div className = "teamBox">
                    {rank.team_number}
                    </div>
                    <div> {rank.team_name} </div>
                
                  </Link>
                </div>
              </div>
            ))}
          </div>         
          <div className="header col event">
            <div className = "header-cell">
                Event
            </div>
            {skillsRanking && Array.isArray(skillsRanking) && skillsRanking.map((rank, index) => (
              <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                <div>
                  <Link to={`/events/${rank.event_id}`} className = "hover:text-blue-200">
                            {rank.event_name && rank.event_name}
                  </Link>
                </div>
              </div>
            ))}
          </div>     
        </div>
      </div>
    )}
    </div>
  );
};

export default SkillsRanking;
