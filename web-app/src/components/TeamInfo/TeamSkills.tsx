import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import SeasonDropdown from '../Dropdowns/SeasonDropDown';

// This component gets all of the skills for a team

interface TeamSkillsProps {
    skills: number[];
}

const TeamSkills: React.FC<TeamSkillsProps> = ({ skills }) => {
    const [seasonEventsMap, setSeasonEventsMap] = useState<{ [season: number]: { [eventId: number]: any[] } }>({});
    const [selectedSeason, setSelectedSeason] = useState<number>(181);
    const [posts, setPosts] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [groupsOf50, setGroupsOf50] = useState<number[][]>([]);
    const [isFirstUseEffectDone, setIsFirstUseEffectDone] = useState<boolean>(false);
  
    const divideIntoGroups = (arr: number[], groupSize: number): number[][] => {
        const groups: number[][] = [];
        for (let i = 0; i < arr.length; i += groupSize) {
            groups.push(arr.slice(i, i + groupSize));
        }
        return groups;
    };

    // On skills change, split it up into groups of 50
    useEffect(() => {
        if (skills) {
            const groupedIds: number[][] = divideIntoGroups(skills, 50);
            setGroupsOf50(groupedIds); 
            setIsFirstUseEffectDone(true);
        } else {
            setLoading(false);
        }
    }, [skills]);

    // Once first effect is done, query for all the skills matches
    useEffect(() => {
        if (!isFirstUseEffectDone) {
            return;
        }
        const fetchSkillsDetails = async () => {
            if (skills && skills.length > 0) {
                try {
                    setLoading(true);
                    const allSkills: any[] = [];
                    for (let i = 0; i < groupsOf50.length; i++) {
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/dev/skills/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(groupsOf50[i])
                        });
                        const data = await response.json();
                        allSkills.push(...data);
                    }

                    const tempSeasonEventsMap: { [season: number]: { [eventId: number]: any[] } } = {};
                    allSkills.forEach(skill => {
                        if (!tempSeasonEventsMap[skill.season.id]) {
                            tempSeasonEventsMap[skill.season.id] = {};
                        }
                        if (!tempSeasonEventsMap[skill.season.id][skill.event_id]) {
                            tempSeasonEventsMap[skill.season.id][skill.event_id] = [];
                        }
                        tempSeasonEventsMap[skill.season.id][skill.event_id].push(skill);
                    });

                    setSeasonEventsMap(tempSeasonEventsMap);
                    setSelectedSeason(Math.max(...Object.keys(tempSeasonEventsMap).map(Number)));
                } catch (error) {
                    console.error('Error fetching skills details:', error);
                } finally {
                    setPosts(false);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchSkillsDetails();
    }, [skills, isFirstUseEffectDone, groupsOf50]);

    return (
        <div>
            {loading ? ( // Render loading indicator if loading state is true
                <CircularProgress style={{ margin: '20px' }} />
            ) : posts ? (  // no skills :)
                <div>No skills found</div>
            ) : (
                <div className="text-black">
                    <br />
                    <div className="flex justify-center"> 
                        <SeasonDropdown
                            seasonId={selectedSeason}
                            setSeasonId={setSelectedSeason}
                            type=''
                            grade=''
                            restrict={Object.keys(seasonEventsMap)}
                        />      
                    </div>
                    <br />
                    <div>
                        {seasonEventsMap[selectedSeason] && Object.values(seasonEventsMap[selectedSeason]).map((eventSkills, index) => (
                        eventSkills.map((skills, index) => (
                            <div>
                                {index === 0 && (
                                <Link to={`/events/${skills.event_id}`}>
                                    {skills.event_name}
                                </Link>
                                )}
                                <div key={index} className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''}`}>
                                    <div> 
                                        Type: {skills.type}
                                    </div>
                                    <div> 
                                        Skills Score: {skills.score}
                                    </div>
                                    <div>
                                        Skills Rank: {skills.rank}
                                    </div>
                                    <div>
                                        Attempts: {skills.attempts}
                                    </div>
                                </div>
                            </div>
                            ))
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamSkills;
