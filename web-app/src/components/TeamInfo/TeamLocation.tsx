import React from 'react';
import { Box, Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import TeamReveals from "./TeamReveals";
import { getSeasonNameFromId } from '../../SeasonEnum';


interface LocationData {
  venue: string | null;
  country: string;
  city: string;
  address_1: string;
  address_2: string | null;
  region: string;
}

interface Reveals {
  post_date: string;
  reveal_title: string;
  reveal_url: string;
}

interface JSONComponentProps {
  data: {
    awards: number[];
    elo: Record<number, number>;
    elo_rankings: Record<number, number>;
    elo_regional_rankings: Record<number, number>;
    events: number[];
    grade: string;
    id: number;
    location: LocationData;
    matches: number[];
    number: string;
    organization: string;
    program: string;
    rankings: number[];
    region: string;
    registered: string;
    reveals: Reveals[];
    robot_name: string;
    skills: number[];
    skills_rankings: Record<number, { [key: string]: number }>;
    skills_regional_ranking: Record<number, { [key: string]: number }>;
    team_name: string;
  } | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ data }) => {
  if (!data) return null;

  const { location, robot_name, program, registered, organization, reveals, awards, skills_rankings, skills_regional_ranking, elo_rankings, elo_regional_rankings } = data;

  // Function to find the maximum ranking based on robot value
  const findMaxRobotRanking = (rankings: Record<number, { [key: string]: number }>) => {
    let maxRanking = Number.MAX_SAFE_INTEGER;
    let maxSeasonId = -1;

    for (const seasonId in rankings) {
      const robotValue = rankings[seasonId]['robot'];
      if (robotValue < maxRanking) {
        maxRanking = robotValue;
        maxSeasonId = Number(seasonId);
      }
    }
    return { maxRanking, maxSeasonId };
  };

  // Function to find the maximum elo ranking
  const findMaxEloRanking = (rankings: Record<number, number>) => {
    let maxRanking = Number.MAX_SAFE_INTEGER;
    let maxSeasonId = -1;

    for (const seasonId in rankings) {
      const eloValue = rankings[seasonId];
      if (eloValue < maxRanking) {
        maxRanking = eloValue;
        maxSeasonId = Number(seasonId);
      }
    }

    return { maxRanking, maxSeasonId };
  };

  // Extracting max skill ranking based on robot value
  const { maxRanking: maxSkillRanking, maxSeasonId: maxSkillSeasonId } = findMaxRobotRanking(skills_rankings);

  // Extracting max regional skill ranking based on robot value
  const { maxRanking: maxRegionalSkillRanking, maxSeasonId: maxRegionalSkillSeasonId } = findMaxRobotRanking(skills_regional_ranking);

  // Extracting max elo ranking
  const { maxRanking: maxEloRanking, maxSeasonId: maxEloSeasonId } = findMaxEloRanking(elo_rankings);

  // Extracting max elo regional ranking
  const { maxRanking: maxEloRegionalRanking, maxSeasonId: maxEloRegionalSeasonId } = findMaxEloRanking(elo_regional_rankings);

  return (
    <Box mx="auto" bgcolor="#333" color="#fff" p={4} borderRadius={2} boxShadow={3} display="flex" flexDirection="column">
      {/* Location and Info Section */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }}>
        {location && (
          <Box flex={1} mr={{ xs: 0, md: 2 }} p={4} bgcolor="#555" borderRadius={8} boxShadow={3} className="rounded-md shadow-md">
            <Typography variant="body1" color="orange" className="mb-4">
              Location
            </Typography>
            <Typography variant="body2" color="white" className="mb-2">
              {location.city + ',' || ''} {location.region + ',' || ''} {location.country || ''}
            </Typography>
            <Typography variant="body1" color="orange" className="mb-4">
              Info
            </Typography>
            <Typography variant="body2" color="white" className="mb-2">
              Organization: {organization || 'N/A'} <br />
              Robot Name: {robot_name} <br />
              Program: {program || 'N/A'} <br />
              Registered: {registered || 'N/A'} <br />
            </Typography>
          </Box>
        )}
  
        {/* Rankings Section */}
        <Box flex={{ xs: 1, md: 2 }} ml={{ xs: 0, md: 2 }} p={4} bgcolor="#555" borderRadius={8} boxShadow={3} className="rounded-md shadow-md">
          <Typography variant="h6" color="orange" className="mb-4">
            Stats
          </Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '1px'}}>Award Count</td>
                <td style={{ padding: '1px'}}>{awards.length}</td>
                <td style={{ padding: '1px', textAlign: "right"}}></td>
              </tr>
              <tr>
                <td style={{ padding: '1px' }}>Highest Global Skills Rank</td>
                <td style={{ padding: '1px' }}>{maxSkillRanking}</td>
                <td style={{ padding: '1px', textAlign: "right" }}>{maxSkillSeasonId && getSeasonNameFromId(maxSkillSeasonId)}</td>
              </tr>
              <tr>
                <td style={{ padding: '1px' }}>Highest Regional Skills Rank</td>
                <td style={{ padding: '1px' }}>{maxRegionalSkillRanking}</td>
                <td style={{ padding: '1px', textAlign: "right" }}>{maxRegionalSkillSeasonId && getSeasonNameFromId(maxRegionalSkillSeasonId)}</td>
              </tr>
              <tr>
                <td style={{ padding: '1px' }}>Highest Global Elo Rank</td>
                <td style={{ padding: '1px' }}>{maxEloRanking}</td>
                <td style={{ padding: '1px', textAlign: "right" }}>{maxEloSeasonId && getSeasonNameFromId(maxEloSeasonId)}</td>
              </tr>
              <tr>
                <td style={{ padding: '1px' }}>Highest Regional Elo Rank</td>
                <td style={{ padding: '1px' }}>{maxEloRegionalRanking}</td>
                <td style={{ padding: '1px', textAlign: "right"}}>{maxEloRegionalSeasonId && getSeasonNameFromId(maxEloRegionalSeasonId)}</td>
              </tr>
            </tbody>
          </table>
        </Box>
      </Box>
  
      {/* Reveals Section */}
      {reveals && (
        <Box mt={3}>
          <TeamReveals reveals={reveals} />
        </Box>
      )}
    </Box>
  );
  
};

export default JSONComponent;
