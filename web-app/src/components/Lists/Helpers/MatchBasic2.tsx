import React from 'react';
import '../../../Stylesheets/matches.css'

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

interface MatchDisplayProps {
    match: Match;
    teamName?: string;
  }

const MatchDisplay: React.FC<MatchDisplayProps> = ({ match, teamName }) => {
    const { name, field, scheduled, started, alliances } = match;
    if (alliances) {
        
    } else {
        return (
            <div></div>
        )
    }
    
    const startTime = started ? new Date(started).toLocaleTimeString() : new Date(scheduled).toLocaleTimeString();

    const blueAlliance = alliances.find(alliance => alliance.color === 'blue')!;
    const redAlliance = alliances.find(alliance => alliance.color === 'red')!;
    
    const blueScore = blueAlliance.score;
    const redScore = redAlliance.score;

    const isBlueWinning = blueScore > redScore;
    const equal = blueScore == redScore;
    return (
        <div className = "matchContainer">
            <div className = "matchName">
                <div>
                    {name}
                </div>
                <div>
                    Field: {field}
                </div>
            </div>
            <div className = "matchInfo">
                <div className = "matchTeamDisplay">
                    {redAlliance.teams.map((teamData) => (
                        <div>
                            <span style={{ color: isBlueWinning && !equal? '#FFCCCC' : 'red' }}>{teamData.team.name}</span>
                        </div>
                    ))}
                </div>
               
                <div className = "matchScoreDisplay">
                    <div>
                        <span style={{ color: isBlueWinning ? '#FFCCCC' : 'red' }}>{redScore}</span>
                        :
                        <span style={{ color: isBlueWinning ? '#1876D2' : '#93BAE9' }}>{blueScore}</span>
                    </div>
                </div>

                <div className = "matchTeamDisplay text-right">
                    {blueAlliance.teams.map((teamData) => (
                        <div>
                            <span style={{ color: isBlueWinning ? '#1876D2' : '#93BAE9' }}>{teamData.team.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className = "matchLocation"> 
                <div className = "matchTime">
                    {startTime.split(':').slice(0, 2).join(':') + " " + startTime.substring(startTime.length - 2, startTime.length)}
                </div>
                <div className = "matchStatus">
                    Status: {started || !equal ? "Completed" : "Not started"}
                </div>
            </div>
        </div>
    );
};

export default MatchDisplay;
