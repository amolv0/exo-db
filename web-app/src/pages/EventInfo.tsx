import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EventLocation from '../components/EventInfo/EventLocation';
import TeamsList from '../components/EventInfo/TeamsList';
import MatchesList from '../components/EventInfo/MatchesList';
import EventRankings from '../components/EventInfo/EventRankings';
import EventSkills from '../components/EventInfo/EventSkills';
import EventElims from '../components/EventInfo/EventElims';
import { Box, Typography, Button, ButtonGroup, CircularProgress } from '@mui/material';

const EventInfo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeElement, setActiveElement] = useState<string>('EventInfo');

  const handleHeaderClick = (element: string) => {
    setActiveElement(element);
    if (eventId) {
      const newUrl = `/events/${eventId}?activeElement=${element}`;
      navigate(newUrl, { replace: true, state: { activeElement: element } }); // Pass the state along with the URL
    }
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`EXODB_API_GATEWAY_BASE_URL/dev/events/${eventId}`);
        const data = await response.json();
        console.log(data);
        setEventData(data);
      } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const prevActiveElement = searchParams.get('activeElement');
    if (prevActiveElement) {
      setActiveElement(prevActiveElement);
    }
  }, [location.search]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4, bgcolor: 'lightgrey', width: '100%' }}>
      {loading ? (
        <CircularProgress color="inherit" />
      ) : (
        eventData && eventData.length > 0 ? (
          <Box sx={{ width: '100%', maxWidth: '800px', bgcolor: 'white', color: 'text.primary', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h4" color="textPrimary" align="center" my={4}>
              Event Details for {eventData[0].name}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'darkgrey', p: 1, borderRadius: '4px', mb: 4 }}>
              <ButtonGroup variant="contained" aria-label="outlined primary button group">
                {['Event Info', 'Teams List', 'Matches', 'Rankings', 'Elims', 'Skills'].map((element, index) => (
                  <Button
                    key={index}
                    onClick={() => handleHeaderClick(element.replace(/\s+/g, ''))}
                    sx={{
                      bgcolor: 'darkgrey',
                      '&:hover': { bgcolor: 'grey.700' },
                      color: 'white',
                      '&:focus': { // Targeting the focus state
                        outline: 'none'
                      }
                    }}
                  >
                    {element}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>
            {activeElement === 'EventInfo' && <EventLocation location={eventData[0].location} season={eventData[0].season} program={eventData[0].program.code} awards={eventData[0].awards} />}
            {activeElement === 'TeamsList' && <TeamsList teams={eventData[0].teams} />}
            {activeElement === 'Matches' && <MatchesList division={eventData[0].divisions[0]} />}
            {activeElement === 'Rankings' && <EventRankings rankings={eventData[0].divisions[0].rankings} />}
            {activeElement === 'Elims' && <EventElims division={eventData[0].divisions[0]} />}
            {activeElement === 'Skills' && <EventSkills skills={eventData[0].skills} />}
          </Box>
        ) : (
          <Typography variant="h6" color="textSecondary" align="center">
            Match not found for Event ID {eventId}
          </Typography>
        )
      )}
    </Box>
  );
};

export default EventInfo;
