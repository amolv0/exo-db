import React from 'react';
import { useTheme } from '@mui/material/styles';
import '../../../Stylesheets/matches.css'
import { Typography, Grid, Paper } from '@mui/material';

interface Match {
    scheduled: string;
    started: string;
    matchnum: number;
    round: number;
    field: string;
    name: string;
    alliances: AllianceData[];
}

interface AllianceData {
    color: string;
    teams: TeamData[];
    score: number;
}

interface TeamData {
    team: TeamInfo;
}

interface TeamInfo {
    name: string;
    id: number;
}

const MatchDisplay2: React.FC<{ match: Match, currTeam?: string }> = ({ match, currTeam}) => {
    const theme = useTheme();
    const { name, field, scheduled, started, alliances } = match;
    if (alliances) {
        
    } else {
        return (
            <div></div>
        )
    }
    
    const startTime = started ? new Date(started).toLocaleTimeString() : new Date(scheduled).toLocaleTimeString();

    const blueAlliance = alliances.find(alliance => alliance.color === 'blue')!;
    const redAlliance = alliances.find(alliance => alliance.color === 'red')!;
    
    const blueScore = blueAlliance.score;
    const redScore = redAlliance.score;

    const isBlueWinning = blueScore > redScore;
    const equal = blueScore == redScore;

    let winning = 3;

    if (currTeam) {
        const isRedTeam = redAlliance.teams.some(teamData => teamData.team.id.toString() === currTeam);
        const isBlueTeam = blueAlliance.teams.some(teamData => teamData.team.id.toString() === currTeam);

        if (isRedTeam) {
            winning = redScore > blueScore ? 1 : 0;
        } else if (isBlueTeam) {
            winning = blueScore > redScore ? 1 : 0;
        }
    }

    return (
        <Grid container className="mx-20" component={Paper} elevation={3} alignItems="center">
            <Grid item xs={12} sm={6}>
                <Typography variant="h6">{name}</Typography>
                <Typography variant="body1">Field: {field}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} container justifyContent="center" alignItems="center">
                <Grid container spacing={1}>
                    <Grid item>
                        <Typography variant="body1" style={{ color: winning === 1 ? 'green' : 'red' }}>
                            {redScore}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1" style={{ color: winning === 1 ? '#1876D2' : '#93BAE9' }}>
                            :
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1" style={{ color: winning === 1 ? '#1876D2' : '#93BAE9' }}>
                            {blueScore}
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12} container justifyContent="center">
                <Typography variant="body1">
                    {startTime.split(':').slice(0, 2).join(':') + " " + startTime.substring(startTime.length - 2, startTime.length)}
                </Typography>
                <Typography variant="body1">
                    Status: {started || !equal ? "Completed" : "Not Started"}
                </Typography>
            </Grid>
        </Grid>
    );
};

export default MatchDisplay2;
