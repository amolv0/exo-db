/*
import React from 'react';
import { FormControl, FormLabel } from '@mui/material';
import '../../Stylesheets/dropdown.css';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface DateDropDownProps {
    startAfterDate: string;
    setStartAfterDate: React.Dispatch<React.SetStateAction<string>>;
}

const DateDropDown: React.FC<DateDropDownProps> = ({ startAfterDate, setStartAfterDate }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={['DatePicker']}>
                <DatePicker
                    label="Date"
                    onChange={(newValue: Date | null) => setStartAfterDate(newValue?.toISOString().split('T')[0] || '')}
                    sx={{ color: 'white', borderColor: 'white' }} // Change text and border color to white
                ></DatePicker>
            </DemoContainer>
        </LocalizationProvider>

      );
    /*
    return (

    />
        <FormControl variant="outlined" style={{ minWidth: 120, borderColor: 'white' }}>
            <FormLabel style={{ color: 'white' }}>Date</FormLabel>

        </FormControl>
    ); 
};

export default DateDropDown; */


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
