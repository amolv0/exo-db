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
      default:
        return '';
    }
  };

  const isBlueWinning = blueScore > redScore;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center', // Align items vertically in the center
        maxWidth: '6xl',
        mt: 4,
        bgcolor: 'gray.700',
        borderRadius: 'lg',
        mx: 'auto',
        mb: '-20px',
        color: theme.palette.grey[300],
        lineHeight: 2, // Set line height to 1 for single-line height
        height: 'auto', // Set height to auto
        overflow: 'hidden', // Hide overflow to ensure single-line height
      }}
    >
      <Typography
        sx={{ fontWeight: 'bold', mr: 2, color: 'text.primary', display: 'inline', width: '120px' }} // Set fixed width for name
      >
        {name}
      </Typography>
      <Typography sx={{ mr: 2, color: 'text.secondary', display: 'inline', width: '100px' }}> {/* Set fixed width for field */}
        Field: {field}
      </Typography>
      <Typography sx={{ mr: 2, color: 'text.secondary', display: 'inline', width: '120px' }}> {/* Set fixed width for start time */}
        {startTime}
      </Typography>
      <Paper
        elevation={3}
        sx={{
          bgcolor: getBackgroundColor('blue', isBlueWinning),
          p: 1,
          borderRadius: 'lg',
          mx: 1,
          color: 'white',
          whiteSpace: 'nowrap',
          display: 'inline',
          width: '200px' // Set fixed width for team name and score container
        }}
      >
        {blueAlliance.teams.map((teamData, index) => (
          <Typography
            key={index}
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline', width: '100px' }} // Set fixed width for team name
          >
            {teamData.team.name + " "}
          </Typography>
        ))}
        <Typography sx={{ display: 'inline', width: '50px' }}>{blueScore}</Typography> {/* Set fixed width for score */}
      </Paper>
      <Paper
        elevation={3}
        sx={{
          bgcolor: getBackgroundColor('red', !isBlueWinning),
          p: 1,
          borderRadius: 'lg',
          mx: 1,
          color: 'white',
          whiteSpace: 'nowrap',
          display: 'inline',
          width: '200px' // Set fixed width for team name and score container
        }}
      >
        {redAlliance.teams.map((teamData, index) => (
          <Typography key={index} sx={{ display: 'inline', width: '100px' }}> {/* Set fixed width for team name */}
            {teamData.team.name + " "}
          </Typography>
        ))}
        <Typography sx={{ display: 'inline', width: '50px' }}>{redScore}</Typography> {/* Set fixed width for score */}
      </Paper>
    </Box>
  );
};

export default MatchDisplay;
