import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { FaExchangeAlt, FaUsers, FaStar, FaShieldAlt, FaRocket, FaHeart, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [popularSkills, setPopularSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, skillsRes] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/skills/popular/list')
        ]);
        setStats(statsRes.data);
        setPopularSkills(skillsRes.data.skills.slice(0, 6));
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: <FaExchangeAlt size={40} />,
      title: 'Skill Exchange',
      description: 'Connect with others to exchange your skills and learn new ones in return.'
    },
    {
      icon: <FaUsers size={40} />,
      title: 'Community',
      description: 'Join a vibrant community of learners and teachers from around the world.'
    },
    {
      icon: <FaStar size={40} />,
      title: 'Ratings & Reviews',
      description: 'Build your reputation through honest feedback and ratings from other users.'
    },
    {
      icon: <FaShieldAlt size={40} />,
      title: 'Safe & Secure',
      description: 'Your data is protected with industry-standard security measures.'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="fade-in-up">
                <h1 className="display-4 fw-bold text-white mb-4">
                  Exchange Skills, <br />
                  <span className="text-gradient">Learn Together</span>
                </h1>
                <p className="lead text-white-50 mb-4">
                  Connect with people who have the skills you want to learn, and share your expertise in return. 
                  Build meaningful relationships while expanding your knowledge.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <Button 
                    as={Link} 
                    to="/browse" 
                    variant="light" 
                    size="lg"
                    className="btn-gradient"
                  >
                    <FaUsers className="me-2" />
                    Browse Users
                  </Button>
                  {!isAuthenticated && (
                    <Button 
                      as={Link} 
                      to="/register" 
                      variant="outline-light" 
                      size="lg"
                    >
                      <FaRocket className="me-2" />
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-center">
                  <FaExchangeAlt size={200} className="text-white-50" />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Guest Mode Alert */}
      {!isAuthenticated && (
        <section className="py-3 bg-light">
          <Container>
            <Alert variant="info" className="mb-0 border-0">
              <FaLock className="me-2" />
              <strong>Guest Mode:</strong> You can browse users and view profiles, but you'll need to log in to request skill swaps and access all features.
            </Alert>
          </Container>
        </section>
      )}

      {/* Stats Section */}
      {!loading && stats && (
        <section className="py-5 bg-light">
          <Container>
            <Row className="text-center">
              <Col md={3} className="mb-4">
                <div className="fade-in-up">
                  <h2 className="text-gradient fw-bold">{stats.users.total_users}</h2>
                  <p className="text-muted">Active Users</p>
                </div>
              </Col>
              <Col md={3} className="mb-4">
                <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <h2 className="text-gradient fw-bold">{stats.swaps.total_swaps}</h2>
                  <p className="text-muted">Skill Swaps</p>
                </div>
              </Col>
              <Col md={3} className="mb-4">
                <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <h2 className="text-gradient fw-bold">{stats.swaps.completed_swaps}</h2>
                  <p className="text-muted">Completed</p>
                </div>
              </Col>
              <Col md={3} className="mb-4">
                <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <h2 className="text-gradient fw-bold">{stats.ratings.total_ratings}</h2>
                  <p className="text-muted">Reviews</p>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">Why Choose Skill Swap?</h2>
              <p className="lead text-muted">Discover the benefits of our platform</p>
            </Col>
          </Row>
          <Row>
            {features.map((feature, index) => (
              <Col lg={3} md={6} className="mb-4" key={index}>
                <Card className="h-100 border-0 shadow-custom card-hover">
                  <Card.Body className="text-center p-4">
                    <div className="mb-3 text-primary">
                      {feature.icon}
                    </div>
                    <Card.Title className="fw-bold mb-3">{feature.title}</Card.Title>
                    <Card.Text className="text-muted">{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Popular Skills Section */}
      {!loading && popularSkills.length > 0 && (
        <section className="py-5 bg-light">
          <Container>
            <Row className="text-center mb-5">
              <Col>
                <h2 className="display-5 fw-bold mb-3">Popular Skills</h2>
                <p className="lead text-muted">Most requested and offered skills on our platform</p>
              </Col>
            </Row>
            <Row>
              {popularSkills.map((skill, index) => (
                <Col lg={4} md={6} className="mb-4" key={skill.id}>
                  <Card className="border-0 shadow-custom card-hover">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold mb-0">{skill.name}</h5>
                        <Badge bg="primary">{skill.category}</Badge>
                      </div>
                      <p className="text-muted mb-3">{skill.description}</p>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>
                          <FaUsers className="me-1" />
                          {skill.offered_count} offering
                        </span>
                        <span>
                          <FaHeart className="me-1" />
                          {skill.wanted_count} wanted
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            <Row className="text-center mt-4">
              <Col>
                <Button 
                  as={Link} 
                  to="/browse" 
                  variant="primary" 
                  size="lg" 
                  className="btn-gradient"
                >
                  Browse All Skills
                </Button>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <div className="glass-card p-5">
                <h2 className="display-5 fw-bold mb-4">Ready to Start Swapping Skills?</h2>
                <p className="lead mb-4">
                  Join thousands of users who are already learning and teaching through skill exchanges.
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Button 
                    as={Link} 
                    to="/register" 
                    size="lg" 
                    className="btn-gradient"
                  >
                    Create Account
                  </Button>
                  <Button 
                    as={Link} 
                    to="/login" 
                    size="lg" 
                    variant="outline-primary"
                    className="btn-outline-gradient"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home; 