import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';

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

const MatchDisplay: React.FC<{ match: Match }> = ({ match }) => {
  const theme = useTheme();
  const { name, field, scheduled, started, alliances } = match;

  const startTime = started ? new Date(started).toLocaleTimeString() : new Date(scheduled).toLocaleTimeString();

  const blueAlliance = alliances.find(alliance => alliance.color === 'blue')!;
  const redAlliance = alliances.find(alliance => alliance.color === 'red')!;
  
  const blueScore = blueAlliance.score;
  const redScore = redAlliance.score;

  // Function to get the background color based on the team's score
  const getBackgroundColor = (color: 'blue' | 'red', isWinning: boolean): string => {
    const opacity = isWinning ? 1 : 0.5; // Faded color for the losing team
    switch (color) {
      case 'blue':
        return `rgba(25, 118, 210, ${opacity})`; // Adjust RGB for blue
      case 'red':
        return `rgba(211, 47, 47, ${opacity})`; // Adjust RGB for red
    }
  };

  const isBlueWinning = blueScore > redScore;

  return (
    <Box sx={{ maxWidth: '6xl', mt: 4, p: 4, bgcolor: 'gray.700', borderRadius: 'lg', display: 'flex', mx: 'auto', color: theme.palette.grey[300] }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>{name}</Typography>
        <Typography sx={{ mb: 2, color: 'text.secondary' }}>Field: {field}</Typography>
        <Typography sx={{ color: 'text.secondary' }}>Start Time: {startTime}</Typography>
      </Box>
      <Paper elevation={3} sx={{ 
          flexGrow: 1, 
          bgcolor: getBackgroundColor('blue', isBlueWinning), 
          p: 2, 
          borderRadius: 'lg', 
          mx: 1,
          color: 'white'
        }}>
        {blueAlliance.teams.map((teamData, index) => (
          <Typography key={index}>{teamData.team.name}</Typography>
        ))}
        <Typography>Score: {blueScore}</Typography>
      </Paper>
      <Paper elevation={3} sx={{ 
          flexGrow: 1, 
          bgcolor: getBackgroundColor('red', !isBlueWinning), 
          p: 2, 
          borderRadius: 'lg', 
          mx: 1,
          color: 'white'
        }}>
        {redAlliance.teams.map((teamData, index) => (
          <Typography key={index}>{teamData.team.name}</Typography>
        ))}
        <Typography>Score: {redScore}</Typography>
      </Paper>
    </Box>
  );
};

export default MatchDisplay;
