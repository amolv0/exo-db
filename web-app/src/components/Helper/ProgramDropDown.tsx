
import React from 'react';
import '../../Stylesheets/dropdown.css'

interface ProgramDropdownProps {
  program: string;
  setProgram: React.Dispatch<React.SetStateAction<string>>;
}

const ProgramDropdown: React.FC<ProgramDropdownProps> = ({ program, setProgram }) => {
  return (
    <div className = "filter">
      <div className = "query">
        Program
      </div>
      <div className = "search-filter">
        <select
          id="program"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          style={{ width: 'auto', height: '30px' }}
        >
          <option value="">All</option>
          <option value="VRC">VRC</option>
          <option value="VEXU">VEXU</option>
          <option value="VIQRC">VIQRC</option>
          {/* Add more options dynamically if needed */}
        </select>
      </div>
    </div>
  );
}

export default ProgramDropdown;
