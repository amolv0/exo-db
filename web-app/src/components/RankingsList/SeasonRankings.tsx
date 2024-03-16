import React, { useState, useEffect } from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { getSeasonNameFromId } from '../../SeasonEnum';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SkipNextIcon from '@mui/icons-material/SkipNext';

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

const SeasonRanking: React.FC<{ season: string; region?: string }> = ({ season, region }) => {
  const [seasonRanking, setSeasonRanking] = useState<SeasonRankingItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1); // State to track the last page
  const [loading, setLoading] = useState<boolean>(true); // State to track loading

  useEffect(() => {
    setCurrentPage(1); // Reset page number when season changes
  }, [season]);

  useEffect(() => {
    const fetchSeasonRanking = async () => {
      try {
        setLoading(true); // Set loading to true when fetching data
        let apiUrl = `EXODB_API_GATEWAY_BASE_URL/dev/tsranking?season=${season}&page=${currentPage}`;
        if (region) {
          apiUrl += `&region=${region}`; // Add region to the API URL if it's provided
        }
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch season ranking');
        }
        const data = await response.json();
        setSeasonRanking(data.data);
        console.log(data);
      } catch (error) {
        console.error('Error fetching season ranking:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching data
      }
    };

    fetchSeasonRanking();
  }, [season, region, currentPage]);


  // Generate the query ID based on the provided parameters
  useEffect(() => {
    // Define generateId function inside the useEffect hook
    const generateId = (): string => {
        return `elo-${season}${region ? `-${region}` : ''}`;
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
  }, [season, region]);


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
    <Paper elevation={3} style={{ padding: '20px', backgroundColor: '#333', color: '#eee', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h5" gutterBottom style={{ marginBottom: '10px' }}>{getSeasonNameFromId(parseInt(season))} Rankings</Typography>
      <div className="flex" style={{ marginBottom: '10px' }}>
        <IconButton onClick={handleFirstPage}><SkipPreviousIcon /></IconButton>
        <IconButton onClick={handlePrevPage}><NavigateBeforeIcon /></IconButton>
        <span className="mx-1 px-3 py-1 rounded-md bg-gray-200 text-black">{currentPage}</span>
        <IconButton onClick={handleNextPage}><NavigateNextIcon /></IconButton>
        <IconButton onClick={handleLastPage}><SkipNextIcon /></IconButton>
      </div>
      {loading ? ( // Render loading circle if loading state is true
        <CircularProgress style={{ margin: '20px' }} />
      ) : (
        <TableContainer component={Paper} style={{ width: '100%', backgroundColor: '#666' }}>
          <Table aria-label="simple table" size="small">
            <TableHead style={{ backgroundColor: '#999', color: '#eee'}}>
              <TableRow>
                <TableCell align="left" style={{ fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell align="left" style={{ fontWeight: 'bold' }}>Team Name</TableCell>
                <TableCell align="left" style={{ fontWeight: 'bold' }}>Region</TableCell>
                <TableCell align="left" style={{ fontWeight: 'bold' }}>Mu</TableCell>
                <TableCell align="left" style={{ fontWeight: 'bold' }}>Sigma</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {seasonRanking.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{calculateRank(index)}</TableCell>
                  <TableCell align="left">
                      <Link to={`/teams/${item.team_id}`} className = "hover:text-blue-200">
                      {item.team_number}: {item.team_name}
                      </Link>
                  </TableCell>
                  <TableCell align="left">{item.region}</TableCell>
                  <TableCell align="left">{item.mu.toFixed(2)}</TableCell>
                  <TableCell align="left">{item.sigma.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default SeasonRanking;
