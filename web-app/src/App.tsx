import React from 'react';
import './App.css';
import NavBar from './components/NavBar';
import Teams from './pages/Teams';
import Events from './pages/Events';
import Skills from './pages/Skills';
import EventInfo from './pages/EventInfo';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-white text-2xl font-bold mb-4 my-8">HOME</h1>
      <p className="text-gray-300">jg diff</p>
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
          <Route path="/teams" element={<Teams />} />
          <Route path="/events" element={<Events />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/eventinfo/:eventId" element={<EventInfo />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
