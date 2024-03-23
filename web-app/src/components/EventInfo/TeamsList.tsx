import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress } from '@mui/material';
import { group } from 'console';

interface LocationData {
  city: string | null;
  region: string | null;
  country: string | null;
}

interface TeamDetail {
  id: number | null;
  number: string | null;
  team_name: string | null;
  organization: string | null;
  location: LocationData | null;
}

interface JSONComponentProps {
  teams: number[] | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ teams }) => {
  const [teamDetails, setTeamDetails] = useState<TeamDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
  const [groupsOf100, setGroupsOf100] = useState<number[][]>([]);

  const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
      const groups: number[][] = [];
      for (let i = 0; i < arr.length; i += groupSize) {
          groups.push(arr.slice(i, i + groupSize));
      }
      return groups;
  };

  useEffect(() => {
      if (teams) {
          const groupedIds: number[][] = divideIntoGroups(teams, 100);
          setGroupsOf100(groupedIds); 
          setIsFirstUseEffectDone(true);
      }
  }, [teams]);

  useEffect(() => {
    if (!isFirstUseEffectDone) {
      return;
    }
    const fetchTeamDetails = async () => {
      if (teams && teams.length > 0) {
        try {
          for (let i = 0; i < groupsOf100.length; i++) {
            const response = await fetch('EXODB_API_GATEWAY_BASE_URL/dev/teams/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(groupsOf100[i])
            });
            if (response.ok) {
              const data = await response.json();
              teamDetails.push(...data);
            }
          }
          teamDetails.sort((a: TeamDetail, b: TeamDetail) => {
            const numA = parseInt(((a.number && a.number.match(/\d+/)) || ['0'])[0], 10);
            const numB = parseInt(((b.number && b.number.match(/\d+/)) || ['0'])[0], 10);
            return numA - numB;
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teams, isFirstUseEffectDone]);

  return (
    <TableContainer component={Paper} sx={{ mt: 4, bgcolor: 'gray.700' }}>
      {loading ? (
        <CircularProgress color="inherit" />
      ) : teamDetails.length > 0 ? (
        <>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey' }}>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Team Name</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamDetails.map((team, index) => (
                <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Typography sx={{ '& a': { color: 'black', textDecoration: 'none', '&:hover': { opacity: 0.7 } } }}>
                      <Link to={`/teams/${team.id}`}>{team.number}</Link>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ '& a': { color: 'black', textDecoration: 'none', '&:hover': { opacity: 0.7 } } }}>
                      <Link to={`/teams/${team.id}`}>{team.team_name}</Link>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ '& a': { color: 'black', textDecoration: 'none', '&:hover': { opacity: 0.7 } } }}>
                      <Link to={`/teams/${team.id}`}>{team.organization}</Link>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ '& a': { color: 'black', textDecoration: 'none', '&:hover': { opacity: 0.7 } } }}>
                      <Link to={`/teams/${team.id}`}>
                        {team.location?.city}{team.location?.city && team.location?.region ? ', ' : ''}{team.location?.region}{team.location?.region && team.location?.country ? ', ' : ''}{team.location?.country}
                      </Link>
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <Typography variant="h6" component="div" sx={{ p: 2, color: 'white', textAlign: 'center' }}>
          No teams available
        </Typography>
      )}
    </TableContainer>
  );
};

export default JSONComponent;
