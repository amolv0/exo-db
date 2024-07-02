import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';
import { TableSortLabel } from '@mui/material';

// Displays the skills Rankings for the event

interface TeamData {
    name: string;
    id: number;
}

interface SkillData {
    score: number;
    name: string;
    rank: number;
    team: TeamData;
    type: string;
    attempts: number;
}

interface EventSkillsComponentProps {
    skills: SkillData[] | null;
}

const EventSkillsComponent: React.FC<EventSkillsComponentProps> = ({ skills }) => {
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('rank');

    if (!skills) {
        return <div className="tableTitleC">Skills Rankings</div>;
    }

    const programmingSkills = skills.filter(skill => skill.type === "programming");
    const driverSkills = skills.filter(skill => skill.type === "driver");

    const programmingSkillsMap = new Map<number, SkillData[]>();
    const driverSkillsMap = new Map<number, SkillData[]>();
    const combinedSkillsMap = new Map<number, SkillData[]>();

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    programmingSkills.forEach(skill => {
        const teamId = skill.team.id;
        const existingSkills = programmingSkillsMap.get(teamId) || [];
        programmingSkillsMap.set(teamId, [...existingSkills, skill]);
    });

    driverSkills.forEach(skill => {

        const teamId = skill.team.id;
        const existingSkills = driverSkillsMap.get(teamId) || [];
        driverSkillsMap.set(teamId, [...existingSkills, skill]);
    });

    skills.forEach(skill => {
        const teamId = skill.team.id;
        const combinedSkills = [
          ...(programmingSkillsMap.get(teamId) || []),
          ...(driverSkillsMap.get(teamId) || [])
        ];
        combinedSkillsMap.set(teamId, combinedSkills);
    });

    const sortedRankings = Array.from(combinedSkillsMap.entries()).sort((a, b) => {
        const driver = (a[1]?.[1]?.score ?? 0);
        const driver2 = (b[1]?.[1]?.score ?? 0);
        const prog = (a[1]?.[0]?.score ?? 0);
        const prog2 = (b[1]?.[0]?.score ?? 0);
        if (orderBy === 'combined' || orderBy === 'rank') {
            return order === 'asc' ? (prog2 + driver2) - (prog + driver)
            : (prog + driver) - (prog2 + driver2);
        } else if (orderBy === 'prog') {
            return order === 'asc' ? (prog2 - prog) 
            : (prog - prog2);
        } else if (orderBy === 'driver') {
            return order === 'asc' ? (driver2 - driver) 
            : (driver - driver2);
        }
        return 0;
    });

    return (
        <div>
            <div className="tableTitleC">Skills Rankings</div>
            <br/>
            <div className="flex justify-center mx-10">
                <ThemeProvider theme={theme}>
                    <TableContainer component={Paper} style={{ width: '700px', overflowX: 'auto', marginBottom: '20px' }}>
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
                                            active={orderBy === 'combined'}
                                            direction={orderBy === 'combined' ? order : 'asc'}
                                            onClick={() => handleRequestSort('combined')}
                                        >
                                            Combined
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'driver'}
                                            direction={orderBy === 'driver' ? order : 'asc'}
                                            onClick={() => handleRequestSort('driver')}
                                        >
                                            Driver
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'prog'}
                                            direction={orderBy === 'prog' ? order : 'asc'}
                                            onClick={() => handleRequestSort('prog')}
                                        >
                                            Prog
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedRankings && Array.isArray(sortedRankings) && sortedRankings.map(([teamId, skills], index, array) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="rankBox"> 
                                                {skills[0].rank}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Link className="teamBox" to={`/teams/${teamId}`}>
                                                {skills[0].team.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {(skills[0]?.score ?? 0) + (skills[1]?.score ?? 0)}
                                        </TableCell>
                                        <TableCell>
                                            {skills[1]?.score ?? 0}
                                        </TableCell>
                                        <TableCell>
                                            {skills[0]?.score ?? 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </ThemeProvider>
            </div>
        </div>
    );  
}

export default EventSkillsComponent;
