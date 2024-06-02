import React from 'react';
import '../../Stylesheets/dropdown.css';
import theme from '../../Stylesheets/theme';
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

// This represents the dropdown to select the VEX program

// Get the set program function, and the current program, or just display all programs

interface ProgramDropdownProps {
    setProgram: React.Dispatch<React.SetStateAction<string>>;
    program: string;
    all: boolean;
}

const ProgramDropDown: React.FC<ProgramDropdownProps> = ({ setProgram, program, all }) => {
  
    const handleProgramChange = (event: SelectChangeEvent<string>) => {
        setProgram(event.target.value as string);
    };

    return (
        <ThemeProvider theme={theme}>
            <FormControl variant="outlined" style={{ minWidth: 120, borderColor: 'white' } }>
                <InputLabel id="program-label" style = {{color:'white'}}>Program</InputLabel>
                <Select
                    labelId="program-label"
                    id="program"
                    value={program}
                    onChange={handleProgramChange}
                    label="Program"
                    style={{ width: 'auto', height: '40px', color:'white' }}
                >
                    {all && <MenuItem value="">All</MenuItem>}
                    <MenuItem value="VRC">VRC</MenuItem>
                    <MenuItem value="VEXU">VEXU</MenuItem>
                    {all && <MenuItem value="VIQRC">VIQRC</MenuItem>}
                    {/* Add more options if needed */}
                </Select>
            </FormControl>
        </ThemeProvider>

    );
}

export default ProgramDropDown;
