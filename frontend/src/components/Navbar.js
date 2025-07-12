import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaCog, FaUsers, FaExchangeAlt, FaChartBar, FaBell } from 'react-icons/fa';

const NavigationBar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar 
      expand="lg" 
      className="navbar-custom shadow-sm"
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-gradient">
          <FaExchangeAlt className="me-2" />
          Skill Swap
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={`fw-medium ${isActive('/') ? 'text-primary' : ''}`}
              onClick={() => setExpanded(false)}
            >
              Home
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/browse" 
              className={`fw-medium ${isActive('/browse') ? 'text-primary' : ''}`}
              onClick={() => setExpanded(false)}
            >
              Browse Users
            </Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/dashboard" 
                  className={`fw-medium ${isActive('/dashboard') ? 'text-primary' : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/my-swaps" 
                  className={`fw-medium ${isActive('/my-swaps') ? 'text-primary' : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  My Swaps
                </Nav.Link>
              </>
            )}
            {isAdmin && (
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className={`fw-medium ${isActive('/admin') ? 'text-primary' : ''}`}
                onClick={() => setExpanded(false)}
              >
                Admin
              </Nav.Link>
            )}
          </Nav>

          <Nav className="ms-auto">
            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="text-decoration-none d-flex align-items-center">
                  <div className="d-flex align-items-center">
                    {user?.profile_photo ? (
                      <img 
                        src={user.profile_photo} 
                        alt="Profile" 
                        className="rounded-circle me-2"
                        style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                           style={{ width: '32px', height: '32px' }}>
                        <FaUser className="text-white" size={16} />
                      </div>
                    )}
                    <span className="fw-medium text-dark">{user?.name}</span>
                    {isAdmin && (
                      <Badge bg="danger" className="ms-2">Admin</Badge>
                    )}
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className="border-0 shadow-lg">
                  <Dropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)}>
                    <FaCog className="me-2" />
                    Profile Settings
                  </Dropdown.Item>
                  {isAdmin && (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} to="/admin/users" onClick={() => setExpanded(false)}>
                        <FaUsers className="me-2" />
                        Manage Users
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/admin/stats" onClick={() => setExpanded(false)}>
                        <FaChartBar className="me-2" />
                        Platform Stats
                      </Dropdown.Item>
                    </>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Button 
                  as={Link} 
                  to="/login" 
                  variant="outline-primary" 
                  className="btn-outline-gradient"
                  onClick={() => setExpanded(false)}
                >
                  Login
                </Button>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="primary" 
                  className="btn-gradient"
                  onClick={() => setExpanded(false)}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar; 