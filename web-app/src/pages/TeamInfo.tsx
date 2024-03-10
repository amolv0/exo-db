import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TeamLocation from '../components/TeamInfo/TeamLocation';
import TeamAwards from '../components/TeamInfo/TeamAwards';
import CreateList from '../components/EventLists/Helpers/CreateDropDownList';
import { Box, Typography, Button, ButtonGroup, CircularProgress } from '@mui/material';

const TeamInfo: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const [teamData, setTeamData] = useState<any>(null);
  const [eventIdsString, setEventIdsString] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeElement, setActiveElement] = useState<string>('TeamInfo');

  const navigate = useNavigate();

  const handleHeaderClick = (element: string) => {
    setActiveElement(element);
    if (teamData && teamData[0] && teamData[0].id) {
      const newUrl = `/teams/${teamData[0].id}?activeElement=${element}`;
      navigate(newUrl, { replace: true, state: { activeElement: element } }); // Pass the state along with the URL
    }
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch(`EXODB_API_GATEWAY_BASE_URL/dev/teams/${teamId}`);
        const data = await response.json();
        setTeamData(data);
        if (data && data.length > 0 && data[0].events) {
          setEventIdsString(JSON.stringify(data[0].events));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      }
    };

    fetchTeamData();
  }, [teamId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const prevActiveElement = searchParams.get('activeElement');
    if (prevActiveElement) {
      setActiveElement(prevActiveElement);
    }
  }, [location.search]);

  if (loading) {
    return <div className="text-white text-2xl mb-4 mt-8 text-center">Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4, width: '100%', color: 'white' }}>
      {loading ? (
        <CircularProgress color="inherit" />
      ) : (
        teamData ? (
          <Box sx={{ width: '100%', maxWidth: '1000px', bgcolor: 'grey.900', color: 'white', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h4" color="white" align="center" my={4}>
              {teamData[0].number} {teamData[0].team_name}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'grey.800', p: 1, borderRadius: '4px' }}>
              <ButtonGroup variant="contained" aria-label="outlined primary button group">
                {['Team Info', 'Events', 'Awards'].map((element, index) => (
                  <Button
                    key={index}
                    onClick={() => handleHeaderClick(element.replace(/\s+/g, ''))}
                    sx={{
                      bgcolor: 'grey.800',
                      '&:hover': { bgcolor: 'grey.700' },
                      color: 'white',
                      '&:focus': {
                        outline: 'none'
                      }
                    }}
                  >
                    {element}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>
            {activeElement === 'TeamInfo' && teamData && (
              <TeamLocation
                data={teamData[0]}
              />
            )}
            {activeElement === 'Events' && 
              <CreateList eventIdsString={eventIdsString}></CreateList>
            }
            {activeElement === 'Awards' && <TeamAwards awards={teamData[0].awards}></TeamAwards>}
          </Box>
        ) : (
          <Typography variant="h6" color="textSecondary" align="center">
            Team Not Found {teamId}
          </Typography>
        )
      )}
    </Box>
  );
};

export default TeamInfo;
