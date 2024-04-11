import React from 'react';
import '../../Stylesheets/dropdown.css';

interface StartAfterDateInputProps {
  startAfterDate: string;
  setSelectedDivisionIndex: React.Dispatch<React.SetStateAction<string>>;
  divisions: { name: string }[]; // Assuming your division array has objects with a 'name' property
}

const StartAfterDateInput: React.FC<StartAfterDateInputProps> = ({ setSelectedDivisionIndex, divisions }) => {
  const handleDivisionChange = (index: number) => {
    setSelectedDivisionIndex(index.toString());
  };

  return (
    <div className="filter">
      <div className="query">Divisions</div>
      <div className="search-filter">
        <input
          type="date"
          id="startAfterDate"
          //value={divisions}
          onChange={(e) => setSelectedDivisionIndex(e.target.value)}
          style={{ width: 'auto', height: '30px' }}
        />
        <select
          //value={startAfterDate} // Assuming 'startAfterDate' represents the selected division index
          onChange={(e) => handleDivisionChange(Number(e.target.value))}
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
