import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, InputGroup, Alert } from 'react-bootstrap';
import { FaSearch, FaMapMarkerAlt, FaStar, FaExchangeAlt, FaLock } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const BrowseUsers = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, skillsRes] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/skills')
        ]);
        setUsers(usersRes.data.users);
        setSkills(skillsRes.data.skills);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't show error for public endpoints, just log it
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = !search || 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      (user.location && user.location.toLowerCase().includes(search.toLowerCase()));
    
    const matchesSkill = !skillFilter || 
      user.skills_offered.some(skill => skill.name.toLowerCase().includes(skillFilter.toLowerCase())) ||
      user.skills_wanted.some(skill => skill.name.toLowerCase().includes(skillFilter.toLowerCase()));
    
    return matchesSearch && matchesSkill;
  });

  const handleViewProfile = (userId) => {
    if (isAuthenticated) {
      navigate(`/user/${userId}`);
    } else {
      // Show login prompt
      navigate('/login', { state: { message: 'Please log in to view user profiles and request skill swaps' } });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">Browse Users</h1>
            <p className="lead text-muted">Find people to exchange skills with</p>
            {!isAuthenticated && (
              <Alert variant="info" className="mt-3">
                <FaLock className="me-2" />
                <strong>Guest Mode:</strong> You can browse users, but you'll need to log in to view profiles and request skill swaps.
              </Alert>
            )}
          </div>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="p-4">
              <Row>
                <Col md={6} className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by name or location..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-control-custom"
                    />
                  </InputGroup>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Select
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    className="form-control-custom"
                  >
                    <option value="">All Skills</option>
                    {skills.map(skill => (
                      <option key={skill.id} value={skill.name}>
                        {skill.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Users Grid */}
      <Row>
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <Col lg={4} md={6} className="mb-4" key={user.id}>
              <Card className="user-card h-100">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    {user.profile_photo ? (
                      <img 
                        src={user.profile_photo} 
                        alt={user.name}
                        className="rounded-circle me-3"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{ width: '60px', height: '60px' }}>
                        <span className="text-white fw-bold">{user.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <h5 className="fw-bold mb-1">{user.name}</h5>
                      {user.location && (
                        <p className="text-muted small mb-0">
                          <FaMapMarkerAlt className="me-1" />
                          {user.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {user.rating > 0 && (
                    <div className="mb-3">
                      <div className="rating-stars">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.round(user.rating) ? 'text-warning' : 'text-muted'} 
                          />
                        ))}
                      </div>
                      <small className="text-muted">
                        {user.rating ? Number(user.rating).toFixed(1) : '0.0'} ({user.total_ratings || 0} reviews)
                      </small>
                    </div>
                  )}

                  <div className="mb-3">
                    <h6 className="fw-bold text-success mb-2">Offers:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {user.skills_offered.slice(0, 3).map(skill => (
                        <Badge key={skill.id} bg="success" className="skill-badge">
                          {skill.name}
                        </Badge>
                      ))}
                      {user.skills_offered.length > 3 && (
                        <Badge bg="secondary">+{user.skills_offered.length - 3} more</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold text-primary mb-2">Wants:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {user.skills_wanted.slice(0, 3).map(skill => (
                        <Badge key={skill.id} bg="primary" className="skill-badge">
                          {skill.name}
                        </Badge>
                      ))}
                      {user.skills_wanted.length > 3 && (
                        <Badge bg="secondary">+{user.skills_wanted.length - 3} more</Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleViewProfile(user.id)}
                    variant={isAuthenticated ? "primary" : "outline-primary"}
                    className={`w-100 ${isAuthenticated ? 'btn-gradient' : ''}`}
                  >
                    {isAuthenticated ? (
                      <>
                        <FaExchangeAlt className="me-2" />
                        View Profile
                      </>
                    ) : (
                      <>
                        <FaLock className="me-2" />
                        Login to View Profile
                      </>
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <div className="text-center py-5">
              <FaSearch size={64} className="text-muted mb-3" />
              <h4 className="text-muted">No users found</h4>
              <p className="text-muted">Try adjusting your search criteria</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default BrowseUsers; 