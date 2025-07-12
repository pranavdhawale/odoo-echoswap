import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import { FaChartBar, FaUsers, FaExchangeAlt, FaStar, FaCalendar, FaArrowUp, FaArrowDown, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getGrowthIcon = (percentage) => {
    const num = parseFloat(percentage);
    return num > 0 ? <FaArrowUp className="text-success" /> : <FaArrowDown className="text-danger" />;
  };

  const getTopSkills = () => {
    if (!stats?.top_skills) return [];
    return stats.top_skills.slice(0, 5);
  };

  const getRecentActivity = () => {
    if (!stats?.recent_activity) return [];
    return stats.recent_activity.slice(0, 10);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h4 className="text-muted">Failed to load statistics</h4>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">Platform Statistics</h1>
            <p className="lead text-muted">View detailed analytics and insights</p>
          </div>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row className="mb-5">
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaUsers size={32} className="text-primary mb-3" />
              <h3 className="fw-bold text-gradient">{stats.total_users}</h3>
              <p className="text-muted mb-2">Total Users</p>
              <div className="d-flex align-items-center justify-content-center">
                {getGrowthIcon(getGrowthPercentage(stats.total_users, stats.previous_total_users))}
                <small className="ms-1">
                  {getGrowthPercentage(stats.total_users, stats.previous_total_users)}% from last month
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaExchangeAlt size={32} className="text-success mb-3" />
              <h3 className="fw-bold text-gradient">{stats.total_swaps}</h3>
              <p className="text-muted mb-2">Total Swaps</p>
              <div className="d-flex align-items-center justify-content-center">
                {getGrowthIcon(getGrowthPercentage(stats.total_swaps, stats.previous_total_swaps))}
                <small className="ms-1">
                  {getGrowthPercentage(stats.total_swaps, stats.previous_total_swaps)}% from last month
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaCheck size={32} className="text-info mb-3" />
              <h3 className="fw-bold text-gradient">{stats.completed_swaps}</h3>
              <p className="text-muted mb-2">Completed Swaps</p>
              <div className="d-flex align-items-center justify-content-center">
                {getGrowthIcon(getGrowthPercentage(stats.completed_swaps, stats.previous_completed_swaps))}
                <small className="ms-1">
                  {getGrowthPercentage(stats.completed_swaps, stats.previous_completed_swaps)}% from last month
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaStar size={32} className="text-warning mb-3" />
              <h3 className="fw-bold text-gradient">{stats.avg_rating?.toFixed(1) || '0.0'}</h3>
              <p className="text-muted mb-2">Average Rating</p>
              <div className="d-flex align-items-center justify-content-center">
                <small className="text-muted">
                  {stats.total_ratings || 0} total ratings
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Swap Status Distribution */}
        <Col lg={6} className="mb-5">
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h4 className="fw-bold mb-0">
                <FaExchangeAlt className="me-2" />
                Swap Status Distribution
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">Pending</span>
                  <Badge bg="warning">{stats.swap_status?.pending || 0}</Badge>
                </div>
                <ProgressBar 
                  variant="warning" 
                  now={((stats.swap_status?.pending || 0) / stats.total_swaps * 100) || 0} 
                  className="mb-3"
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">Accepted</span>
                  <Badge bg="success">{stats.swap_status?.accepted || 0}</Badge>
                </div>
                <ProgressBar 
                  variant="success" 
                  now={((stats.swap_status?.accepted || 0) / stats.total_swaps * 100) || 0} 
                  className="mb-3"
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">Completed</span>
                  <Badge bg="info">{stats.swap_status?.completed || 0}</Badge>
                </div>
                <ProgressBar 
                  variant="info" 
                  now={((stats.swap_status?.completed || 0) / stats.total_swaps * 100) || 0} 
                  className="mb-3"
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">Rejected</span>
                  <Badge bg="danger">{stats.swap_status?.rejected || 0}</Badge>
                </div>
                <ProgressBar 
                  variant="danger" 
                  now={((stats.swap_status?.rejected || 0) / stats.total_swaps * 100) || 0} 
                  className="mb-3"
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Top Skills */}
        <Col lg={6} className="mb-5">
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h4 className="fw-bold mb-0">
                <FaStar className="me-2" />
                Most Popular Skills
              </h4>
            </Card.Header>
            <Card.Body>
              {getTopSkills().map((skill, index) => (
                <div key={skill.id} className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <Badge bg="primary" className="me-3">{index + 1}</Badge>
                    <span className="fw-bold">{skill.name}</span>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold">{skill.count} users</div>
                    <small className="text-muted">
                      {((skill.count / stats.total_users) * 100).toFixed(1)}% of users
                    </small>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Growth Chart */}
      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h4 className="fw-bold mb-0">
                <FaArrowUp className="me-2" />
                User Growth (Last 6 Months)
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                {stats.user_growth?.map((month, index) => (
                  <div key={index} className="text-center">
                    <div className="fw-bold">{month.count}</div>
                    <small className="text-muted">{month.month}</small>
                  </div>
                )) || (
                  <div className="text-center w-100">
                    <p className="text-muted">No growth data available</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h4 className="fw-bold mb-0">
                <FaCalendar className="me-2" />
                Recent Activity
              </h4>
            </Card.Header>
            <Card.Body>
              {getRecentActivity().length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Activity</th>
                        <th>User</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRecentActivity().map((activity, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              {activity.type === 'swap_created' && <FaExchangeAlt className="text-primary me-2" />}
                              {activity.type === 'swap_completed' && <FaCheck className="text-success me-2" />}
                              {activity.type === 'user_registered' && <FaUsers className="text-info me-2" />}
                              <span>{activity.description}</span>
                            </div>
                          </td>
                          <td>{activity.user_name}</td>
                          <td>{new Date(activity.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaCalendar size={48} className="text-muted mb-3" />
                  <p className="text-muted">No recent activity</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminStats; 