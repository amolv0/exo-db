import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, CircularProgress } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

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

    // Upon receiving new teams, divide into groups of 100 to be able to post
    useEffect(() => {
        if (teams) {
            const groupedIds: number[][] = divideIntoGroups(teams, 100);
            setGroupsOf100(groupedIds); 
            setIsFirstUseEffectDone(true);
        }
    }, [teams]);

    // Upon the firstUseEffect completing, fetch the teamid information from the API, 
    // sort the data and store in teamDetails
    useEffect(() => {
        if (!isFirstUseEffectDone) {
          return;
        }
        const fetchTeamDetails = async () => {
            if (teams && teams.length > 0) {
                try {
                    for (let i = 0; i < groupsOf100.length; i++) {
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/teams/`, {
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
        <div>
            {loading ? (
                <CircularProgress color="inherit" />
            ) : teamDetails.length > 0 ? (
                
                <div className = "p-10">
                    <div className="tableTitleC">Teams List</div>
                    <div className="flex justify-center mx-10">
                        <ThemeProvider theme={theme}>
                            <TableContainer component={Paper} style={{ width: '1100px', overflowX: 'auto', marginBottom: '20px' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                Number
                                            </TableCell>
                                            <TableCell>
                                                Name
                                            </TableCell>
                                            <TableCell>
                                                Organization
                                            </TableCell>
                                            <TableCell>
                                                Location
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {teamDetails && Array.isArray(teamDetails) && teamDetails.map((team, index, array) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Link to={`/teams/${team.id}`} className = "teamBox">{team.number}</Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={`/teams/${team.id}`}>{team.team_name}</Link>
                                                </TableCell>
                                                <TableCell>
                                                    {team.organization}
                                                </TableCell>
                                                <TableCell>
                                                    {team.location?.city}{team.location?.city && team.location?.region ? ', ' : ''}
                                                    {team.location?.region}{team.location?.region && team.location?.country ? ', ' : ''}{team.location?.country}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </ThemeProvider>
                    </div>
                </div>
            ) : (
                <div>
                    No Teams found
                </div>
            )}
        </div>
    );
};

export default JSONComponent;
