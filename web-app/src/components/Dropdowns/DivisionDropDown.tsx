import React from 'react';
import '../../Stylesheets/dropdown.css';
import { Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

// This represents the dropdown to select the division a team is in

// Extract the current division, the possible divisions, setDivision function
interface DivisionProps {
    division: number;
    divisions: {name : string}[];
    setSelectedDivision: React.Dispatch<React.SetStateAction<number>>;
}

const DivisionDropDown: React.FC<DivisionProps> = ({ setSelectedDivision, division, divisions}) => {

    const handleDivisionChange = (event: SelectChangeEvent<string>) => {
        const selectedDivision = parseInt(event.target.value, 10);
        setSelectedDivision(selectedDivision);
    };

    return (
        <div className="filter">
            <div className="query">
                Divisions
            </div>
            <div className="search-filter">
                <ThemeProvider theme={theme}>
                    <FormControl style={{ minWidth: 120 }}>
                        <Select
                            labelId="division-label"
                            id="division"
                            value={division.toString()}
                            onChange={handleDivisionChange}
                            style={{ width: 'auto', height: '30px' }}
                        >
                            {divisions.map((division, index) => (
                                <MenuItem key={index} value={index}>
                                    {division.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </ThemeProvider>
            </div>
        </div>
    );
};

export default DivisionDropDown;
