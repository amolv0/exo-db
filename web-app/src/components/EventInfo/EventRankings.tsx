import React, {  useState } from 'react';
import { Link } from 'react-router-dom';
import DivisionDropDown from '../Dropdowns/DivisionDropDown'
import { TableSortLabel } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

// Displays the rankings for the event

interface TeamData {
    name: string;
    id: string;
}

interface RankingData {
    wins: number;
    team: TeamData;
    name: string;
    losses: number;
    ap: number;
    opr: number;
    dpr: number;
    ccwm: number;
    ties: number;
    rank: number;
    wp: number;
    sp: number;
    high_score: number;
    average_points: number;
}

interface Division {
    name: string;
    rankings: RankingData[];
}

interface Divisions {
    divisions: Division[];
}

const EventRankingsComponent: React.FC<Divisions> = ({ divisions }) => {
    const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(0);
    const selectedDivision = divisions[selectedDivisionIndex];
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('rank');

    if (!selectedDivision) {
        return <div>No division selected</div>;
    }

    // The rankings should only be that of the given division
    const { rankings } = selectedDivision;

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedRankings = [...rankings]?.slice().sort((a, b) => {
        if (orderBy === 'rank') {
            return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
        } else if (orderBy === 'wins' || orderBy === 'wp' || orderBy === 'sp'|| orderBy === 'ap'
        || orderBy === 'average_points' || orderBy === 'high_score' || orderBy === 'opr' || orderBy === 'ccwm' || orderBy === 'dpr') {
            return order === 'asc' ?  b[orderBy] - a[orderBy] : a[orderBy] - b[orderBy];
        }
        return 0;
    });
    
    return (
        <div className = "p-10">
            <div className="tableTitleC">
                Rankings List
            </div>
            <div className = "eventsDropDown">
                {/* Display divisions dropdown only if there are multiple divisions */}
                {divisions.length > 1 && (
                    <DivisionDropDown 
                        setSelectedDivision={setSelectedDivisionIndex} 
                        division={selectedDivisionIndex}
                        divisions={divisions}
                    />  
                )}
            </div>
            
            <div className="flex justify-center mx-10">
                <ThemeProvider theme={theme}>
                    <TableContainer component={Paper} style={{ width: '1000px', overflowX: 'auto', marginBottom: '20px' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'rank'}
                                            direction={orderBy === 'rank' ? order : 'asc'}
                                            onClick={() => handleRequestSort('rank')}
                                        >
                                            Rank
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        Team
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'wins'}
                                            direction={orderBy === 'wins' ? order : 'asc'}
                                            onClick={() => handleRequestSort('wins')}
                                        >
                                            W-L-T
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'wp'}
                                            direction={orderBy === 'wp' ? order : 'asc'}
                                            onClick={() => handleRequestSort('wp')}
                                        >
                                            WP
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'ap'}
                                            direction={orderBy === 'ap' ? order : 'asc'}
                                            onClick={() => handleRequestSort('ap')}
                                        >
                                            AP
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'sp'}
                                            direction={orderBy === 'sp' ? order : 'asc'}
                                            onClick={() => handleRequestSort('sp')}
                                        >
                                            SP
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'average_points'}
                                            direction={orderBy === 'average_points' ? order : 'asc'}
                                            onClick={() => handleRequestSort('average_points')}
                                        >
                                            Avg
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'high_score'}
                                            direction={orderBy === 'high_score' ? order : 'asc'}
                                            onClick={() => handleRequestSort('high_score')}
                                        >
                                            High
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'opr'}
                                            direction={orderBy === 'opr' ? order : 'asc'}
                                            onClick={() => handleRequestSort('opr')}
                                        >
                                            OPR
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'dpr'}
                                            direction={orderBy === 'dpr' ? order : 'asc'}
                                            onClick={() => handleRequestSort('dpr')}
                                        >
                                            DPR
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'ccwm'}
                                            direction={orderBy === 'ccwm' ? order : 'asc'}
                                            onClick={() => handleRequestSort('ccwm')}
                                        >
                                            CCWM
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedRankings.map((rankings, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="rankBox"> 
                                            {rankings.rank}
                                            </div> 
                                        </TableCell>
                                        <TableCell>
                                            <Link key={rankings.team.id} to={`/teams/${rankings.team.id}`}>
                                                <div className = "teamBox">{rankings.team.name}</div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>{rankings.wins}-{rankings.losses}-{rankings.ties}</TableCell>
                                        <TableCell>{rankings.wp}</TableCell>
                                        <TableCell>{rankings.ap}</TableCell>
                                        <TableCell>{rankings.sp}</TableCell>
                                        <TableCell>{rankings.average_points}</TableCell>
                                        <TableCell>{rankings.high_score}</TableCell>
                                        <TableCell>{rankings.opr}</TableCell>
                                        <TableCell>{rankings.dpr}</TableCell>
                                        <TableCell>{rankings.ccwm}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </ThemeProvider>
            </div>
        </div>
    );
};

export default EventRankingsComponent;
