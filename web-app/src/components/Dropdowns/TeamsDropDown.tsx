import React from 'react';
import '../../Stylesheets/dropdown.css'

// This represents the dropdown to select the date

// Extract the current date its set as, and also the function to set that date
interface TeamsDropDownProps {
    selectedTeam: string;
    setSelectedTeam: React.Dispatch<React.SetStateAction<string>>;
    teams: string[];
}

const TeamsDropDown: React.FC<TeamsDropDownProps> = ({ selectedTeam, setSelectedTeam, teams }) => {
    const customTeamSort = (teamA: string, teamB: string) => {
        const numberA = parseInt(teamA.match(/^\d+/)?.[0] || "0", 10);
        const numberB = parseInt(teamB.match(/^\d+/)?.[0] || "0", 10);

        if (numberA !== numberB) {
            return numberA - numberB;
        }

        const restOfA = teamA.replace(/^\d+/, '');
        const restOfB = teamB.replace(/^\d+/, '');

        return restOfA.localeCompare(restOfB);
    };

    // Sort teams array using custom sorting function
    const sortedTeams = teams.slice().sort(customTeamSort);

    return (
        <div className = "filter">
            <div className = "query">
              Teams
            </div>
            <div className = "search-filter">
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} style={{ width: 'auto', height: '30px' }}>
                    <option value="">All</option>
                    {sortedTeams.map((team, index) => (
                        <option key={index} value={team}>{team}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default TeamsDropDown;
