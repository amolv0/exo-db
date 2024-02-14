import React, { Component } from 'react';
import { Link } from 'react-router-dom';

interface TeamData {
    name: string;
    id: string;
}
interface Rank {
    wins: number;
    team: TeamData;
    losses: number;
    ap: number;
    ties: number;
    rank: number;
    wp: number;
    high_score: number;
    average_points: number;
}

interface Props {
    rankings: Rank[];
}

class RankingsComponent extends Component<Props> {
    render() {
        const { rankings } = this.props;
        if (!rankings) {
            return <div>Ranks not available</div>
        }
        // Sort the rankings by rank
        const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);

        return (
            <div>
                <h2 className="text-xl font-bold mb-2">Rankings Information</h2>
                {sortedRankings.map((rank, index) => (
                    <div key={index} className="border p-4 rounded-lg mb-4">
                        <h3 className="font-bold text-lg mb-2 flex justify-between">
                            <span>
                                Rank {rank.rank}: 
                                <Link to={`/teams/${rank.team.id}`} className="text-blue-500 hover:underline"> {rank.team.name}</Link>
                            </span>
                            <span className="text-right">
                                {rank.wins}-{rank.losses}-{rank.ties}
                            </span>
                        </h3>
                        <h3 className = "flex justify-between" >
                            <span>
                                High: {rank.high_score} | Avg: {rank.average_points}
                            </span>
                            <span className="text-right">
                            WP: {rank.wp} | AP: {rank.ap}
                            </span>
                        </h3>
                    </div>
                ))}
            </div>



        );
    }
}

export default RankingsComponent;
