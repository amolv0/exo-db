import React, { useState} from 'react';
import CreateList from './Helpers/CreateList';
import { CircularProgress } from '@mui/material';

// The intermediate between creating an event List and calling
// Helps process which eventsIds to query from

interface EventFilter {
    numberOfEvents?: number | null;
    programCode?: string | null;
    startAfter?: string | null;
    startBefore?: string | null;
    status?: string | null;
    region?: string | null;
}

const EventsListQuery: React.FC<EventFilter> = ({numberOfEvents, programCode, startAfter, startBefore, status = 'ongoing', region}) => {
    const [eventIdsString, setEventIdsString] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            let apiUrl = `${process.env.REACT_APP_API_URL}/dev/events?`;
            const queryParams: string[] = [];

            // Insert the filter quries
            if (numberOfEvents !== null && numberOfEvents !== undefined) queryParams.push(`numberOfEvents=${numberOfEvents}`);
            if (status) queryParams.push(`status=${status}`);
            if (programCode) queryParams.push(`program=${programCode}`);
            if (startAfter) queryParams.push(`start_after=${startAfter}`);
            if (startBefore) queryParams.push(`start_before=${startBefore}`);
            if (region) queryParams.push(`region=${region}`);

            apiUrl += queryParams.join('&')
            // Fetch data using constructed URL
            const response = await fetch(apiUrl);
            const result = await response.json();
            if (result.length === 0 || result.error) {
                setLoading(false);
            if (status == 'ongoing') {
                setError("No ongoing events");
            } else {
                setError("No events found")
            }
            return;
        }
            const formattedIds = JSON.stringify(result);
            setEventIdsString(formattedIds);
            setLoading(false);
            setError(null);
        } catch (error) {
            setError("Failed to find valid events");
            setLoading(false);
        }
    };

    fetchData();

    return (
        <div>
            {loading ? ( // Display loading indicator if loading is true
                <CircularProgress style={{ margin: '20px' }} />
            ) : error ? ( 
                <div>{error}</div>
            ) :  (
                <div>
                    <div className = "tableTitleEvent">{region} {programCode} Events</div>
                    <CreateList eventIdsString={eventIdsString}/>
                </div>
            )}
        </div>
    );
};

export default EventsListQuery;
