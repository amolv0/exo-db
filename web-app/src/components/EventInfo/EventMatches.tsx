import React, { useState, useEffect } from 'react';
import MatchBasic2 from '../Lists/Helpers/MatchBasic2';
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
    const [selectedTeam, setSelectedTeam] = useState("All");
    const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
    const customOrder = [1, 2, 6, 3, 4, 5];
    const teamsByDivision: { [divisionIndex: number]: string[] } = {};

    divisions.forEach((division, index) => {
        if (division.rankings && division.rankings.length > 0) {
            // If there are rankings, add teams from rankings
            teamsByDivision[index] = division.rankings.map((ranking) => ranking.team.name);
        } else {
            // If there are no rankings, add each unique team name from matches
            const uniqueTeams = new Set<string>();
            division.matches.forEach((match) => {
                match.alliances.forEach((alliance) => {
                    alliance.teams.forEach((team) => {
                        uniqueTeams.add(team.team.name);
                    });
                });
            });
            teamsByDivision[index] = Array.from(uniqueTeams);
        }
    });

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
        if (selectedTeam === "All") {
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
            <div className = "match">
                {filteredMatches.map((match, index) => (
                    <MatchBasic2 key={index} match={match} />
                ))}
            </div>
        </div>
    );
};

export default EventMatchesComponent;
