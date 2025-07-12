import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaShieldAlt, FaChartBar, FaUsers, FaExchangeAlt, FaEnvelope, FaEye, FaCog, FaCheck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      // Map backend response to flat stats for UI
      const data = response.data;
      setStats({
        total_users: data.users?.total_users || 0,
        active_users: (data.users?.total_users || 0) - (data.users?.banned_users || 0),
        total_swaps: data.swaps?.total_swaps || 0,
        pending_swaps: data.swaps?.pending_swaps || 0,
        completed_swaps: data.swaps?.completed_swaps || 0,
        completion_rate: data.swaps && data.swaps.total_swaps ? Math.round(100 * (data.swaps.completed_swaps || 0) / data.swaps.total_swaps) : 0,
        total_messages: data.messages?.total_messages || 0,
        sent_messages: data.messages?.sent_messages || 0,
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage users, ban/unban accounts, and view user details',
      icon: FaUsers,
      link: '/admin/users',
      color: 'primary',
      badge: stats?.total_users || 0,
      badgeText: 'Users'
    },
    {
      title: 'Swap Management',
      description: 'Monitor all skill swaps, manage disputes, and track exchanges',
      icon: FaExchangeAlt,
      link: '/admin/swaps',
      color: 'success',
      badge: stats?.total_swaps || 0,
      badgeText: 'Swaps'
    },
    {
      title: 'Platform Statistics',
      description: 'View detailed analytics, growth metrics, and performance data',
      icon: FaChartBar,
      link: '/admin/stats',
      color: 'info',
      badge: stats?.completed_swaps || 0,
      badgeText: 'Completed'
    },
    {
      title: 'Admin Messages',
      description: 'Send platform-wide announcements and manage notifications',
      icon: FaEnvelope,
      link: '/admin/messages',
      color: 'warning',
      badge: stats?.total_messages || 0,
      badgeText: 'Messages'
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">Admin Dashboard</h1>
            <p className="lead text-muted">Manage the platform and monitor activity</p>
          </div>
        </Col>
      </Row>

      {/* Quick Stats Overview */}
      <Row className="mb-5">
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaUsers size={32} className="text-primary mb-3" />
              <h3 className="fw-bold text-gradient">{stats?.total_users || 0}</h3>
              <p className="text-muted mb-0">Total Users</p>
              <small className="text-success">
                {stats?.active_users || 0} active
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaExchangeAlt size={32} className="text-success mb-3" />
              <h3 className="fw-bold text-gradient">{stats?.total_swaps || 0}</h3>
              <p className="text-muted mb-0">Total Swaps</p>
              <small className="text-warning">
                {stats?.pending_swaps || 0} pending
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaCheck size={32} className="text-info mb-3" />
              <h3 className="fw-bold text-gradient">{stats?.completed_swaps || 0}</h3>
              <p className="text-muted mb-0">Completed</p>
              <small className="text-success">
                {stats?.completion_rate || 0}% rate
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaEnvelope size={32} className="text-warning mb-3" />
              <h3 className="fw-bold text-gradient">{stats?.total_messages || 0}</h3>
              <p className="text-muted mb-0">Messages</p>
              <small className="text-info">
                {stats?.sent_messages || 0} sent
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Admin Features Grid */}
      <Row>
        {adminFeatures.map((feature, index) => (
          <Col lg={6} className="mb-4" key={index}>
            <Card className="border-0 shadow-custom card-hover h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start">
                  <div className={`bg-${feature.color} rounded-circle p-3 me-3`}>
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-1">{feature.title}</h5>
                      <Badge bg={feature.color} className="ms-2">
                        {feature.badge} {feature.badgeText}
                      </Badge>
                    </div>
                    <p className="text-muted mb-3">{feature.description}</p>
                    <Button
                      as={Link}
                      to={feature.link}
                      variant={`outline-${feature.color}`}
                      className="btn-outline-gradient"
                    >
                      <FaEye className="me-2" />
                      Manage {feature.title}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Activity */}
      <Row className="mt-5">
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h4 className="fw-bold mb-0">
                <FaCog className="me-2" />
                Quick Actions
              </h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3">
                  <Button
                    as={Link}
                    to="/admin/users"
                    variant="outline-primary"
                    className="w-100 btn-outline-gradient"
                  >
                    <FaUsers className="me-2" />
                    View All Users
                  </Button>
                </Col>
                <Col md={4} className="mb-3">
                  <Button
                    as={Link}
                    to="/admin/swaps"
                    variant="outline-success"
                    className="w-100 btn-outline-gradient"
                  >
                    <FaExchangeAlt className="me-2" />
                    Monitor Swaps
                  </Button>
                </Col>
                <Col md={4} className="mb-3">
                  <Button
                    as={Link}
                    to="/admin/messages"
                    variant="outline-warning"
                    className="w-100 btn-outline-gradient"
                  >
                    <FaEnvelope className="me-2" />
                    Send Message
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Admin Info */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="text-center p-4">
              <FaShieldAlt size={48} className="text-primary mb-3" />
              <h5 className="fw-bold">Welcome, {user?.name}!</h5>
              <p className="text-muted mb-0">
                You have full administrative access to manage the Skill Swap platform.
                Use the tools above to monitor and maintain the platform.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard; 