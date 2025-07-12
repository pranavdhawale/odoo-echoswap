import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { FaUsers, FaBan, FaCheck, FaSearch, FaEye, FaTrash, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'danger', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      await axios.put(`/api/admin/users/${userId}/${action}`);
      setMessage({ type: 'success', text: `User ${action}ed successfully!` });
      fetchUsers(); // Refresh the list
    } catch (error) {
      setMessage({ type: 'danger', text: `Failed to ${action} user` });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        setMessage({ type: 'success', text: 'User deleted successfully!' });
        fetchUsers();
      } catch (error) {
        setMessage({ type: 'danger', text: 'Failed to delete user' });
      }
    }
  };

  const showUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !search || 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', text: 'Active' },
      banned: { variant: 'danger', text: 'Banned' },
      inactive: { variant: 'secondary', text: 'Inactive' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getRoleBadge = (isAdmin) => {
    return isAdmin ? (
      <Badge bg="warning">Admin</Badge>
    ) : (
      <Badge bg="info">User</Badge>
    );
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
    admins: users.filter(u => u.is_admin).length
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">User Management</h1>
            <p className="lead text-muted">Manage platform users and permissions</p>
          </div>
        </Col>
      </Row>

      {message.text && (
        <Row className="mb-4">
          <Col>
            <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Stats Cards */}
      <Row className="mb-5">
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaUsers size={32} className="text-primary mb-3" />
              <h3 className="fw-bold text-gradient">{stats.total}</h3>
              <p className="text-muted mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaCheck size={32} className="text-success mb-3" />
              <h3 className="fw-bold text-gradient">{stats.active}</h3>
              <p className="text-muted mb-0">Active Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaBan size={32} className="text-danger mb-3" />
              <h3 className="fw-bold text-gradient">{stats.banned}</h3>
              <p className="text-muted mb-0">Banned Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaUsers size={32} className="text-warning mb-3" />
              <h3 className="fw-bold text-gradient">{stats.admins}</h3>
              <p className="text-muted mb-0">Administrators</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="p-4">
              <Row>
                <Col md={6} className="mb-3">
                  <div className="d-flex align-items-center">
                    <FaSearch className="me-2 text-primary" />
                    <Form.Control
                      type="text"
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="form-control-custom"
                    />
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-control-custom"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {user.profile_photo ? (
                            <img 
                              src={user.profile_photo} 
                              alt={user.name}
                              className="rounded-circle me-3"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                                 style={{ width: '40px', height: '40px' }}>
                              <span className="text-white fw-bold small">{user.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{user.name}</div>
                            {user.location && (
                              <small className="text-muted">{user.location}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{getRoleBadge(user.is_admin)}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => showUserDetails(user)}
                            className="btn-outline-gradient"
                          >
                            <FaEye size={12} />
                          </Button>
                          
                          {user.status === 'active' ? (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'ban')}
                            >
                              <FaBan size={12} />
                            </Button>
                          ) : (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'unban')}
                            >
                              <FaCheck size={12} />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <FaTrash size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-5">
                  <FaUsers size={64} className="text-muted mb-3" />
                  <h4 className="text-muted">No users found</h4>
                  <p className="text-muted">Try adjusting your search criteria</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Details Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <Row className="mb-4">
                <Col md={4} className="text-center">
                  {selectedUser.profile_photo ? (
                    <img 
                      src={selectedUser.profile_photo} 
                      alt={selectedUser.name}
                      className="rounded-circle mb-3"
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                         style={{ width: '100px', height: '100px' }}>
                      <span className="text-white fw-bold" style={{ fontSize: '2.5rem' }}>
                        {selectedUser.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <h4>{selectedUser.name}</h4>
                  <p className="text-muted">{selectedUser.email}</p>
                </Col>
                <Col md={8}>
                  <div className="mb-3">
                    <strong>Status:</strong> {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="mb-3">
                    <strong>Role:</strong> {getRoleBadge(selectedUser.is_admin)}
                  </div>
                  <div className="mb-3">
                    <strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}
                  </div>
                  {selectedUser.location && (
                    <div className="mb-3">
                      <strong>Location:</strong> {selectedUser.location}
                    </div>
                  )}
                  {selectedUser.bio && (
                    <div className="mb-3">
                      <strong>Bio:</strong> {selectedUser.bio}
                    </div>
                  )}
                  {selectedUser.rating && selectedUser.rating > 0 && (
                    <div className="mb-3">
                      <strong>Rating:</strong> {Number(selectedUser.rating).toFixed(1)} ({selectedUser.total_ratings || 0} reviews)
                    </div>
                  )}
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <h6 className="fw-bold text-success">Skills Offered:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {selectedUser.skills_offered?.map(skill => (
                      <Badge key={skill.id} bg="success" className="skill-badge">
                        {skill.name}
                      </Badge>
                    )) || <p className="text-muted">No skills offered</p>}
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-primary">Skills Wanted:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {selectedUser.skills_wanted?.map(skill => (
                      <Badge key={skill.id} bg="primary" className="skill-badge">
                        {skill.name}
                      </Badge>
                    )) || <p className="text-muted">No skills wanted</p>}
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers; 