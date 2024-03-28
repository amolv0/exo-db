import React from 'react';
import './App.css';
import NavBar from './components/NavBar';
import Events from './pages/Events';
import Skills from './pages/Skills';
import TeamInfo from './pages/TeamInfo';
import EventInfo from './pages/EventInfo';
import Rankings from './pages/Rankings';
import EventsListQuery from './components/EventLists/EventsListQuery';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Stylesheets/pageLayout.css';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <h1 className="title leftDisplay ml-24">Ongoinggg Events</h1>
        <EventsListQuery status = 'ongoing'/>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teams/:teamId" element={<TeamInfo />} />
          <Route path="/events" element={<Events />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/events/:eventId" element={<EventInfo />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
