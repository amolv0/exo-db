import React from 'react';
import '../../Stylesheets/dropdown.css';

// This represents the dropdown to select the division a team is in

// Extract the current division, the possible divisions, setDivision function
interface DivisionProps {
    division: number;
    divisions: {name : string}[];
    setSelectedDivision: React.Dispatch<React.SetStateAction<number>>;
}

const DivisionDropDown: React.FC<DivisionProps> = ({ setSelectedDivision, division, divisions}) => {

    const handleDivisionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDivision = parseInt(event.target.value, 10);
        setSelectedDivision(selectedDivision);
    };

    return (
        <div className="filter">
            <div className="query">
                Divisions
            </div>
            <div className="search-filter">
                <select
                    id="division"
                    value={division}
                    onChange={handleDivisionChange}
                    style={{ width: 'auto', height: '30px' }}
                >
                    {divisions.map((division, index) => (
                      <option key={index} value={index}>
                        {division.name}
                      </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DivisionDropDown;
