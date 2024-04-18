import React from 'react';
import '../Stylesheets/teamInfo.css';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
    
    return (
        <div>
            <div className = "title leftOngoing">
                About Us
            </div>

            <div className="leftOngoing">
            <Link to={`/teams/93544?activeElement=TeamInfo`} className="text-6xl font-bold text-purple-600 hover:text-red-500 transform hover:scale-110">
                <div className="bg-yellow-400 rounded-full p-4 shadow-lg border-8 border-blue-500">3<span className="text-pink-500">5</span><span className="text-green-500">3</span>X</div>
            </Link>
            </div>
            <div className="leftOngoing">
            <Link to={`/teams/5226?activeElement=TeamInfo`} className="text-8xl font-extrabold text-purple-700 hover:text-yellow-500 transform hover:rotate-12">
                <div className="bg-gradient-to-r from-pink-400 to-purple-600 text-transparent bg-clip-text">1<span className="text-green-500">0</span>B</div>
            </Link>
            </div>

            <div className = "text-center">
                For any bugs please contact Ghijj on discord 
            </div>

            <div className = "leftOngoing">
                <div>We are a team of three people TWO RUT ONE DUB</div>
                <div>Washington State VEX robotics is so good we diff people (cope)</div>
            </div>
        </div>

    );
};

export default About;
