import { Link} from 'react-router-dom';
import Search from '../components/Search'
const Navbar: React.FC = () => {

  return (
    <div>
      <div className = "bg-theme_red h-8"></div>
      <nav className="bg-dark_red p-4 text-xl text-white">
      <div className="container mx-auto flex justify-between items-center">
        {/* Powered By */}
        <div className="flex items-center space-x-4">
          {/* First element */}
          <Link to="https://www.igniterobotics.org/" target="_blank" rel="noopener noreferrer">
            <div className="flex items-center transition duration-400 hover:scale-110">
              <span className="text-xl mr-2 font-bold">ignite.db</span>
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
        </ul>
      </div>
      </nav>
    </div>
  );
};

export default Navbar;
