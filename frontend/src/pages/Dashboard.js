import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, ProgressBar } from 'react-bootstrap';
import { FaPlus, FaExchangeAlt, FaStar, FaUsers, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState({ skills_offered: [], skills_wanted: [] });
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [skillsRes, swapsRes] = await Promise.all([
          axios.get('/api/users/me/skills'),
          axios.get('/api/swaps/my-swaps')
        ]);
        setSkills(skillsRes.data);
        setSwaps(swapsRes.data.swaps);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'Pending' },
      accepted: { variant: 'success', text: 'Accepted' },
      completed: { variant: 'info', text: 'Completed' },
      rejected: { variant: 'danger', text: 'Rejected' },
      cancelled: { variant: 'secondary', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const recentSwaps = swaps.slice(0, 5);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      {/* Welcome Section */}
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="lead text-muted">
              Here's what's happening with your skill exchanges
            </p>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-5">
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaExchangeAlt size={32} className="text-primary mb-3" />
              <h3 className="fw-bold text-gradient">{swaps.length}</h3>
              <p className="text-muted mb-0">Total Swaps</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaClock size={32} className="text-warning mb-3" />
              <h3 className="fw-bold text-gradient">
                {swaps.filter(s => s.status === 'pending').length}
              </h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaCheckCircle size={32} className="text-success mb-3" />
              <h3 className="fw-bold text-gradient">
                {swaps.filter(s => s.status === 'completed').length}
              </h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaStar size={32} className="text-warning mb-3" />
              <h3 className="fw-bold text-gradient">{user?.rating || 0}</h3>
              <p className="text-muted mb-0">Rating</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Skills Section */}
        <Col lg={6} className="mb-5">
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="fw-bold mb-0">Your Skills</h4>
                <Button 
                  as={Link} 
                  to="/profile" 
                  variant="outline-primary" 
                  size="sm"
                  className="btn-outline-gradient"
                >
                  <FaPlus className="me-1" />
                  Manage Skills
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6 className="fw-bold text-success mb-3">
                  <FaUsers className="me-2" />
                  Skills You Offer ({skills.skills_offered.length})
                </h6>
                {skills.skills_offered.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {skills.skills_offered.map(skill => (
                      <Badge 
                        key={skill.id} 
                        bg="success" 
                        className="skill-badge"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No skills offered yet. Add some skills to get started!</p>
                )}
              </div>

              <div>
                <h6 className="fw-bold text-primary mb-3">
                  <FaStar className="me-2" />
                  Skills You Want ({skills.skills_wanted.length})
                </h6>
                {skills.skills_wanted.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {skills.skills_wanted.map(skill => (
                      <Badge 
                        key={skill.id} 
                        bg="primary" 
                        className="skill-badge"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No skills wanted yet. Add skills you'd like to learn!</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Swaps */}
        <Col lg={6} className="mb-5">
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="fw-bold mb-0">Recent Swaps</h4>
                <Button 
                  as={Link} 
                  to="/my-swaps" 
                  variant="outline-primary" 
                  size="sm"
                  className="btn-outline-gradient"
                >
                  View All
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {recentSwaps.length > 0 ? (
                <div>
                  {recentSwaps.map(swap => (
                    <div key={swap.id} className="border-bottom pb-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold mb-1">
                            <span className="me-2">
                              {(swap.skills_offered || []).map(skill => (
                                <Badge key={skill.id} bg="success" className="skill-badge me-1">{skill.name}</Badge>
                              ))}
                            </span>
                            <span className="mx-1">↔</span>
                            <span>
                              {(swap.skills_wanted || []).map(skill => (
                                <Badge key={skill.id} bg="primary" className="skill-badge me-1">{skill.name}</Badge>
                              ))}
                            </span>
                          </h6>
                          <p className="text-muted small mb-0">
                            with {swap.requester_id === user?.id ? swap.provider_name : swap.requester_name}
                          </p>
                        </div>
                        {getStatusBadge(swap.status)}
                      </div>
                      <small className="text-muted">
                        {new Date(swap.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaExchangeAlt size={48} className="text-muted mb-3" />
                  <p className="text-muted">No swaps yet. Start by browsing users!</p>
                  <Button 
                    as={Link} 
                    to="/browse" 
                    variant="primary"
                    className="btn-gradient"
                  >
                    Browse Users
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="p-4">
              <h4 className="fw-bold mb-4">Quick Actions</h4>
              <Row>
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/browse" 
                    variant="primary" 
                    className="w-100 btn-gradient"
                  >
                    <FaUsers className="me-2" />
                    Browse Users
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/profile" 
                    variant="outline-primary" 
                    className="w-100 btn-outline-gradient"
                  >
                    <FaPlus className="me-2" />
                    Update Profile
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/my-swaps" 
                    variant="outline-success" 
                    className="w-100"
                  >
                    <FaExchangeAlt className="me-2" />
                    View Swaps
                  </Button>
                </Col>
                <Col md={3} className="mb-3">
                  <Button 
                    as={Link} 
                    to="/browse" 
                    variant="outline-info" 
                    className="w-100"
                  >
                    <FaStar className="me-2" />
                    Find Skills
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 