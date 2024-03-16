
import React from 'react';
import '../../Stylesheets/dropdown.css'

interface ProgramDropdownProps {
  program: string;
  setProgram: React.Dispatch<React.SetStateAction<string>>;
  all: boolean;
}

const ProgramDropdown: React.FC<ProgramDropdownProps> = ({ setProgram, program, all }) => {
  const handleProgramChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setProgram(event.target.value);
  };

  return (
    <div className = "filter">
      <div className = "query">
        Program
      </div>
      <div className = "search-filter">
        <select
          id="program"
          value={program}
          onChange={handleProgramChange}
          style={{ width: 'auto', height: '30px' }}
        >
          {all ? <option value="">All</option> : null}
          <option value="VRC">VRC</option>
          <option value="VEXU">VEXU</option>
          {all ? <option value="VIQRC">VIQRC</option> : null}
          {/* Add more options dynamically if needed */}
        </select>
      </div>
    </div>
  );
}

export default ProgramDropdown;
