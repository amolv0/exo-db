import '../../Stylesheets/dropdown.css';

// This represents the dropdown to select the grade

// Get the set grade function, and the current grade
interface GradeDropdownProps {
    setGrade: (grade: string) => void;
    grade : string;
}

const GradeDropDown: React.FC<GradeDropdownProps> = ({ setGrade, grade}) => {

    const handleGradeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setGrade(event.target.value);
    };

    return (
        <div className="filter">
            <div className="query">
                Grade
            </div>
            <div className="search-filter">

            {/* Current grade options */}
            <select id="grade" value={grade} onChange={handleGradeChange}>
                <option value="High School">High School</option>
                <option value="College">College</option>
                <option value="Middle School">Middle School</option>
                </select>
            </div>
        </div>
    );
}

export default GradeDropDown;
