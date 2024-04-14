import React, {  useState } from 'react';
import { Link } from 'react-router-dom';
import '../../Stylesheets/eventTable.css';
import DivisionDropDown from '../Dropdowns/DivisionDropDown'

interface TeamData {
    name: string;
    id: string;
}

interface Rank {
    wins: number;
    team: TeamData;
    name: string;
    losses: number;
    ap: number;
    opr: string;
    dpr: string;
    ccwm: string;
    ties: number;
    rank: number;
    wp: number;
    high_score: number;
    average_points: number;
}

interface Division {
    name: string;
    rankings: Rank[];
}

interface Props {
    divisions: Division[];
}

const RankingsComponent: React.FC<Props> = ({ divisions }) => {
    const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(0);
    const selectedDivision = divisions[selectedDivisionIndex];

    if (!selectedDivision) {
        return <div>No division selected</div>;
    }

    const { rankings } = selectedDivision;
    const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);

    return (
        <div className = "p-10">
            <div className="eventsListsTitle">
                Rankings List
            </div>
            <div className = "eventsDropDown">
                {divisions.length > 1 && (
                    <DivisionDropDown 
                        setSelectedDivision={setSelectedDivisionIndex} 
                        division={selectedDivisionIndex}
                        divisions={divisions}
                    />  
                )}
            </div>  
            <div className="table">
                <div className="header col x-small">
                    <div className = "header-cell rounded-tl-lg">
                    Rank
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {index + 1}
                        </div>
                    ))}
                </div>
                <div className="header col rankings-t">
                    <div className = "header-cell">
                    Number
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            <div>
                                <Link className="teamBox" to={`/teams/${rank.team.id}`}>
                                    {rank.team.name}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="header col rankings">
                    <div className = "header-cell">
                    W-L-T
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {rank.wins}-{rank.losses}-{rank.ties}
                        </div>
                    ))}
                </div>
                <div className="header col rankings">
                    <div className = "header-cell">
                    Avg Points
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {rank.average_points}
                        </div>
                    ))}
                </div>
                <div className="header col rankings">
                    <div className = "header-cell">
                    OPR
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {rank.opr}
                        </div>
                    ))}
                </div>
                <div className="header col rankings">
                    <div className = "header-cell">
                    DPR
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {rank.dpr}
                        </div>
                    ))}
                </div>
                <div className="header col rankings">
                    <div className = "header-cell">
                    CCWM
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {rank.ccwm}
                        </div>
                    ))}
                </div>
                <div className="header col rankings">
                    <div className = "header-cell">
                    WP
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {rank.wp}
                        </div>
                    ))}
                </div>
                <div className="header col rankings">
                    <div className = "rounded-tr-lg header-cell">
                    AP
                    </div>
                    {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map((rank, index, array) => (
                        <div className={`body-cell ${index % 2 === 0 ? 'bg-opacity-65' : ''} ${index === array.length - 1 ? 'rounded-bl-lg rounded-b-none' : ''}`}>
                            {rank.ap}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RankingsComponent;
