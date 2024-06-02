import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Search from '../components/Search';

const Navbar: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1100);

    const location = useLocation();

    const handleResize = () => {
        setIsMobile(window.innerWidth < 1100);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const renderDesktopMenu = () => {
        return (
            <div>
                <nav style={{ backgroundColor: '#273746'}} className="p-2 text-xl text-white">
                    <div className="container mx-auto flex justify-between items-center">
                        {/* Powered By */}
                        <div className="flex items-center space-x-4">
                            {/* First element */}
                            <Link to="https://www.igniterobotics.org/" target="_blank" rel="noopener noreferrer">
                                <div className="flex items-center transition duration-400 hover:scale-110">
                                <span className="text-xl mr-2 font-bold">ignite.db</span>
                                <div>
                                    <span className="text-xs">pre-release 1.6</span>
                                </div>
                            </div>
                            </Link>
                            <div>
                                |
                            </div>
                            {/* Second element */}
                            <div className="text-white transition duration-400 hover:text-gray-200  hover:scale-110">
                                <Link to="/">Home</Link>
                            </div>
                            <div>
                                <Search/>
                            </div>
                        </div>
    
                        {/* Navigation Links */}
                        <ul className="flex space-x-4 ml-auto">
                            <li className="text-white transition duration-400 hover:text-gray-200  hover:scale-110">
                                <Link to="/events">Events</Link>
                            </li>
                            <li className="text-white transition duration-400 hover:text-gray-200 hover:scale-110">
                                <Link to="/skills">Skills</Link>
                            </li>
                            <li className="text-white transition duration-400 hover:text-gray-200  hover:scale-110">
                                <Link to="/rankings">Ratings</Link>
                            </li>
                            <li className="text-white transition duration-400 hover:text-gray-200  hover:scale-110">
                                <Link to="/about">About</Link>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>
        )
    };

    const renderMobileMenu = () => {
        return (
            <div>
                <nav style={{ backgroundColor: '#162733'}} className="p-4 text-xl text-white">
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <span className="text-xl mr-2 font-bold">ignite.db</span>
                            <Search></Search>
                        </div>
                        <select className="bg-dark_red text-white ml-10" 
                            value={location.pathname}
                            onChange={(e) => window.location.href = e.target.value}>
                            <option value="/">Home</option>
                            <option value="/events">Events</option>
                            <option value="/skills">Skills</option>
                            <option value="/rankings">Ratings</option>
                            <option value="/about">About</option>
                        </select>
                    </div>
                </nav>
            </div>
        );
    };

    return (
        <div>
            {isMobile ? renderMobileMenu() : renderDesktopMenu()}
        </div>
    );
};

export default Navbar;
