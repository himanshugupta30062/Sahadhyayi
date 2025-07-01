
import { Link } from "react-router-dom";

const NavLogo = () => (
  <Link to="/" className="flex items-center space-x-3 font-bold text-2xl text-gray-800">
    <img
      src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
      alt="Sahadhyayi logo - Digital library platform for deep reading culture"
      className="w-8 h-8 flex-shrink-0"
    />
    <span className="whitespace-nowrap">Sahadhyayi</span>
  </Link>
);

export default NavLogo;
