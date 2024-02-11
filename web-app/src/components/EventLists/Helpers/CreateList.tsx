import React, { Component } from 'react';
import EventBasic from './EventBasic';

interface LocationData {
    venue: string;
    country: string;
    city: string;
    address_1: string;
    address_2: string | null;
    postcode: string;
    coordinates: { lat: number; lon: number };
    region: string;
}

interface EventData {
  id: number;
  name: string;
  program: string;
  location: LocationData;
  start: string;
  end: string;
}

interface EventListDisplayProps {
  eventData: EventData[];
}

class EventListDisplay extends Component<EventListDisplayProps> {
  render() {
    const { eventData } = this.props;

    return (
      <div>
        <div>
        <div className="text-xl font-bold text-gray-50" style={{ display: 'flex', width: '100%' }}>
            <div style={{ flex: 1 }}>Program</div>
            <div style={{ flex: 3 }}>Event</div>
            <div style={{ flex: 2 }}>Location</div>
            <div style={{ flex: 2 }}>Date</div>
        </div>
        <br />
        {eventData.map((event) => (
            <EventBasic 
            key={event.id} 
            name={event.name} 
            eventID={event.id} 
            program={event.program}
            location={event.location}
            start={event.start}
            end={event.end}
            />
        ))}
        </div>
      </div>
    );
  }
}

export default EventListDisplay;
