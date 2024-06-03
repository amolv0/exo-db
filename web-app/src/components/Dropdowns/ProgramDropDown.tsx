
import React from 'react';
import '../../Stylesheets/dropdown.css'
import { Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

// This represents the dropdown to select the VEX program

// Get the set program function, and the current program, or just display all programs
interface ProgramDropdownProps {
    setProgram: React.Dispatch<React.SetStateAction<string>>;
    program: string;
    all: boolean;
}

const ProgramDropDown: React.FC<ProgramDropdownProps> = ({ setProgram, program, all }) => {
  
    const handleProgramChange = (event: SelectChangeEvent<string>) => {
      setProgram(event.target.value);
    };

    return (
        <div className = "filter">
            <div className = "query">
                Program
            </div>
            <div className = "search-filter">
                <ThemeProvider theme={theme}>
                    <FormControl style={{ minWidth: 120 }}>
                        <Select
                            labelId="program-label"
                            id="program"
                            value={program}
                            onChange={handleProgramChange}
                            style={{ width: 'auto', height: '30px' }}
                        >
                            {all && <MenuItem value="All">All</MenuItem>}
                            <MenuItem value="VRC">VRC</MenuItem>
                            <MenuItem value="VEXU">VEXU</MenuItem>
                            {all && <MenuItem value="VIQRC">VIQRC</MenuItem>}
                            {/* Add more options if needed */}
                        </Select>
                    </FormControl>
                </ThemeProvider>
            </div>
        </div>
    );
}

export default ProgramDropDown;
