import React, { useState, useEffect } from 'react';
import '../../Stylesheets/dropdown.css';
import { getSeasonNameFromId } from '../../SeasonEnum';

/** This drop down should be called with a drop down that limits the display to VEX, VEXU, or vexIQ */

interface SeasonDropdownProps {
    setSeasonId: (seasonId: number) => void;
    seasonId: number;
    type : string;
    grade : string;
    restrict : string[] | null;
}

const SeasonDropdown: React.FC<SeasonDropdownProps> = ({ setSeasonId, seasonId, type, grade, restrict}) => {
    const [seasons, setSeasons] = useState<number[]>([]);

    useEffect(() => {
        let filteredSeasons: number[] = [];
        if (!restrict) {
            for (let i = 50; i <= 250; i++) {
                const seasonName = getSeasonNameFromId(i);
                if (seasonName !== i.toString()) {
                    filteredSeasons.push(i);
                }
            }
        } else {
            filteredSeasons = restrict.map(s => parseInt(s));
        }
        setSeasons(filteredSeasons);
    }, []);

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

export default SeasonDropdown;
