import '../../Stylesheets/dropdown.css';

/** This drop down should be called with a drop down that limits the display to VEX, VEXU, or vexIQ */

interface GradeDropdownProps {
    setGrade: (grade: string) => void;
    grade : string;
}

const GradeDropdown: React.FC<GradeDropdownProps> = ({ setGrade, grade}) => {
    const handleGradeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setGrade(event.target.value);
    };

    return (
        <div className="filter">
            <div className="query">
                Grade
            </div>
            <div className="search-filter">
            <select id="grade" value={grade} onChange={handleGradeChange}>
                <option value="High School">High School</option>
                <option value="College">College</option>
                <option value="Middle School">Middle School</option>
                </select>
            </div>
        </div>
    );
}

export default GradeDropdown;
