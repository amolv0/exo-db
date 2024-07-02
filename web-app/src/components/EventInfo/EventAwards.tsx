import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import theme from '../../Stylesheets/theme';
import { ThemeProvider } from '@mui/material/styles';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
  } from '@mui/material';
// This class displays the EventAwards, set as the "default" page for events

interface AwardWinner {
    team: {
        id: string;
        name: string;
    };
}

interface Award {
    id: string;
    title: string;
    teamWinners?: AwardWinner[];
}

interface EventData {
    location?: string;
    season?: string;
    program?: string;
    awards?: Award[];
}

const EventAwards: React.FC<EventData> = ({ awards }) => {

    // Get all Champion / excellence awards
    const championExcellenceAwards = (awards ?? []).filter((award) =>
        award.title?.includes('Champion') || award.title?.includes('Excellence')
    );

    // Get the rest of the awards, - Volunteer of the year award ( minimal data)
    const otherAwards = (awards ?? []).filter((award) =>
        !award.title?.includes('Champion') && !award.title?.includes('Excellence')
        && award.title?.includes('Award') && !award.title?.includes('Volunteer')
    );

    const allAwards = [...championExcellenceAwards, ...otherAwards];

    return (
        <div>
            <div className="tableTitleC">
                Event Awards
            </div>
                <ThemeProvider theme={theme}>
                    {allAwards.length > 0 && (
                        <Box mb={4} style={{ display: 'flex', justifyContent: 'center' }}>
                            <TableContainer component={Paper} style={{ maxWidth: '600px', width: '100%' }}>
                                <Table>
                                <TableHead>
                                    <TableRow>
                                    <TableCell style={{ width: '65%' }}>Award Title</TableCell>
                                    <TableCell style={{ width: '35%' }}>Team</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allAwards.map((award) => (
                                    <TableRow key={award.id}>
                                        <TableCell
                                            style={{fontSize: '.8rem'}}>
                                        {award.title && award.title.substring(0, award.title.indexOf('(') - 1)}
                                        </TableCell>
                                        <TableCell>
                                        {award.teamWinners && award.teamWinners.map((winner) => (
                                            <MuiLink
                                            key={winner.team.id}
                                            component={RouterLink}
                                            to={`/teams/${winner.team.id}`}
                                            underline="hover"
                                            style={{fontSize: '.8rem', display:'flex'}}
                                            >
                                                {winner.team.name + "  "} 
                                            </MuiLink>
                                        ))}
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </ThemeProvider>
                <br>
                </br>
        </div>
    );
};

export default EventAwards;
