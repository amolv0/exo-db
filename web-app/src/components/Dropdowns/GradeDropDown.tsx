import '../../Stylesheets/dropdown.css';
import { Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../Stylesheets/theme';

// This represents the dropdown to select the grade

// Get the set grade function, and the current grade
interface GradeDropdownProps {
    setGrade: (grade: string) => void;
    grade : string;
}

const GradeDropDown: React.FC<GradeDropdownProps> = ({ setGrade, grade}) => {

    const handleGradeChange = (event: SelectChangeEvent<string>) => {
        setGrade(event.target.value);
    };

    return (
        <div className="filter">
            <div className="query">
                Grade
            </div>
            <div className="search-filter">
                <ThemeProvider theme={theme}>
                    <FormControl style={{ minWidth: 120 }}>
                        <Select
                            labelId="grade-label"
                            id="grade"
                            value={grade}
                            onChange={handleGradeChange}
                            style={{ width: 'auto', height: '30px' }}
                        >
                            <MenuItem value="High School">High School</MenuItem>
                            <MenuItem value="College">College</MenuItem>
                            <MenuItem value="Middle School">Middle School</MenuItem>
                        </Select>
                    </FormControl>
                </ThemeProvider>
            </div>
        </div>
    );
}

export default GradeDropDown;
