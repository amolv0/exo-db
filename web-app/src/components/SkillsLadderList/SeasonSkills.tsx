import React, { useState, useEffect } from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, IconButton} from '@mui/material';
import { getSeasonNameFromId } from '../../SeasonEnum';
import { Link } from 'react-router-dom';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';

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
        let apiUrl = `EXODB_API_GATEWAY_BASE_URL/dev/skillsranking?season=${season}&grade=${grade}&page=${currentPage}`;
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
            const response = await fetch(`EXODB_API_GATEWAY_BASE_URL/dev/lastpage/${generateId()}`);
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

  const getFirstThreeWords = (name: string): string => {
    const words = name.split(' ');
    return words.slice(0, 3).join(' ');
  };
  
  const getFirstFiveWords = (name: string): string => {
    const words = name.split(' ');
    return words.slice(0, 5).join(' ');
  };

  return (
    <Paper elevation={3} style={{ padding: '20px', backgroundColor: '#333', color: '#eee', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="body1" style={{ marginBottom: '10px' }}>{getSeasonNameFromId(parseInt(season))}</Typography>
      {loading ? ( // Render loading indicator if loading state is true
        <CircularProgress style={{ margin: '20px' }} />
      ) : (
        <>
        <div className="flex items-center">
          <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
          <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
          <span className="mx-1 px-3 py-1 rounded-md bg-gray-200 text-black">{currentPage}</span>
          <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
          <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
        </div>

          <TableContainer component={Paper} style={{ width: '100%', backgroundColor: '#666'} }>
            <Table aria-label="simple table" size="small">
              <TableHead style={{ backgroundColor: '#999', color: '#eee'}}>
                <TableRow >
                  <TableCell align="left" style={{ fontWeight: 'bold' }}>Rank</TableCell>
                  <TableCell align="left" style={{ fontWeight: 'bold' }}>Score</TableCell>
                  <TableCell align="left" style={{ fontWeight: 'bold' }}>Team Number</TableCell>
                  <TableCell align="left" style={{ fontWeight: 'bold' }}>Event</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {skillsRanking.map((rank, index) => (
                  <TableRow key={rank.team_id}>
                    <TableCell>{calculateRank(index)}</TableCell>
                    <TableCell align="left">  
                      <div>
                        <span>{rank.score}</span> {/* Displaying the score */}
                        {rank.driver_component !== null && ( // Displaying driver_component if it exists
                          <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '0.5em' }}>
                            (D: {rank.driver_component})
                          </span>
                        )}
                        {rank.programming_component !== null && ( // Displaying programming_component if it exists
                          <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '0.5em' }}>
                            (P: {rank.programming_component})
                          </span>
                        )}
                      </div></TableCell>
                    <TableCell align="left">
                      <Link to={`/teams/${rank.team_id}`} className = "hover:text-blue-200">
                        {rank.team_number}: {rank.team_name && getFirstThreeWords(rank.team_name)}                
                      </Link>
                    </TableCell>
                    <TableCell align="left">
                      <Link to={`/teams/${rank.event_id}`} className = "hover:text-blue-200">
                        {rank.event_name && getFirstFiveWords(rank.event_name)}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
};

export default SkillsRanking;
