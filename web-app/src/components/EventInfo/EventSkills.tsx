import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

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
    skills: SkillData[];
}

const EventSkillsComponent: React.FC<EventSkillsComponentProps> = ({ skills }) => {
  
    const [selectedOption, setSelectedOption] = useState<'programming' | 'driver' | 'combined'>('combined');

    // Filter the "programming" scores and "driver" scores, and need to map the
    // team to their prog + driver scores because data is not given together
    
    const programmingSkills = skills.filter(skill => skill.type === "programming");
    const driverSkills = skills.filter(skill => skill.type === "driver");

    const programmingSkillsMap = new Map<number, SkillData[]>();
    const driverSkillsMap = new Map<number, SkillData[]>();
    const combinedSkillsMap = new Map<number, SkillData[]>();

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

    // Sort the prog + driver skills
    const sortedCombinedSkills = Array.from(combinedSkillsMap.entries()).sort((a, b) => {
        const totalScoreA = a[1].reduce((acc, curr) => acc + curr.score, 0);
        const totalScoreB = b[1].reduce((acc, curr) => acc + curr.score, 0);
        return totalScoreB - totalScoreA;
    });

    // Sort the prog skills
    const sortedProgSkills = Array.from(programmingSkillsMap.entries()).sort((a, b) => {
        const totalScoreA = a[1].reduce((acc, curr) => acc + curr.score, 0);
        const totalScoreB = b[1].reduce((acc, curr) => acc + curr.score, 0);
        return totalScoreB - totalScoreA;
    });

    // Sort the driver skills
    const sortedDriverSkills = Array.from(driverSkillsMap.entries()).sort((a, b) => {
        const totalScoreA = a[1].reduce((acc, curr) => acc + curr.score, 0);
        const totalScoreB = b[1].reduce((acc, curr) => acc + curr.score, 0);
        return totalScoreB - totalScoreA;
    });

    return (
        <div className = "p-10">
            <div className="tableTitleC">Skills Rankings</div>  
            <div className="flex justify-center mx-10">
                <ThemeProvider theme={theme}>
                    <TableContainer component={Paper} style={{ width: '700px', overflowX: 'auto', marginBottom: '20px' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        Rank
                                    </TableCell>
                                    <TableCell>
                                        Number
                                    </TableCell>
                                    <TableCell>
                                        Combined
                                    </TableCell>
                                    <TableCell>
                                        Driver
                                    </TableCell>
                                    <TableCell>
                                        Progamming
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedCombinedSkills && Array.isArray(sortedCombinedSkills) && sortedCombinedSkills.map(([teamId, skills], index, array) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Link className="teamBox" to={`/teams/${teamId}`}>
                                                {skills[0].team.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {skills[0].score + skills[1].score}
                                        </TableCell>
                                        <TableCell>
                                            {skills[1].score}
                                        </TableCell>
                                        <TableCell>
                                            {skills[0].score}
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
