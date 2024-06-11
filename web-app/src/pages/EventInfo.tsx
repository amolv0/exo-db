import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import EventAwards from '../components/EventInfo/EventAwards';
import EventTeams from '../components/EventInfo/EventTeams';
import EventMatches from '../components/EventInfo/EventMatches';
import EventRankings from '../components/EventInfo/EventRankings';
import EventSkills from '../components/EventInfo/EventSkills';
import EventElims from '../components/EventInfo/EventElims';
import EventStreams from '../components/EventInfo/EventStreams';
import { Typography, CircularProgress} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import '../Stylesheets/teamInfo.css';

// Controls the general EventInfo page for a given eventId


const EventInfo: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const [eventData, setEventData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeElement, setActiveElement] = useState<string>('EventInfo');

    const location = useLocation();
    const navigate = useNavigate();

    const handleHeaderClick = (element: string) => {
        setActiveElement(element);
        if (eventId) {
            const newUrl = `/events/${eventId}?activeElement=${element}`;
            navigate(newUrl, { replace: true, state: { activeElement: element } }); // Pass the state along with the URL
        }
    } ;

    // On eventId change, load the new page
    useEffect(() => {
        setLoading(true);
        const fetchEventData = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/events/${eventId}`);
                const data = await response.json();
                setEventData(data);
            } catch (error) {
                console.error('Error fetching or parsing JSON:');
            } finally {
                setLoading(false);
            }
        };
        fetchEventData();
    }, [eventId]);

    // On location.search change, go to the new page
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const prevActiveElement = searchParams.get('activeElement');
        if (prevActiveElement) {
            setActiveElement(prevActiveElement);
        }
    }, [location.search]);
    
    return (
        <div>
            {loading ? (
                <CircularProgress color="inherit" />
            ) : (eventData && eventData.length > 0 ? (
                <div>
                    {/* Events Title */}
                    <div className = "team-info-layout">
                        <div className = "title-team-info">
                            {eventData[0].name && (
                                <div>{eventData[0].name}</div>
                            )}
                        </div>
                        <div className="subtitle-team-info">
                            <span className="mr-1">&#x1F3E0;</span>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${eventData[0].location.address_1}, ${eventData[0].location.city}, ${eventData[0].location.region}, ${eventData[0].location.postcode}, ${eventData[0].location.country}`
                            )}`} target="_blank" rel="noopener noreferrer">
                                {eventData[0].location.address_1 + ', ' || ''}{eventData[0].location.city + ', ' || ''}
                                {eventData[0].location.region + ', ' || ''}{eventData[0].location.postcode + ', ' || ''}{eventData[0].location.country || ''}
                            </a>
                        </div>
                        <div className="subtitle-team-info">
                            <span className="mr-1">&#x1F55C;</span>
                            {eventData[0].start.substring(0, eventData[0].start.indexOf('T'))}
                            {eventData[0].start.substring(0, eventData[0].start.indexOf('T')) !== eventData[0].end.substring(0, eventData[0].start.indexOf('T')) && 
                            ` - ${eventData[0].end.substring(0, eventData[0].start.indexOf('T'))}`}
                        </div>
                        <div className="subtitle-team-info">
                            <InfoIcon/>
                            {eventData[0].season.name || 'N/A'}           
                        </div>
                    </div>

                    {/* Navigation bar */}
                    <div className="team-container">
                        <div className={`team-button transition ${activeElement === 'EventInfo' ? 'active' : ''}`} onClick={() => handleHeaderClick('EventInfo')}>Event Info</div>
                        <div className={`team-button transition ${activeElement === 'TeamsList' ? 'active' : ''}`} onClick={() => handleHeaderClick('TeamsList')}>Teams List</div>
                        <div className={`team-button transition ${activeElement === 'Matches' ? 'active' : ''}`} onClick={() => handleHeaderClick('Matches')}>Matches</div>
                        <div className={`team-button transition ${activeElement === 'Rankings' ? 'active' : ''}`} onClick={() => handleHeaderClick('Rankings')}>Rankings</div>
                        <div className={`team-button transition ${activeElement === 'Elims' ? 'active' : ''}`} onClick={() => handleHeaderClick('Elims')}>Elims</div>
                        <div className={`team-button transition ${activeElement === 'Skills' ? 'active' : ''}`} onClick={() => handleHeaderClick('Skills')}>Skills</div>
                    </div>

                    {/* Main content */}
                    <div className = "team-info-display">
                        {activeElement === 'EventInfo' && (
                            <>
                                <EventAwards 
                                    location={eventData[0].location} 
                                    season={eventData[0].season} 
                                    program={eventData[0].program.code} 
                                    awards={eventData[0].awards} 
                                />
                                <EventStreams 
                                    streams={eventData[0].streams || []} 
                                />
                            </>
                        )
                        }
                        {activeElement === 'TeamsList' && <EventTeams teams={eventData[0].teams} />}
                        {activeElement === 'Matches' && <EventMatches divisions={eventData[0].divisions} />}
                        {activeElement === 'Rankings' && <EventRankings divisions={eventData[0].divisions} />}
                        {activeElement === 'Elims' && <EventElims division={eventData[0].divisions} />}
                        {activeElement === 'Skills' && <EventSkills skills={eventData[0].skills} />}
                    </div>
                </div>
            ) : (
                <Typography variant="h6" color="textSecondary" align="center">
                    Event {eventId} Not Found
                </Typography>
            ))}
        </div>
    );
};

export default EventInfo;
