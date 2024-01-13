import React from "react";
import { Link } from "react-router-dom";

import { styles } from "../styles";
import { socials } from "../constants";

// Footer
const Footer = () => {
  return (
    <nav
      className={`${styles.paddingX} w-full flex items-center py-8 bg-primary border-t border-t-white/5`}
    >
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        <p className="text-white text-md font-bold flex">
          &copy; Shubham {new Date().getFullYear()}. All rights reserved.
        </p>

        {/* Nav Links (Desktop) */}
        <ul className="list-none hidden sm:flex flex-row gap-10">
          {socials.map((social) => (
            <li
              key={social.name}
              className="text-secondary font-poppins font-medium cursor-pointer text-[16px]"
            >
              <Link to={social.link} target="_blank" rel="noreferrer noopener">
                <img src={social.icon} alt={social.name} className="h-6 w-6" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Footer;
