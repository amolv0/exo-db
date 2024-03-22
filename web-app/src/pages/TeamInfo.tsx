import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TeamProfile from '../components/TeamInfo/TeamProfile';
import TeamAwards from '../components/TeamInfo/TeamAwards';
import TeamEvents from '../components/TeamInfo/TeamEvents';
import TeamSkills from '../components/TeamInfo/TeamSkills';
import TeamMatches from '../components/TeamInfo/TeamMatches';
import { Box, Typography, Button, ButtonGroup, CircularProgress } from '@mui/material';
import '../Stylesheets/pageLayout.css';

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
          <Box sx={{ width: '100%', maxWidth: '1000px', color: 'white', p: 2}}>
            <Typography mb="20px" variant="h4" color="black" align="center">
              {teamData[0].number} {teamData[0].team_name}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#84202A', p: 1, borderRadius: '4px' }}>
              <ButtonGroup>
                {['Team Info', 'Events', 'Matches', 'Skills', 'Ratings', 'Awards'].map((element, index) => (
                  <Button
                    key={index}
                    onClick={() => handleHeaderClick(element.replace(/\s+/g, ''))}
                    sx={{
                      bgcolor: '#28191D',
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
              <TeamProfile
                data={teamData[0]}
              />
            )}
            {activeElement === 'Events' && 
              <TeamEvents eventIdsString={eventIdsString}></TeamEvents>
            }
            {activeElement === 'Matches' && 
              <TeamMatches matches={teamData[0].matches}></TeamMatches>
            }
            {activeElement === 'Skills' && 
              <TeamSkills skills={teamData[0].skills}></TeamSkills>
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
