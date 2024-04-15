import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TeamProfile from '../components/TeamInfo/TeamProfile';
import TeamAwards from '../components/TeamInfo/TeamAwards';
import TeamEvents from '../components/TeamInfo/TeamEvents';
import TeamSkills from '../components/TeamInfo/TeamSkills';
import TeamMatches from '../components/TeamInfo/TeamMatches';
import TeamRankings from '../components/TeamInfo/TeamRankings';
import { Typography, CircularProgress } from '@mui/material';
import '../Stylesheets/pageLayout.css';
import '../Stylesheets/teamInfo.css';

// Controls display for individual teams pages

const TeamInfo: React.FC = () => {
    const location = useLocation();
    const { teamId } = useParams<{ teamId: string }>();
    const [teamData, setTeamData] = useState<any>(null);
    const [eventIdsString, setEventIdsString] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [activeElement, setActiveElement] = useState<string>('TeamInfo');

    const navigate = useNavigate();

    const handleHeaderClick = (element: string) => {
        setActiveElement(element);
        if (teamData && teamData[0] && teamData[0].id) {
            const newUrl = `/teams/${teamData[0].id}?activeElement=${element}`;
            navigate(newUrl, { replace: true, state: { activeElement: element } });
        }
    };

    // If the teamId changes, the team updated so we change the event data
    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/teams/${teamId}`);
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

    // If the locatino search changes, set it to the new location
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
            ) : (teamData ? 
                (
                    <div>
                        {/* Page title */}
                        <div className = "team-info-layout">
                            <div className = "title-team-info">
                                {teamData[0].organization ? (
                                    <div>{teamData[0].number} {teamData[0].team_name} | {teamData[0].organization}</div>
                                ) : (
                                    <div>{teamData[0].number} {teamData[0].team_name}</div>
                                )}
                            </div>
                            <div className="subtitle-team-info">
                                <span className="mr-1">&#x1F3E0;</span>
                                {teamData[0].location.city + ',' || ''} {teamData[0].location.region || ''}
                            </div>
                            <div className="subtitle-team-info">
                                {teamData[0].registered === 'true' ? (
                                    <span>&#x2713; {teamData[0].program} Registered </span> // Checkmark (✓)
                                ) : (
                                    <span>&#10006; Not {teamData[0].program} Registered</span> // Cross (✖)
                                )}    
                            </div>
                        </div>

                        {/* Nav bar */}
                        <div className="team-container">
                                <div className={`team-button transition ${activeElement === 'TeamInfo' ? 'active' : ''}`} onClick={() => handleHeaderClick('TeamInfo')}>Team Info</div>
                                <div className={`team-button transition ${activeElement === 'Events' ? 'active' : ''}`} onClick={() => handleHeaderClick('Events')}>Events</div>
                                <div className={`team-button transition ${activeElement === 'Matches' ? 'active' : ''}`} onClick={() => handleHeaderClick('Matches')}>Matches</div>
                                <div className={`team-button transition ${activeElement === 'Skills' ? 'active' : ''}`} onClick={() => handleHeaderClick('Skills')}>Skills</div>
                                <div className={`team-button transition ${activeElement === 'Rankings' ? 'active' : ''}`} onClick={() => handleHeaderClick('Rankings')}>Rankings</div>
                                <div className={`team-button transition ${activeElement === 'Awards' ? 'active' : ''}`} onClick={() => handleHeaderClick('Awards')}>Awards</div>
                        </div>
                    
                        {/* Content */}
                        <div className = "team-info-display">
                            {activeElement === 'TeamInfo' && teamData && (
                                <TeamProfile data={teamData[0]}/>
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
                            {activeElement === 'Rankings' && 
                                <TeamRankings rankings={teamData[0].rankings}></TeamRankings>
                            }
                            {activeElement === 'Awards' && 
                                <TeamAwards awards={teamData[0].awards}></TeamAwards>
                            }
                        </div>
                    </div>
                ) : (
                    <Typography variant="h6" color="textSecondary" align="center">
                        Team Not Found {teamId}
                    </Typography>
                )
            )}
        </div>
    );
};

export default TeamInfo;
