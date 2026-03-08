import React from "react";
import { Link, useLocation } from "react-router-dom";

const DesktopNavItems = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/library", label: "Library" },
    { path: "/blog", label: "Publish" },
    { path: "/games", label: "Games" },
    { path: "/authors", label: "Authors" },
    { path: "/social", label: "Social Media" },
    { path: "/bookshelf", label: "My Books" },
  ];

  return (
    <div className="hidden md:flex items-center space-x-8">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`text-sm font-medium transition-colors hover:text-orange-600 ${
            isActive(item.path) ? "text-orange-600" : "text-gray-700"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default DesktopNavItems;
