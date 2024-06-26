import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import theme from '../../Stylesheets/theme';
import { ThemeProvider } from '@mui/material/styles';
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

    // Divide into a restricted number of rows, based upon items perRow ***
    function chunkArray<T>(array: T[], itemsPerRow: number): T[][] {
        return Array.from({ length: Math.ceil(array.length / itemsPerRow) }, (_, index) =>
            array.slice(index * itemsPerRow, (index + 1) * itemsPerRow)
        );
    }

    return (
        <div>
        <ThemeProvider theme={theme}>
            {championExcellenceAwards.length > 0 && (
                <Box mb={4} style={{ fontSize: '2rem' }}>
                <div className="event-profile-subtitle champion">
                    Champions
                </div>
                <Grid container spacing={2} className="event-profile-info" justifyContent="center">
                    {championExcellenceAwards.map((award) => (
                    <Grid item xs={12} sm={6} md={4} key={award.id} className="event-profile-row" display="flex" flexDirection="column" alignItems="center">
                        <div className="event-profile-label">
                        {award.title && award.title.substring(0, award.title.indexOf('(') - 1)}
                        </div>
                        <Box display="flex" flexDirection="column" alignItems="center">
                        {award.teamWinners && award.teamWinners.map((winner) => (
                            <MuiLink
                                key={winner.team.id}
                                component={RouterLink}
                                to={`/teams/${winner.team.id}`}
                                underline="hover"
                                sx={{ textAlign: 'center' }}
                            >
                                {winner.team.name}
                            </MuiLink>
                        ))}
                        </Box>
                    </Grid>
                    ))}
                </Grid>
                </Box>
            )}

            {otherAwards.length > 0 && (
                <Box mb={4} style={{ fontSize: '2rem' }}>
                <div className="event-profile-subtitle">
                    Awards
                </div>
                <Grid container spacing={2} className="event-profile-info" justifyContent="center">
                    {chunkArray(otherAwards, 2).map((group, groupIndex) => (
                    <Grid item xs={12} sm={6} md={4} key={groupIndex} className="event-profile-row" display="flex" flexDirection="column" alignItems="center">
                        <Grid container spacing={2}>
                        {group.map((award) => (
                            <Grid item xs={12} key={award.id}>
                            <div className="event-profile-label">
                                {award.title && award.title.substring(0, award.title.indexOf('(') - 1)}
                            </div>
                            <Box display="flex" flexDirection="column" alignItems="center">
                                {award.teamWinners && award.teamWinners.map((winner) => (
                                <MuiLink
                                    key={winner.team.id}
                                    component={RouterLink}
                                    to={`/teams/${winner.team.id}`}
                                    underline="hover"
                                    sx={{ textAlign: 'center' }}
                                >
                                    {winner.team.name}
                                </MuiLink>
                                ))}
                            </Box>
                            </Grid>
                        ))}
                        </Grid>
                    </Grid>
                    ))}
                </Grid>
                </Box>
            )}
        </ThemeProvider>
        </div>
    );
};

export default EventAwards;
