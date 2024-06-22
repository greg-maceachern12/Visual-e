import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.scss";

const Navbar = ({
  user,
  isDropdownOpen,
  toggleDropdown,
  handleSignOut,
  handleDownloadSampleBook,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const linkText = user ? user.user_metadata.name : "Sign In";
  const linkTo = user ? "/account" : "/auth";

  return (
    <div className={`navbar ${isMenuOpen ? "menu-open" : ""}`}>
      <Link to="/" className="link-button">
        <div className="logo-container">
          <img src="logo.png" alt="Visuai Logo" className="logo" />
          <h1>Visuai</h1>
        </div>
      </Link>
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <Link to="/" className="nav-link" onClick={toggleMenu}>
          Home
        </Link>
        <Link to="/about" className="nav-link" onClick={toggleMenu}>
          About
        </Link>
        <button
          onClick={() => {
            handleDownloadSampleBook();
            toggleMenu();
          }}
          className="nav-link"
        >
          Download an ePub
        </button>
        <a
          className="nav-link"
          href={`mailto:greg@visuai.io?subject=Issues%20Generating%20Book&body=-%20This%20was%20broken%3A%0A-%20This%20is%20how%20it%20should%20have%20worked%3A%0A-%20Images%20or%20console%20errors%20(optional)%3A`}
          onClick={toggleMenu}
        >
          Issues?
        </a>
        <div className="nav-link">
          <Link className ='nav-link'to={linkTo} className="user-link">
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
