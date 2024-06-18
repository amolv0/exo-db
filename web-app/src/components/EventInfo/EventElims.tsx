import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';
import DivisionDropDown from '../Dropdowns/DivisionDropDown';
import { Link } from 'react-router-dom';

// Current Bracket code -> Subject to change ***

interface Team {
    sitting: boolean,
    team: {
        id: string,
        name: string
    }
}

interface Alliance {
    color: 'red' | 'blue';
    score: number;
    teams: Team[];
}

interface Match {
    id: string;
    round: number;
    name: string;
    alliances: Alliance[];
}

interface Division {
    name: string;
    matches: Match[];
}

interface Participant {
    id: string;
    resultText: string;
    isWinner: boolean;
    status: string | null;
    name: string;
    color: 'red' | 'blue'; // Add this line
}

interface TransformedMatch {
    homeScore: number;
    awayScore: number;
    id: string;
    name: string;
    nextMatchId: string | null;
    tournamentRoundText: string;
    startTime: string;
    state: string;
    participants: Participant[];
}

interface MatchComponentProps {
    match: TransformedMatch;
}

interface Divisions {
    division: Division[];
}

const roundMapping: Record<number, string> = {
    6: "R16",
    3: "Quarterfinals",
    4: "Semifinals",
    5: "Finals",
};

const parseMatches = (rawMatches: Match[]): Match[] => {
    // Filter and format matches for elimination rounds
    return rawMatches.filter(match => match.round >= 3);
};

const transformMatchesForBracket = (rawMatches: Match[]): TransformedMatch[] => {
    return parseMatches(rawMatches).map(match => {
        const home = match.alliances[0];
        const away = match.alliances[1];
        const homeScore = home.score;
        const awayScore = away.score;
        const homeWin = homeScore > awayScore;
        const roundName = roundMapping[match.round] || "Unknown Round";
        return {
            homeScore: homeScore,
            awayScore: awayScore,
            id: match.id,
            name: match.name,
            nextMatchId: null, // Adjust based on your data
            tournamentRoundText: roundName,
            startTime: "Unknown", // Provide a default or extract from your data
            state: "DONE", // Adjust based on your match state logic
            participants: home.teams.map(team => ({
                id: team.team.id,
                resultText: homeWin ? "WON" : "LOST",
                isWinner: homeWin,
                status: null,
                name: team.team.name,
                color: home.color, // Assign the color here
            })).concat(away.teams.map(team => ({
                id: team.team.id,
                resultText: !homeWin ? "WON" : "LOST",
                isWinner: !homeWin,
                status: null,
                name: team.team.name,
                color: away.color, // And here
            })))
        };
    });
};

const MatchComponent: React.FC<MatchComponentProps> = ({ match }) => {
    const colorMap: Record<'red' | 'blue', string> = {
        red: 'pink',
        blue: 'lightblue',
    };

    const renderTeams = (allianceColor: 'red' | 'blue') => {
        const teams = match.participants.filter(participant => participant.color === allianceColor).map(p => ({ id: p.id, name: p.name }));
        const isHome = allianceColor === 'blue';
        return (
            <ThemeProvider theme={theme}>
                <Box
                    bgcolor={colorMap[allianceColor]}
                    p={1}
                    sx={{
                        opacity: match.participants.some(participant => participant.color === allianceColor && participant.isWinner) ? 1 : 0.5,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: 200, // Adjust width as needed
                    }}
                >

                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 3 }}>
                        {teams.map((team, index) => (
                            <Typography key={index} variant="body1" sx={{ textAlign: 'center' }}>
                                <Link to={`/teams/${team.id}`}>
                                    {team.name}
                                </Link>
                            </Typography>
                        ))}
                    </Box>
                    <Typography variant="body1" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {isHome ? match.homeScore : match.awayScore}
                    </Typography>
                    {/* Render scores underneath teams */}
                </Box>
            </ThemeProvider>
        );
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" marginBottom={4}>
            <Typography variant="body1" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {match.name}
            </Typography>
            {renderTeams('red')}
            {renderTeams('blue')}
        </Box>
    );
};

interface TransformedMatch {
    name: string;
    tournamentRoundText: string;
}

const groupMatchesByRound = (matches: TransformedMatch[]): Record<string, TransformedMatch[]> => {
    return matches.reduce((acc, match) => {
        const round = match.tournamentRoundText;
        const matchNameParts = match.name.split('-');
        const rootNumber = matchNameParts[0];
        const endingNumber = matchNameParts[1];

        if (!acc[round]) {
            acc[round] = [match];
        } else {
            const existingMatches = acc[round].filter(existingMatch => {
                const existingRootNumber = existingMatch.name.split('-')[0];
                return existingRootNumber === rootNumber && !existingMatch.name.startsWith("Fi");
            });
            const highestEndingNumber = Math.max(...existingMatches.map(existingMatch => parseInt(existingMatch.name.split('-')[1])));

            if (parseInt(endingNumber) > highestEndingNumber) {
                acc[round] = acc[round].filter(existingMatch => !existingMatch.name.startsWith(rootNumber) || parseInt(existingMatch.name.split('-')[1]) !== highestEndingNumber);
                acc[round].push(match);
            }
        }

        return acc;
    }, {} as Record<string, TransformedMatch[]>);
};

const EventElims: React.FC<Divisions> = ({ division }) => {
    const [selectedDivisionIndex, setSelectedDivisionIndex] = useState(0);
    const selectedDivision = division[selectedDivisionIndex];
    const transformedMatches = transformMatchesForBracket(selectedDivision.matches);
    const matchesByRound = groupMatchesByRound(transformedMatches);

    return (
        <div>
            <div className="tableTitleC">
                Elimination Bracket
            </div>
            <div className="eventsDropDown">
                {/* Display divisions dropdown only if there are multiple divisions */}
                {division.length > 1 && (
                    <DivisionDropDown
                        setSelectedDivision={setSelectedDivisionIndex}
                        division={selectedDivisionIndex}
                        divisions={division}
                    />
                )}
            </div>
            <ThemeProvider theme={theme}>
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            minWidth: 'max-content',
                            gap: 4
                        }}
                    >
                        {["R16", "Quarterfinals", "Semifinals", "Finals"].map((round) => (
                            <Box key={round} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, width: '100%', gap: round === 'Quarterfinals' ? 17 : (round === 'Semifinals' ? 50 : 0) }}>
                                    {matchesByRound[round]?.map((match) => (
                                        <Box key={match.id}>
                                            <MatchComponent match={match} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </ThemeProvider>
        </div>
    );
};

export default EventElims;
