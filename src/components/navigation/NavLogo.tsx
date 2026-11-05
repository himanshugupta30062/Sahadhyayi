import { Link } from "react-router-dom";

const NavLogo = () => (
  <Link
    to="/"
    className="flex items-center space-x-2.5 font-bold text-2xl text-gray-800"
    aria-label="Sahadhyayi home"
  >
    <img
      src="/brand/sahadhyayi-connected-readers.svg"
      alt=""
      aria-hidden="true"
      className="h-9 w-9 flex-shrink-0 object-contain"
      width={36}
      height={36}
      decoding="async"
    />
    <span className="whitespace-nowrap">Sahadhyayi</span>
  </Link>
);

export default NavLogo;
