import React from 'react';
import { DatePicker } from '@mui/lab';
import { FormControl, FormLabel } from '@mui/material';
import '../../Stylesheets/dropdown.css';

interface DateDropDownProps {
    startAfterDate: string;
    setStartAfterDate: React.Dispatch<React.SetStateAction<string>>;
}

const DateDropDown: React.FC<DateDropDownProps> = ({ startAfterDate, setStartAfterDate }) => {
    return (
        <FormControl variant="outlined" style={{ minWidth: 120, borderColor: 'white' }}>
            <FormLabel style={{ color: 'white' }}>Date</FormLabel>
            <DatePicker
                label="Date"
                value={startAfterDate}
                onChange={(newValue) => setStartAfterDate(newValue?.toISOString().split('T')[0] || '')}
                renderInput={(params) => <input {...params.inputProps} style={{ width: 'auto', height: '30px' }} />}
                inputFormat="yyyy-MM-dd"
                style={{ color: 'white' }}
            />
        </FormControl>
    );
};

export default DateDropDown;
