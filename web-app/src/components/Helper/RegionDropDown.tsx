import React, { useState } from 'react';
import '../../Stylesheets/dropdown.css'
interface RegionDropdownProps {
  onSelect: (region: string) => void;
  value: string;
}

const RegionDropdown: React.FC<RegionDropdownProps> = ({ onSelect, value }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>(value);

  const regions: { [key: string]: string[] } = {
    // United States
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
        "Washington",
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
        "Hong Kong", // Don't
        "Jiangsu",
        "Jiangxi",
        "Jilin",
        "Macau",   // Cancel Me!
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
        "Vizcaya", // p sure
    ],

    "Switzerland": [
        "Aargau",
        "Basel-Landschaft",
        "Basel-Stadt",
        "Rhône" // this is a river? what?
    ],
    
    "Countries": [
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
        "Taiwan",
        "Thailand",
        "Tunisia",
        "Türkiye",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "Vietnam",
      ]

    // Add all other countries here
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const region = event.target.value;
    setSelectedRegion(region);
    onSelect(region);
  };

  return (
    <div className = "filter">
      <div className = "query">
        Region
      </div>
      <div className = "search-filter">
        <select value={selectedRegion} onChange={handleChange} style={{ width: 'auto', height: '30px' }}>
          <option value="">All</option>
            {Object.entries(regions).map(([country, states]) => (
              <optgroup key={country} label={country}>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </optgroup>
            ))}
        </select>
      </div>
    </div>
  );
};

export default RegionDropdown;

/*    <select value={selectedRegion} onChange={handleChange} className="p-2 rounded-md bg-gray-200 mr-4">
      <option value="">All</option>
      {Object.entries(regions).map(([country, states]) => (
        <optgroup key={country} label={country}>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </optgroup>
      ))}
    </select> */