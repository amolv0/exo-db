import React from 'react';
import '../../Stylesheets/dropdown.css'

// This represents the dropdown to select the date

// Extract the current date its set as, and also the function to set that date
interface DateDropDownProps {
    startAfterDate: string;
    setStartAfterDate: React.Dispatch<React.SetStateAction<string>>;
}

const DateDropDown: React.FC<DateDropDownProps> = ({ startAfterDate, setStartAfterDate }) => {
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

export default DateDropDown;
