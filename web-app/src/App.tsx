import React from 'react';
import './App.css';
import NavBar from './components/NavBar';
import Events from './pages/Events';
import Skills from './pages/Skills';
import TeamInfo from './pages/TeamInfo';
import EventInfo from './pages/EventInfo';
import Rankings from './pages/Rankings';
import About from './pages/About';
import EventsListQuery from './components/Lists/EventsList';
import RatingsList from './components/Lists/RatingsList';
import SkillsList from './components/Lists/SkillsList';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Stylesheets/pageLayout.css';

const Home: React.FC = () => {
  return (
    <div className = "pageBackground">
      <div className="flex flex-col items-center">
        <h1 className="title leftOngoing">Ongoing Events</h1>
        <EventsListQuery status = 'ongoing'/>
        <h1 className="title leftOngoing">Vex Rankings</h1>
        <RatingsList program={"VEX"} season={"181"} region={""} />
        <h1 className="title leftOngoing">Vex Skills</h1>
        <SkillsList season={"181"} grade={"High School"} region={""}/>
      </div>
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
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
