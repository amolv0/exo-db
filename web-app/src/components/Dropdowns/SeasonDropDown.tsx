import React, { useState, useEffect } from 'react';
import '../../Stylesheets/dropdown.css';
import { getSeasonNameFromId } from '../../SeasonEnum';

// This dropdown shows the current seasons

// The following gets the setSeasonID, the current seasonId
// Also takes in the type / grade, which restricts which seasons to display
// and a manual restrict array, which makes it not display the seasons in the array

interface SeasonDropdownProps {
    setSeasonId: (seasonId: number) => void;
    seasonId: number;
    type : string;
    grade : string;
    restrict : string[] | null;
}

const SeasonDropDown: React.FC<SeasonDropdownProps> = ({ setSeasonId, seasonId, type, grade, restrict}) => {
    const [seasons, setSeasons] = useState<number[]>([]);

    // Sets the all the season options to display
    useEffect(() => {
        let filteredSeasons: number[] = [];
        if (!restrict) {
            // Loops through the possible seasonIds (up to 250)
            for (let i = 90; i <= 250; i++) {
                const seasonName = getSeasonNameFromId(i);
                if (seasonName !== i.toString()) {
                    filteredSeasons.push(i);
                }
            }
        } else {
            filteredSeasons = restrict.map(s => parseInt(s));
        }
        setSeasons(filteredSeasons);
    }, [restrict]);

    const handleSeasonChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSeasonId(parseInt(event.target.value));
    };

    return (
        <div className="filter">
            <div className="query">
                Season
            </div>
            <div className="search-filter">
                <select id="season" value={seasonId} onChange={handleSeasonChange}>
                    {/* Display based on restrictions */}
                    {seasons
                        .filter(s => {
                            if (type === 'VEXU' || grade === 'College') {
                                return getSeasonNameFromId(s).includes('VEXU');
                            } else if (type === 'VEX') {
                                return !getSeasonNameFromId(s).includes('VEXU') && getSeasonNameFromId(s).includes('VEX');
                            } else if (grade !== 'College') {
                                return !getSeasonNameFromId(s).includes('VEXU') && getSeasonNameFromId(s).includes('VEX');
                            }
                            return true;
                        })
                        .map(s => (
                            <option key={s} value={s}>{getSeasonNameFromId(s)}</option>
                        ))}
                </select>
            </div>
        </div>
    );
}

export default SeasonDropDown;
