import React, { useState, useEffect } from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { getSeasonNameFromId } from '../../SeasonEnum';

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

const SeasonRanking: React.FC<{ season: string }> = ({ season }) => {
  const [seasonRanking, setSeasonRanking] = useState<SeasonRankingItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1); // Reset page number when season changes
  }, [season]);

  useEffect(() => {
    const fetchSeasonRanking = async () => {
      try {
        const response = await fetch(`https://q898umgq45.execute-api.us-east-1.amazonaws.com/dev/tsranking?season=${season}&page=${currentPage}`);
        if (!response.ok) {
          throw new Error('Failed to fetch season ranking');
        }
        const data = await response.json();
        setSeasonRanking(data.data);
        console.log(data);
      } catch (error) {
        console.error('Error fetching season ranking:', error);
      }
    };

    fetchSeasonRanking();
  }, [season, currentPage]);

  // Calculate the rank based on the current page
  const calculateRank = (index: number) => {
    return (currentPage - 1) * 50 + index + 1;
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  return (
    <Paper elevation={3} style={{ padding: '20px', backgroundColor: '#333', color: '#eee', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h5" gutterBottom style={{ marginBottom: '10px' }}>{getSeasonNameFromId(parseInt(season))} Rankings</Typography>
      <div className="flex" style={{ marginBottom: '10px' }}>
        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous Page</Button>
        <Typography> Page: {currentPage} </Typography>
        <Button onClick={() => handlePageChange(currentPage + 1)}>Next Page</Button>
      </div>
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
                <TableCell align="left">{item.mu}</TableCell>
                <TableCell align="left">{item.sigma}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default SeasonRanking;
