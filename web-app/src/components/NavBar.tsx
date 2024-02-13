import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 p-4 text-xl">
      <div className="container mx-auto flex justify-between items-center">

        <ul className="flex space-x-4">
          <li>
            <div className="text-white text-xl font-bold lg:mr-36">
              <Link to="/">Vex Stats</Link>
            </div>
          </li>
          <li className="text-white">
            <Link to="/">Home</Link>
          </li>
          <li className="text-white">
            <Link to="/teams">Teams</Link>
          </li>
          <li className="text-white">
            <Link to="/events">Events</Link>
          </li>
          <li className="text-white">
            <Link to="/skills">Skills</Link>
          </li>
        </ul>

        {/* Search */}
        <div className="text-white text-xl">
          {/* Adjust the style of the input field as needed */}
          <input type="text" placeholder="Search" className="px-2 py-1 rounded-md bg-gray-700 text-white focus:outline-none" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
