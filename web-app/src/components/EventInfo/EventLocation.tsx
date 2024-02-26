import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link } from '@mui/material';

// Define your interfaces here...

interface SeasonData {
  name: string;
  id: number;
  code: string | null;
}

interface LocationData {
  venue: string | null;
  country: string | null;
  city: string | null;
  address_1: string;
  address_2: string | null;
  postcode: string;
  coordinates: { lat: number; lon: number };
  region: string;
}

interface TeamData {
  name: string;
  id: number;
}

interface WinnersData {
  team: TeamData;
}

interface AwardData {
  title: string;
  teamWinners: WinnersData[];
}

interface JSONComponentProps {
  location: LocationData | null;
  season: SeasonData | null;
  program: string | null;
  awards: AwardData[] | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ location, season, program, awards }) => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
      <Box sx={{ m: 2, bgcolor: 'grey.800', color: 'white', p: 2, borderRadius: 2, boxShadow: 3, mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Event Data</Typography>
        {location && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Location</Typography>
            <Typography>Venue: {location.venue || 'N/A'}</Typography>
            <Typography>Country: {location.country || 'N/A'}</Typography>
            <Typography>City: {location.city || 'N/A'}</Typography>
            <Typography>Address: {location.address_1 || 'N/A'}</Typography>
            <Typography>Region: {location.region || 'N/A'}</Typography>
          </Box>
        )}
        {season && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Season</Typography>
            <Typography>{season.name || 'N/A'}</Typography>
          </Box>
        )}
        {program && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Program</Typography>
            <Typography>{program || 'N/A'}</Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ m: 2, bgcolor: 'grey.800', color: 'white', p: 2, borderRadius: 2, boxShadow: 3, mt: 2 }}>
        {awards && awards.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Award Winners</Typography>
            {awards.map((award, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {award.title && award.title.substring(0, award.title.indexOf('('))}
                </Typography>
                <Box sx={{ display: 'flex' }}>
                  {award.teamWinners && award.teamWinners.map((winner, winnerIndex) => (
                    <Box key={winnerIndex} sx={{ mr: 2 }}>
                      <Link component={RouterLink} to={`/teams/${winner.team.id}`} sx={{ color: 'lightblue', '&:hover': { color: 'blue' } }}>
                        {winner.team.name}
                      </Link>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default JSONComponent;
