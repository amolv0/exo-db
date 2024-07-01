import React from 'react';
import '../Stylesheets/teamInfo.css';
import { Link } from 'react-router-dom';
import yujinGif from '../Assets/yujin.gif';

const About: React.FC = () => {
    
    return (
        <div className = "pageBackground">
            <div >
            <br></br>
            <div className="mx-3">
                <div className = "text-2xl text-center">
                    About Us
                </div>

                <div className="text-center">
                    We are a team of three college students, two of whom were ex-competitors (2017 - 2021) from&nbsp; 
                    <Link to={`/teams/5226?activeElement=TeamInfo`} className="text-blue-500">
                        10B
                    </Link>
                    &nbsp;and&nbsp;
                    <Link to={`/teams/93544?activeElement=TeamInfo`} className="text-blue-500">
                        353X
                    </Link>
                </div>
                {/*}
                <div className="text-center">
                    <div className="text-2xl font-bold mb-4">More Info</div>

                    <div className="mb-4">
                        Ratings are calculated through trueskill elo.
                    </div>

                    <div className="mb-4">
                        <strong>OPR (Offensive Power Rating):</strong> OPR estimates a team's contribution to their alliance's scoring based on match results and alliance scores.
                    </div>

                    <div className="mb-4">
                        <strong>DPR (Defensive Power Rating):</strong> DPR measures a team's effectiveness in limiting their opponent's alliance from scoring points during matches.
                    </div>

                    <div>
                        <strong>CCWM (Calculated Contribution to Winning Margin):</strong> CCWM assesses a team's overall impact on match outcomes by combining offensive and defensive performance to determine their contribution to winning margins.
                    </div>
                </div> */}

                <div className = "text-center mt-10">
                    For any questions, bugs, or inquries, feel free to contact @ghijj or @ray02_ on discord
                </div>


                <div className="w-full max-w-4xl mx-auto text-center">
                    <h2 className="text-center mt-8 mb-4 text-xl font-semibold">Version Notes</h2>
                    <div className="colorSecondary shadow-md rounded p-4 mb-4 mx-auto max-w-3xl">
                        <h3 className="font-bold text-lg">Version 1.0 - July 1st 2024</h3>
                        <ul className="list-disc list-inside text-left">
                            <li>🎉🎉🎉🎉🎉Launch🎉🎉🎉🎉🎉</li>
                        </ul>
                    </div>
                </div>
                {/*
                <div className="flex justify-center items-center h-full">
                    <img className="items-center" src={yujinGif} alt="Your GIF" />
                </div>
                */}
                <br></br>
                </div>
            </div>
                
        </div>
    );
};

export default About;
