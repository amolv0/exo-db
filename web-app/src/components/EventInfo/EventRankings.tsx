import React, { Component, useState } from 'react';
import { Link } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

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

    const handleDivisionChange = (index: number) => {
        setSelectedDivisionIndex(index);
    };

    if (!selectedDivision) {
        return <div>No division selected</div>;
    }

    const { rankings } = selectedDivision;
    const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);

    const headerStyle = {
        backgroundColor: '#595959',
        color: 'white',
    };

    const rowStyle = {
        height: '36px',
    };

    return (
        <div>
            <select value={selectedDivisionIndex} onChange={(e) => handleDivisionChange(Number(e.target.value))}>
                {divisions.map((division, index) => (
                    <option key={index} value={index}>
                        {division.name}
                    </option>
                ))}
            </select>

            <TableContainer component={Paper}>
                <Table aria-label="simple table" size="small">
                    <TableHead style={headerStyle}>
                        <TableRow>
                            <TableCell style={{ fontWeight: 'bold' }}>Rank</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>Number</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>W-L-T</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>Avg Points</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>OPR</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>DPR</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>CCWM</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>WP</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>AP</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedRankings.map((rank) => (
                            <TableRow key={rank.team.id} style={rowStyle}>
                                <TableCell component="th" scope="row">
                                    {rank.rank}
                                </TableCell>
                                <TableCell align="right">
                                    <Link to={`/teams/${rank.team.id}`} style={{ color: 'blue', textDecoration: 'underline' }}>
                                        {rank.team.name}
                                    </Link>
                                </TableCell>
                                <TableCell align="right">{rank.wins}-{rank.losses}-{rank.ties}</TableCell>
                                <TableCell align="right">{rank.average_points}</TableCell>
                                <TableCell align="right">{rank.opr}</TableCell>
                                <TableCell align="right">{rank.dpr}</TableCell>
                                <TableCell align="right">{rank.ccwm}</TableCell>
                                <TableCell align="right">{rank.wp}</TableCell>
                                <TableCell align="right">{rank.ap}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default RankingsComponent;
