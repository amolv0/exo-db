import React from 'react';
import { SingleEliminationBracket, Match, SVGViewer } from '@g-loot/react-tournament-brackets';
import { Box, Typography } from '@mui/material';

interface Team {
    id: string;
    name: string;
  }
  
  interface Alliance {
    color: string;
    score: number;
    teams: Team[];
  }
  
  interface Match {
    id: string;
    round: number;
    name: string;
    alliances: Alliance[];
    field?: string; 
    instance?: number; 
    matchnum?: number; 
    scheduled?: string | null;  
    scored?: boolean; 
    session?: number;  
    started?: string;
  }
  
interface Division {
  matches: Match[];
}

interface SVGWrapperProps extends React.SVGProps<SVGSVGElement> {
    children: React.ReactNode; // Explicitly type 'children' as React nodes
  }

  const transformMatchesForBracket = (rawMatches: any[]): any[] => {
    // Use parseMatches to filter and initially format the matches
    const parsedMatches = parseMatches(rawMatches);
  
    // Transform parsed matches into the structure expected by the bracket component
    return parsedMatches.map(match => {
      // Logic to determine the winner, loser, and match state
      const home = match.alliances[0];
      const away = match.alliances[1];
      const homeScore = home.score;
      const awayScore = away.score;
      const homeWin = homeScore > awayScore;
  
      return {
        id: match.id,
        name: match.name,
        nextMatchId: null, // Adjust based on your data
        tournamentRoundText: `Round ${match.round}`, // Customize round text
        startTime: "Unknown", // Provide a default or extract from your data
        state: "DONE", // Adjust based on your match state logic
        participants: [
          {
            id: home.teams[0].id,
            resultText: homeWin ? "WON" : "LOST",
            isWinner: homeWin,
            status: null, // Define status based on your data
            name: home.teams.map(team => team.name).join(' & ')
          },
          {
            id: away.teams[0].id,
            resultText: !homeWin ? "WON" : "LOST",
            isWinner: !homeWin,
            status: null, // Define status based on your data
            name: away.teams.map(team => team.name).join(' & ')
          }
        ]
      };
    });
  };


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
    const transformedMatches = transformMatchesForBracket(division.matches);
  
    const svgWrapper: React.FC<SVGWrapperProps> = ({ children, ...props }) => (
      <SVGViewer width={500} height={500} {...props}>
        {children}
      </SVGViewer>
    );
  
    return (
      <SingleEliminationBracket
        matches={transformedMatches}
        matchComponent={Match}
        svgWrapper={svgWrapper}
      />
    );
  };
export default EventElims;