import React from 'react';
import '../../Stylesheets/dropdown.css'

interface StartAfterDateInputProps {
  startAfterDate: string;
  setStartAfterDate: React.Dispatch<React.SetStateAction<string>>;
}

const StartAfterDateInput: React.FC<StartAfterDateInputProps> = ({ startAfterDate, setStartAfterDate }) => {
  return (
    <div className = "filter">
      <div className = "query">
        Date
      </div>
      <div className = "search-filter">
        <input
          type="date"
          id="startAfterDate"
          value={startAfterDate}
          onChange={(e) => setStartAfterDate(e.target.value)}
          style={{ width: 'auto', height: '30px' }}
        />
      </div>
    </div>

  );
}

export default StartAfterDateInput;
