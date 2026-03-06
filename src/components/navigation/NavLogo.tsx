
import { Link } from "react-router-dom";

const NavLogo = () => (
  <Link to="/" className="flex items-center space-x-3 font-bold text-2xl text-gray-800">
    <img
      src="/lovable-uploads/logo-small.webp"
      alt="Sahadhyayi home logo"
      className="w-8 h-8 flex-shrink-0"
      width={32}
      height={32}
      loading="lazy"
    />
    <span className="whitespace-nowrap">Sahadhyayi</span>
  </Link>
);

export default NavLogo;
