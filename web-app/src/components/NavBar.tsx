import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Search from '../components/Search';
import '../Stylesheets/colorTheme.css';

const Navbar: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1100);
    const [isSticky, setIsSticky] = useState(false);
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

    useEffect(() => {
        const handleScroll = () => {
            const navbar = document.getElementById('navbar');
            if (navbar) {
                // Calculate the threshold based on your design
                const threshold = 20; // Adjust as needed
                const isNavbarSticky = window.scrollY > threshold;
                setIsSticky(isNavbarSticky);
            }
        };
    
        window.addEventListener('scroll', handleScroll);
    
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const renderDesktopMenu = () => {
        return (
            <div>
                <nav id="navbar" className={`p-2 text-xl transition duration-800  text-white ${isSticky ? 'sticky top-0 z-50 shadow-lg bg-orange-900' : 'colorPrimary '}`}>
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link to="https://www.igniterobotics.org/" target="_blank" rel="noopener noreferrer">
                                <div className="flex items-center transition duration-400 hover:scale-110">
                                    <span className="text-xl mr-2 font-bold">ignite.db</span>
                                    <div>
                                        <span className="text-xs">pre-release 1.15</span>
                                    </div>
                                </div>
                            </Link>
                            <div>|</div>
                            <div className="transition duration-400 hover:text-gray-200 hover:scale-110">
                                <Link to="/">Home</Link>
                            </div>
                            <div>
                                <Search/>
                            </div>
                        </div>
    
                        <ul className="flex space-x-4 ml-auto">
                            <li className="transition duration-400 hover:text-gray-200 hover:scale-110">
                                <Link to="/events">Events</Link>
                            </li>
                            <li className="transition duration-400 hover:text-gray-200 hover:scale-110">
                                <Link to="/skills">Skills</Link>
                            </li>
                            <li className="transition duration-400 hover:text-gray-200 hover:scale-110">
                                <Link to="/rankings">Ratings</Link>
                            </li>
                            <li className="transition duration-400 hover:text-gray-200 hover:scale-110">
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
                <nav id="navbar" className={`p-2 text-xl transition duration-800 ${isSticky ? 'sticky top-0 z-50 shadow-lg bg-white  text-dark_red' : 'colorPrimary text-white '}`}>
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <span className="text-xl mr-2 font-bold">ignite.db</span>
                            <Search/>
                        </div>
                        <select className={`rounded-lg ml-10 ${isSticky ? 'bg-dark_red text-white' : 'bg-white text-dark_red'}`}
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
        <header className="sticky top-0 z-50">
            {isMobile ? renderMobileMenu() : renderDesktopMenu()}
        </header>
    );
};

export default Navbar;
