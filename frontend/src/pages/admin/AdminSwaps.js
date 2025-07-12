import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { FaExchangeAlt, FaEye, FaTrash, FaSearch, FaFilter, FaUsers, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminSwaps = () => {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    try {
      const response = await axios.get('/api/admin/swaps');
      setSwaps(response.data.swaps);
    } catch (error) {
      console.error('Error fetching swaps:', error);
      setMessage({ type: 'danger', text: 'Failed to load swaps' });
    } finally {
      setLoading(false);
    }
  };

  const handleSwapAction = async (swapId, action) => {
    try {
      await axios.put(`/api/admin/swaps/${swapId}/${action}`);
      setMessage({ type: 'success', text: `Swap ${action}ed successfully!` });
      fetchSwaps(); // Refresh the list
    } catch (error) {
      setMessage({ type: 'danger', text: `Failed to ${action} swap` });
    }
  };

  const handleDeleteSwap = async (swapId) => {
    if (window.confirm('Are you sure you want to delete this swap? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/swaps/${swapId}`);
        setMessage({ type: 'success', text: 'Swap deleted successfully!' });
        fetchSwaps();
      } catch (error) {
        setMessage({ type: 'danger', text: 'Failed to delete swap' });
      }
    }
  };

  const showSwapDetails = (swap) => {
    setSelectedSwap(swap);
    setShowSwapModal(true);
  };

  const filteredSwaps = swaps.filter(swap => {
    const matchesSearch = !search || 
      swap.requester.name.toLowerCase().includes(search.toLowerCase()) ||
      swap.provider.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || swap.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const stats = {
    total: swaps.length,
    pending: swaps.filter(s => s.status === 'pending').length,
    completed: swaps.filter(s => s.status === 'completed').length,
    active: swaps.filter(s => s.status === 'accepted').length
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">Swap Management</h1>
            <p className="lead text-muted">Monitor and manage all skill swaps</p>
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
              <FaExchangeAlt size={32} className="text-primary mb-3" />
              <h3 className="fw-bold text-gradient">{stats.total}</h3>
              <p className="text-muted mb-0">Total Swaps</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaUsers size={32} className="text-warning mb-3" />
              <h3 className="fw-bold text-gradient">{stats.pending}</h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaCheck size={32} className="text-success mb-3" />
              <h3 className="fw-bold text-gradient">{stats.completed}</h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaExchangeAlt size={32} className="text-info mb-3" />
              <h3 className="fw-bold text-gradient">{stats.active}</h3>
              <p className="text-muted mb-0">Active</p>
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
                      placeholder="Search by user names..."
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
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Swaps Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Initiator</th>
                    <th>Recipient</th>
                    <th>Skills</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSwaps.map(swap => (
                    <tr key={swap.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {swap.requester && swap.requester.profile_photo ? (
                            <img 
                              src={swap.requester.profile_photo} 
                              alt={swap.requester.name}
                              className="rounded-circle me-2"
                              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                                 style={{ width: '32px', height: '32px' }}>
                              <span className="text-white fw-bold small">{swap.requester ? swap.requester.name.charAt(0) : '?'}</span>
                            </div>
                          )}
                          <span className="fw-bold">{swap.requester ? swap.requester.name : 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          {swap.provider && swap.provider.profile_photo ? (
                            <img 
                              src={swap.provider.profile_photo} 
                              alt={swap.provider.name}
                              className="rounded-circle me-2"
                              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                                 style={{ width: '32px', height: '32px' }}>
                              <span className="text-white fw-bold small">{swap.provider ? swap.provider.name.charAt(0) : '?'}</span>
                            </div>
                          )}
                          <span className="fw-bold">{swap.provider ? swap.provider.name : 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div>
                            <small className="text-success fw-bold">Offers:</small>
                            <div className="d-flex flex-wrap gap-1">
                              {(swap.skills_offered || []).slice(0, 2).map(skill => (
                                <Badge key={skill.id} bg="success" className="skill-badge small">
                                  {skill.name}
                                </Badge>
                              ))}
                              {(swap.skills_offered || []).length > 2 && (
                                <Badge bg="secondary" className="small">+{swap.skills_offered.length - 2}</Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <small className="text-primary fw-bold">Wants:</small>
                            <div className="d-flex flex-wrap gap-1">
                              {(swap.skills_wanted || []).slice(0, 2).map(skill => (
                                <Badge key={skill.id} bg="primary" className="skill-badge small">
                                  {skill.name}
                                </Badge>
                              ))}
                              {(swap.skills_wanted || []).length > 2 && (
                                <Badge bg="secondary" className="small">+{swap.skills_wanted.length - 2}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(swap.status)}</td>
                      <td>{new Date(swap.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => showSwapDetails(swap)}
                            className="btn-outline-gradient"
                          >
                            <FaEye size={12} />
                          </Button>
                          
                          {swap.status === 'pending' && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleSwapAction(swap.id, 'accept')}
                              >
                                <FaCheck size={12} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleSwapAction(swap.id, 'reject')}
                              >
                                <FaTimes size={12} />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteSwap(swap.id)}
                          >
                            <FaTrash size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {filteredSwaps.length === 0 && (
                <div className="text-center py-5">
                  <FaExchangeAlt size={64} className="text-muted mb-3" />
                  <h4 className="text-muted">No swaps found</h4>
                  <p className="text-muted">Try adjusting your search criteria</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Swap Details Modal */}
      <Modal show={showSwapModal} onHide={() => setShowSwapModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Swap Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSwap && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="fw-bold text-success">Skills Offered:</h6>
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {(selectedSwap.skills_offered || []).map(skill => (
                      <Badge key={skill.id} bg="success" className="skill-badge">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-primary">Skills Wanted:</h6>
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {(selectedSwap.skills_wanted || []).map(skill => (
                      <Badge key={skill.id} bg="primary" className="skill-badge">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </Col>
              </Row>

              <div className="mb-3">
                <h6 className="fw-bold">Status:</h6>
                {getStatusBadge(selectedSwap.status)}
              </div>

              <div className="mb-3">
                <h6 className="fw-bold">Created:</h6>
                <p className="text-muted">{new Date(selectedSwap.created_at).toLocaleString()}</p>
              </div>

              {selectedSwap.updated_at && selectedSwap.updated_at !== selectedSwap.created_at && (
                <div className="mb-3">
                  <h6 className="fw-bold">Last Updated:</h6>
                  <p className="text-muted">{new Date(selectedSwap.updated_at).toLocaleString()}</p>
                </div>
              )}

              {selectedSwap.message && (
                <div className="mb-3">
                  <h6 className="fw-bold">Message:</h6>
                  <p className="text-muted">{selectedSwap.message}</p>
                </div>
              )}

              <div className="mb-3">
                <h6 className="fw-bold">Participants:</h6>
                <div className="d-flex gap-3">
                  <div>
                    <strong>Initiator:</strong> {selectedSwap.requester ? selectedSwap.requester.name : 'N/A'} ({selectedSwap.requester ? selectedSwap.requester.email : 'N/A'})
                  </div>
                  <div>
                    <strong>Recipient:</strong> {selectedSwap.provider ? selectedSwap.provider.name : 'N/A'} ({selectedSwap.provider ? selectedSwap.provider.email : 'N/A'})
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSwapModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminSwaps; 