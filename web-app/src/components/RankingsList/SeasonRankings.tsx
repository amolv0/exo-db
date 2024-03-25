import React, { useState, useEffect } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import '../../Stylesheets/rankingsTable.css';
import { getSeasonNameFromId } from '../../SeasonEnum';
import { Grade } from '@mui/icons-material';

interface SeasonRankingItem {
    team_name: string;
    season_team: string;
    season: number;
    team_org: string;
    team_number: string;
    mu: number;
    team_id: number;
    region: string;
    sigma: number;

}

const SeasonRanking: React.FC<{ program:string; season: string; region?: string }> = ({ program, season, region }) => {
  const [seasonRanking, setSeasonRanking] = useState<SeasonRankingItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1); // State to track the last page
  const [loading, setLoading] = useState<boolean>(true); // State to track loading
  const [error, setError] = useState<string | null>(null); // State to track error message
  const page = 25;

  useEffect(() => {
    setCurrentPage(1); // Reset page number when season changes
  }, [program, season, region]);

  useEffect(() => {
    if (getSeasonNameFromId(parseInt(season)).includes("VEXU")) {
      if (program !== 'VEXU') {
        console.log("hi");
        return;
      }
    } else {
      if (program === 'VEXU') {
        console.log("bye");
        return ;
      }
    }
    const fetchSeasonRanking = async () => {
      try {
        setLoading(true); // Set loading to true when fetching data
        let apiUrl = `https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/tsranking?season=${season}&page=${currentPage}`;
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
        console.log(data);
        setError(null);
      } catch (error) {
        setError("Failed to find valid rankings leaderboard");
        console.error('Error fetching season ranking:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching data
      }
    };

    fetchSeasonRanking();
  }, [season, region, currentPage, program]);


  // Generate the query ID based on the provided parameters
  useEffect(() => {
    // Define generateId function inside the useEffect hook
    const generateId = (): string => {
        return `elo-${season}${region ? `-${region}` : ''}`;
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
  }, [season, region, program]);


  // Calculate the rank based on the current page
  const calculateRank = (index: number) => {
    return (currentPage - 1) * page + index + 1;
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
        ) : error ? ( 
          <div>Error: {error}</div>
        ) : (
        <div>
          <div className="flex justify-between items-center mt-4">
            <div className = "tableTitle">
            {region} {getSeasonNameFromId(parseInt(season))} Skills
            </div>
            <div className = "page">
              {(currentPage * page) - (page -1)} - {Math.min(currentPage * page, seasonRanking.length + 
                (currentPage * page) - page)} of {Math.min(lastPage * page, seasonRanking.length + (lastPage * page) - (page))}
              <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
              <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
              <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
              <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
            </div>
          </div>
          <div className = "table">
            <div className="header col rank">
              <div className = "header-cell rounded-tl-lg">
              Rank
              </div>
              {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index, array) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
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
            <div className="header col stat">
              <div className = "header-cell">
                  mu
              </div>
              {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                  <div>
                    {rank.mu}
                  </div>
                </div>
              ))}
            </div> 
            <div className="header col stat">
              <div className = "header-cell">
                  Sigma
              </div>
              {seasonRanking && Array.isArray(seasonRanking) && seasonRanking.map((rank, index) => (
                <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>            
                  <div>
                    {rank.sigma}
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

export default SeasonRanking;
