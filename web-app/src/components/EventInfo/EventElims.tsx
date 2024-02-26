import React from 'react';
import { Box, Typography } from '@mui/material';

interface Team {
    id: string;
    name: string; // Assuming each team has a name
  }
  
  interface Alliance {
    color: string; // Assuming each alliance has a color
    score: number; // Assuming each alliance has a score
    teams: Team[];
  }
  
  interface Match {
    id: string;
    round: number;
    name: string;
    alliances: Alliance[];
    field?: string;  // Optional
    instance?: number;  // Optional
    matchnum?: number;  // Optional
    scheduled?: string | null;  // Optional
    scored?: boolean;  // Optional
    session?: number;  // Optional
    started?: string;  // Optional
  }
  
interface Division {
  matches: Match[];
}

const parseMatches = (rawMatches: any[]): Match[] => {
    console.log(rawMatches[0]);
    return rawMatches
      .filter(match => match.round >= 3) // Only include elimination rounds
      .map(match => ({
        id: match.id.toString(),
        round: match.round,
        name: match.name,
        alliances: match.alliances.map((alliance: any) => ({
            color: alliance.color,
            score: alliance.score,
            teams: alliance.teams.map((teamObj: any) => ({
              id: teamObj.team.id.toString(),
              name: teamObj.team.name, // Correctly navigate to the team name
            })),
          })),
      }));
  };



const roundLabels: { [key: number]: string } = {
    3: 'Quarter Finals',
    4: 'Semi Finals',
    5: 'Finals',
    6: 'Round of 16',
  };
  
  const getRoundLabel = (round: number): string => roundLabels[round] || `Round ${round}`;



const MatchComponent: React.FC<{ match: Match }> = ({ match }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, border: '1px solid #ddd', borderRadius: '4px' }}>
      {match.alliances.map((alliance, index) => (
        <Box key={index}>
          <Typography sx={{ color: alliance.color === 'blue' ? '#2196f3' : '#f44336' }}>
            {alliance.teams.map(team => team.name).join(' & ')} - {alliance.score}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  const RoundComponent: React.FC<{ matches: Match[] }> = ({ matches }) => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      mx: 1, 
      maxHeight: '400px', // Set a maximum height
      overflowY: 'auto' // Enable scrolling for overflow
    }}>
      <Typography variant="h6">{getRoundLabel(matches[0]?.round)}</Typography>
      {matches.map(match => (
        <MatchComponent key={match.id} match={match} />
      ))}
    </Box>
  );
  
  const EventElims: React.FC<{ division: Division }> = ({ division }) => {
    const matchesByRound = parseMatches(division.matches).reduce((acc, match) => {
      const { round } = match;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {} as { [round: number]: Match[] });
  
    // Move the sorting logic inside the component
    const sortedRounds = Object.keys(matchesByRound)
      .map(Number) // Convert keys to numbers
      .sort((a, b) => b - a); // Sort rounds in descending order, ensuring R16 is on the far left
  
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'nowrap', overflowX: 'auto' }}>
        {sortedRounds.map(round => (
          <RoundComponent key={round} matches={matchesByRound[round]} />
        ))}
      </Box>
    );
  };
export default EventElims;