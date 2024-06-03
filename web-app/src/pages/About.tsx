import React from 'react';
import '../Stylesheets/teamInfo.css';
import { Link } from 'react-router-dom';
import yujinGif from '../Assets/yujin.gif';

const About: React.FC = () => {
    
    return (
        <div className = "pageBackground">
            <br></br>
            <div className = "text-2xl text-center">
                About Us
            </div>

            <div className = "flex justify-center items-center">
            We are a team of three college students, two of whom were ex-competitors from team&nbsp;
            <Link to={`/teams/5226?activeElement=TeamInfo`}>
                <div className = "text-blue-500">
                    10B
                </div>
            </Link>
            &nbsp;and&nbsp;
            <Link to={`/teams/93544?activeElement=TeamInfo`}>
                <div className = "text-blue-500">
                    353X
                </div>
            </Link>
            &nbsp;.
            </div>

            <div className = "text-center mt-10">
                For any bugs or inquries please contact @ghijj or @ray02_ on discord
            </div>

            <div className="flex justify-center items-center h-full">
                <img className="items-center" src={yujinGif} alt="Your GIF" />
            </div>

            </div>

    );
};

export default About;
