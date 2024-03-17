import '../../Stylesheets/dropdown.css';

interface OngoingDropdownProps {
    setOngoing: (Ongoing: string) => void;
    ongoing : string;
}

const OngoingDropdown: React.FC<OngoingDropdownProps> = ({ setOngoing, ongoing}) => {
    return (
    <label className="flex items-center space-x-1 ">
        <input
            type="checkbox"
            checked={ongoing === 'ongoing'}
            onChange={(e) => setOngoing(e.target.checked ? 'ongoing' : '')}
            className="h-4 w-4 rounded-full appearance-none outline-none focus:ring-0 cursor-pointer"
            style={{
            backgroundColor: ongoing ? '#84202A' : 'transparent',
            border: ongoing ? 'none' : '2px solid #84202A',
            }}
        />
        <span className="buttonText">Ongoing</span>
    </label>
    );
}

export default OngoingDropdown;
