import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container ml-4 lg:ml-40 xl:ml-60 2xl:ml-80">
        <div className="flex items-center">
          {/* Logo or Brand */}
          <div className="text-white text-xl font-bold mr-10">
            <a href="/">Vex Stats</a>
          </div>

          {/* Navigation Links */}
          <ul className="flex space-x-4">
            <li className="text-white">
                <a href="/">Home</a> </li>
            <li className="text-white">
                <a href="/teams">Teams</a> </li>
            <li className="text-white">
                <a href="/events">Events</a>
            </li> <li className="text-white">
                <a href="/skills">Skills</a> </li>
          </ul>
          <div className="text-white text-xl flex mx-auto">
            <h1>Search Placeholder</h1>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;