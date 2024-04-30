import React, { useState, useEffect } from 'react';
import MatchBasic from '../Lists/Helpers/MatchBasic';
import DivisionDropDown from '../Dropdowns/DivisionDropDown'
import TeamsDropDown from '../Dropdowns/TeamsDropDown'

// Display the matches for the event

interface Match {
    scheduled: string;
    started: string;
    matchnum: number;
    round: number;
    field: string;
    name: string;
    alliances: AllianceData[];
}

interface AllianceData {
    color: string;
    teams: TeamData[];
    score: number;
}

interface TeamData {
    team: TeamInfo;
}

interface TeamInfo {
    name: string;
    id: number;
}

interface Rankings {
    team: TeamInfo;
}
interface Division {
    name: string;
    matches: Match[];
    rankings: Rankings[];
}

interface Divisions {
    divisions: Division[];
}

const EventMatchesComponent: React.FC<Divisions> = ({ divisions }) => {

    const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(0);
    const [selectedTeam, setSelectedTeam] = useState("");
    const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
    const customOrder = [1, 2, 6, 3, 4, 5];

    useEffect(() => {
        // Loop through each division
        divisions.forEach((division) => {
            // Sort matches for each division
            division.matches.sort((a, b) => {
                let indexA = customOrder.indexOf(a.round);
                let indexB = customOrder.indexOf(b.round);
    
                if (indexA === -1) indexA = customOrder.length;
                if (indexB === -1) indexB = customOrder.length;
    
                return indexA - indexB;
            });
        });
    }, [divisions]);

    useEffect(() => {
        if (selectedTeam === "") {
            setFilteredMatches(divisions[selectedDivisionIndex].matches);
        } else {
            const matchesWithSelectedTeam = divisions[selectedDivisionIndex].matches.filter(match =>
                match.alliances.some(alliance =>
                    alliance.teams.some(team => team.team.name === selectedTeam)
                )
            );
            setFilteredMatches(matchesWithSelectedTeam);
        }
    }, [selectedTeam]);

    useEffect(() => {
        setFilteredMatches(divisions[selectedDivisionIndex].matches);
    }, [selectedDivisionIndex]);

    if (!divisions[selectedDivisionIndex] || !divisions[selectedDivisionIndex].matches || divisions[selectedDivisionIndex].matches.length === 0) {
        return <p>No matches</p>;
    }

    const teamsByDivision: { [divisionIndex: number]: string[] } = {};
    
    divisions.forEach((division, index) => {
        teamsByDivision[index] = division.rankings.map((ranking) => ranking.team.name);
    });

    return (
        <div className = "pt-10">
            <div className="tableTitleC">
                Matches List
            </div>
            <div className = "eventsDropDown">
                {divisions.length > 1 && (
                    <DivisionDropDown 
                        setSelectedDivision={setSelectedDivisionIndex} 
                        division={selectedDivisionIndex}
                        divisions={divisions}
                    />  
                )}
                <TeamsDropDown 
                    selectedTeam={selectedTeam} 
                    setSelectedTeam={setSelectedTeam}
                    teams = {teamsByDivision[selectedDivisionIndex]}
                />  
            </div>
            
            {filteredMatches.map((match, index) => (
                <MatchBasic key={index} match={match} />
            ))}
        </div>
    );
};

export default EventMatchesComponent;
