import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

interface LocationData {
  country: string;
  city: string;
  address_1: string;
  region: string;
}

interface JSONComponentProps {
  location: LocationData | null;
  org: string | null;
  program: string | null;
  registered: string | null;
  robotName: string | null;
}

const JSONComponent: React.FC<JSONComponentProps> = ({ location, org, program, registered, robotName }) => {
  return (
    <Box maxWidth="md" mx="auto" bgcolor="#333" color="#fff" p={4} borderRadius={4} boxShadow={3}>
      <Typography variant="h6" component="h2" fontWeight="bold" mb={4}>
        Team Data
      </Typography>

      <Grid container spacing={2}>
        {location && (
          <Grid item xs={12} sm={6} md={4}> {/* Adjust the sizing here */}
            <Box mb={6}>
              <Typography variant="subtitle1" component="h3" fontWeight="medium" mb={2}>
                Location
              </Typography>
              <Typography variant="body1">
                Country: {location.country || 'N/A'} <br />
                City: {location.city || 'N/A'} <br />
                Address: {location.address_1 || 'N/A'} <br />
                Region: {location.region || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        )}

        {(robotName || program || registered) && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Box mb={6}>
              <Typography variant="subtitle1" component="h3" fontWeight="medium" mb={2}>
                Info
              </Typography>
              <Typography variant="body1">
                Robot Name: {robotName} <br />
                Program: {program || 'N/A'} <br />
                Registered: {registered || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        )}
        {org && (
          <Grid item xs={12} sm={6} md={4}>
            <Box mb={6}>
              <Typography variant="subtitle1" component="h3" fontWeight="medium" mb={2}>
                Organization
              </Typography>
              <Typography variant="body1">{org}</Typography>
            </Box>
          </Grid>
        )}

      </Grid>
    </Box>
  );
};

export default JSONComponent;
