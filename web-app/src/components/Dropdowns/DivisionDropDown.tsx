import React from 'react';
import '../../Stylesheets/dropdown.css';

interface DivisionProps {
  setSelectedDivision: React.Dispatch<React.SetStateAction<number>>;
  division: number;
  divisions: {name : string}[];
}

const StartAfterDateInput: React.FC<DivisionProps> = ({ setSelectedDivision, division, divisions}) => {
  const handleDivisionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDivision = parseInt(event.target.value, 10);
    setSelectedDivision(selectedDivision);
  };

  return (
    <div className="filter">
      <div className="query">Divisions</div>
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

export default StartAfterDateInput;
