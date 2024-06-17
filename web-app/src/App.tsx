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
import igniteLogo from './Assets/ignite.png';
import Search from './components/Search';

const Home: React.FC = () => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const formattedOneWeekAgo = oneWeekAgo.toISOString().split('T')[0];
    return (
        <div className = "pageBackground">
            <div className="flex flex-col items-center px-20">
                <div>
                    <img src={igniteLogo} className="w-64 h-auto" alt="Ignite Logo" />
                </div>
                <h1 className="text-center mt-10 text-xl font-bold">
                    Welcome to IgniteDB! IgniteDB is a comprehensive database of all teams within the VEX circuit,
                    including detailed information on skills, match statistics, reveals, and team Elo.
                </h1>
                <h1 className="text-center mt-10 text-xl font-bold">
                    Feel free to search for any team or event:
                </h1>
                <Search></Search>
                <div className="title">
                    Featured Events
                </div>
                <EventsListQuery 
                    numberOfEvents = {5}
                    startAfter={formattedOneWeekAgo}
                    status={''}
                    region={'All'}
                    programCode={'VRC'}
                    display={true}
                />
                <div className="title">
                  Top 5 ELO
                </div>
                <RatingsList program={"VEX"} season={"181"} region={""} short={true} />
                <div className="title">
                  Top 5 Skills
                </div>
                <SkillsList season={"181"} grade={"High School"} region={""} short={true}/>
                <br></br>
                <br></br>
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
