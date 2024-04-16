import React from 'react';
import { Box, Typography } from '@mui/material';

// Current Bracket code -> Subject to change ***

interface Team {
  sitting: boolean,
  team: {
    id: string,
    name: string
  }
}

interface Alliance {
  color: 'red' | 'blue';
  score: number;
  teams: Team[];
}

interface Match {
  id: string;
  round: number;
  name: string;
  alliances: Alliance[];
}

interface Division {
  matches: Match[];
}

interface Participant {
  id: string;
  resultText: string;
  isWinner: boolean;
  status: string | null;
  name: string;
  color: 'red' | 'blue'; // Add this line
}

interface TransformedMatch {
  id: string;
  name: string;
  nextMatchId: string | null;
  tournamentRoundText: string;
  startTime: string;
  state: string;
  participants: Participant[]; 
}

interface MatchComponentProps {
  match: TransformedMatch;
}

/*
interface MatchProps {
  match: Match;
}

interface BracketProps {
  matches: Match[];
}*/

interface EventElimsProps {
  division: Division;
}

const roundMapping: Record<number, string> = {
  6: "R16",
  3: "Quarterfinals",
  4: "Semifinals",
  5: "Finals",
};

/*
const sortRounds = (a: string, b: string) => {
  const roundOrder = ["R16", "Quarterfinals", "Semifinals", "Finals"];
  return roundOrder.indexOf(a) - roundOrder.indexOf(b);
}; */

const parseMatches = (rawMatches: Match[]): Match[] => {
  // Filter and format matches for elimination rounds
  return rawMatches.filter(match => match.round >= 3);
};

const transformMatchesForBracket = (rawMatches: Match[]): TransformedMatch[] => {
  return parseMatches(rawMatches).map(match => {
    const home = match.alliances[0];
    const away = match.alliances[1];
    const homeScore = home.score;
    const awayScore = away.score;
    const homeWin = homeScore > awayScore;
    const roundName = roundMapping[match.round] || "Unknown Round";
    return {
      id: match.id,
      name: match.name,
      nextMatchId: null, // Adjust based on your data
      tournamentRoundText: roundName,
      startTime: "Unknown", // Provide a default or extract from your data
      state: "DONE", // Adjust based on your match state logic
      participants: home.teams.map(team => ({
        id: team.team.id,
        resultText: homeWin ? "WON" : "LOST",
        isWinner: homeWin,
        status: null,
        name: team.team.name,
        color: home.color, // Assign the color here
      })).concat(away.teams.map(team => ({
        id: team.team.id,
        resultText: !homeWin ? "WON" : "LOST",
        isWinner: !homeWin,
        status: null,
        name: team.team.name,
        color: away.color, // And here
      })))
    };
  });
};



const MatchComponent: React.FC<MatchComponentProps> = ({ match }) => {
  const colorMap: Record<'red' | 'blue', string> = {
      red: 'pink', // Color for the red alliance
      blue: 'lightblue', // Color for the blue alliance
  };

  // Function to create the content for each alliance box with static width
  const renderAlliance = (allianceColor: 'red' | 'blue') => {
      const teams = match.participants.filter(participant => participant.color === allianceColor).map(p => p.name);
      const isWinner = match.participants.some(participant => participant.color === allianceColor && participant.isWinner);

      return (
          <Box
              bgcolor={colorMap[allianceColor]}
              p={1}
              m={1}
              sx={{
                  width: 200, // Static width for each box
                  opacity: isWinner ? 1 : 0.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
              }}
          >
              {/* Team names aligned to the left and right margins */}
              <Typography variant="body1" sx={{ textAlign: 'left', width: '50%' }}>
                  {teams[0]}
              </Typography>
              <Typography variant="body1" sx={{ textAlign: 'right', width: '50%' }}>
                  {teams[1]}
              </Typography>
          </Box>
      );
  };

  return (
      <Box display="flex" flexDirection="column" alignItems="center" marginBottom={4}>
          <Typography variant="h6" component="h2" gutterBottom>

          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center"> {/* Centering the boxes */}
              {renderAlliance('red')}
              {renderAlliance('blue')}
          </Box>
      </Box>
  );
};

const groupMatchesByRound = (matches: TransformedMatch[]): Record<string, TransformedMatch[]> => {
  return matches.reduce((acc, match) => {
    const round = match.tournamentRoundText;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<string, TransformedMatch[]>);
};



const EventElims: React.FC<EventElimsProps> = ({ division }) => {
  const transformedMatches = transformMatchesForBracket(division.matches);
  const matchesByRound = groupMatchesByRound(transformedMatches);

  return (
    // Outer Box for horizontal scrolling
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'center', 
          minWidth: 'max-content', // Ensure the inner content dictates the size
          gap: 4 
        }}
      >
        {["R16", "Quarterfinals", "Semifinals", "Finals"].map((round) => (
          <Box key={round} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 2 }}>{round}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, width: '100%' }}>
              {matchesByRound[round]?.map((match) => (
                <MatchComponent key={match.id} match={match} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};


export default EventElims;