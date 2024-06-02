import React, { useState } from 'react';
import '../../Stylesheets/dropdown.css'
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

// This represents the dropdown to select a region

// Get the setRegion function, and the current region
interface RegionDropdownProps {
  onSelect: (region: string) => void;
  value: string;
}

const RegionDropDown: React.FC<RegionDropdownProps> = ({ onSelect, value }) => {
    const [selectedRegion, setSelectedRegion] = useState<string>(value);

    const regions: { [key: string]: string[] } = {
        "United States": [
            "Alabama",
            "Alaska",
            "Arizona",
            "Arkansas",
            "California",
            "Colorado",
            "Connecticut",
            "Delaware",
            "District of Columbia",
            "Florida",
            "Georgia",
            "Hawaii",
            "Idaho",
            "Illinois",
            "Indiana",
            "Iowa",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Maine",
            "Maryland",
            "Massachusetts",
            "Michigan",
            "Minnesota",
            "Mississippi",
            "Missouri",
            "Montana",
            "Nebraska",
            "Nevada",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "New York",
            "North Carolina",
            "North Dakota",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Puerto Rico",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Vermont",
            "Virginia",
            "Washington", // Best region (cope)
            "West Virginia",
            "Wisconsin",
            "Wyoming"
        ],

        "Canada": [
            "Alberta",
            "British Columbia",
            "Manitoba",
            "Ontario",
            "Quebec",
            "Saskatchewan",
        ],

        "China": [
            "Beijing",
            "Fujian",
            "Gansu",
            "Guangdong",
            "Guizhou",
            "Hainan",
            "Hebei",
            "Henan",
            "Hong Kong", 
            "Jiangsu",
            "Jiangxi",
            "Jilin",
            "Macau",
            "Shaanxi",
            "Shandong",
            "Shanghai",
            "Sichuan",
            "Tianjin",
            "Zhejiang"
        ],
        "Germany": [
            "Baden-Württemberg",
            "Berlin",
            "Hamburg",
            "Niedersachsen",
            "Nordrhein-Westfalen",
            "Rheinland-Pfalz"
        ],

        "Ireland": [
            "Cork",
            "Donegal",
            "Limerick",
            "Offaly"
        ],

        "Mexico": [
            "Aguascalientes",
            "Baja California",
            "Chiapas",
            "Chihuahua",
            "Coahuila",
            "Guanajuato",
            "Hidalgo",
            "Jalisco",
            "Mexico City",
            "Mexico State",
            "Michoacán",
            "Morelos",
            "Nuevo León",
            "Quintana Roo",
            "San Luis Potosí",
            "Tamaulipas",
            "Tabasco",
            "Tlaxcala",
            "Veracruz",
            "Yucatán"
        ],

        "Spain": [
            "Barcelona",
            "Girona",
            "Guipuzcoa",
            "Madrid",
            "Vizcaya",
        ],

        "Switzerland": [
            "Aargau",
            "Basel-Landschaft",
            "Basel-Stadt",
            "Rhône" // this is a river?
        ],
        
        "Countries / Regions": [
            "Andorra",
            "Australia",
            "Azerbaijan",
            "Bahrain",
            "Belgium",
            "Brazil",
            "Canada",
            "Chile",
            "China",
            "Colombia",
            "Egypt",
            "Ethiopia",
            "Finland",
            "France",
            "Germany",
            "Ghana",
            "Indonesia",
            "Ireland",
            "Japan",
            "Jordan",
            "Kazakhstan",
            "Korea, Republic of",
            "Kuwait",
            "Lebanon",
            "Luxembourg",
            "Malaysia",
            "Mexico",
            "Morocco",
            "New Zealand",
            "Oman",
            "Panama",
            "Paraguay",
            "Philippines",
            "Qatar",
            "Russia",
            "Saudi Arabia",
            "Singapore",
            "Slovakia",
            "Spain",
            "Switzerland",
            "Taiwan",  // In accordance to US policy
            "Thailand",
            "Tunisia",
            "Türkiye",
            "United Arab Emirates",
            "United Kingdom",
            "United States",
            "Vietnam",
          ]
    };

    const handleChange = (event: SelectChangeEvent<string>) => {
        const region = event.target.value;
        setSelectedRegion(region);
        onSelect(region);
    };

    return (
        <FormControl variant="outlined" style={{ minWidth: 120, borderColor: 'white' }}>
            <InputLabel id="region-label" style={{ color: 'white' }}>Region</InputLabel>
            <Select
                labelId="region-label"
                id="region"
                value={selectedRegion || 'All'}
                onChange={handleChange}
                label="Region"
                style={{ width: 'auto', height: '40px', color: 'white' }}
                sx={{
                    '& .MuiSelect-icon': {
                        color: 'white',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                        border: 'display',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                    }
                }}
            >
                <MenuItem value="">All</MenuItem>
                {Object.entries(regions).map(([country, states]) => (
                    states.map(state => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))
                ))}
            </Select>
        </FormControl>
    );
};

export default RegionDropDown;