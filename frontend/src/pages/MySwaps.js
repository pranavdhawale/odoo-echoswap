import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { FaExchangeAlt, FaList, FaCheck, FaTimes, FaFilter, FaEye, FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const MySwaps = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    try {
      const response = await axios.get('/api/swaps/my-swaps');
      setSwaps(response.data.swaps);
    } catch (error) {
      console.error('Error fetching swaps:', error);
      if (error.response?.status === 401) {
        setMessage({ type: 'danger', text: 'Authentication error. Please try logging in again.' });
      } else if (error.response?.status === 404) {
        setMessage({ type: 'warning', text: 'No swaps found' });
      } else {
        setMessage({ type: 'danger', text: 'Failed to load swaps. Please try refreshing the page.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwapAction = async (swapId, action) => {
    try {
      await axios.put(`/api/swaps/${swapId}/${action}`);
      setMessage({ type: 'success', text: `Swap ${action}ed successfully!` });
      fetchSwaps(); // Refresh the list
    } catch (error) {
      setMessage({ type: 'danger', text: `Failed to ${action} swap` });
    }
  };

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

  const filteredSwaps = swaps.filter(swap => {
    if (statusFilter === 'all') return true;
    return swap.status === statusFilter;
  });

  const showSwapDetails = (swap) => {
    setSelectedSwap(swap);
    setShowDetailsModal(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">My Swaps</h1>
            <p className="lead text-muted">Manage your skill exchange requests</p>
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

      {/* Filter Section */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center">
                <FaFilter className="me-2 text-primary" />
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-control-custom w-auto"
                  style={{ minWidth: '200px' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Swaps List */}
      <Row>
        {filteredSwaps.length > 0 ? (
          filteredSwaps.map(swap => (
            <Col lg={6} className="mb-4" key={swap.id}>
              <Card className="border-0 shadow-custom card-hover">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">
                        {swap.requester_id === user.id ? swap.provider_name : swap.requester_name}
                      </h5>
                      <p className="text-muted small mb-0">
                        {new Date(swap.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(swap.status)}
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold text-success mb-2">You Offer:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {(swap.skills_offered || []).map(skill => (
                        <Badge key={skill.id} bg="success" className="skill-badge">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold text-primary mb-2">You Want:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {(swap.skills_wanted || []).map(skill => (
                        <Badge key={skill.id} bg="primary" className="skill-badge">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {swap.message && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">Message:</h6>
                      <p className="text-muted small mb-0">{swap.message}</p>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => showSwapDetails(swap)}
                      className="btn-outline-gradient"
                    >
                      <FaEye className="me-1" />
                      Details
                    </Button>

                    {swap.status === 'pending' && swap.provider_id === user.id && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleSwapAction(swap.id, 'accept')}
                          className="btn-gradient"
                        >
                          <FaCheck className="me-1" />
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleSwapAction(swap.id, 'reject')}
                        >
                          <FaTimes className="me-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {swap.status === 'accepted' && (
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleSwapAction(swap.id, 'complete')}
                        className="btn-gradient"
                      >
                        <FaCheck className="me-1" />
                        Mark Complete
                      </Button>
                    )}

                    {swap.status === 'pending' && swap.requester_id === user.id && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSwapAction(swap.id, 'cancel')}
                      >
                        <FaTimes className="me-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <div className="text-center py-5">
              <FaExchangeAlt size={64} className="text-muted mb-3" />
              <h4 className="text-muted">No swaps found</h4>
              <p className="text-muted">
                {statusFilter === 'all' 
                  ? "You haven't made any skill swap requests yet." 
                  : `No ${statusFilter} swaps found.`
                }
              </p>
            </div>
          </Col>
        )}
      </Row>

      {/* Swap Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
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
                    {selectedSwap.skills_offered.map(skill => (
                      <Badge key={skill.id} bg="success" className="skill-badge">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-primary">Skills Wanted:</h6>
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {selectedSwap.skills_wanted.map(skill => (
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
                    <strong>Initiator:</strong> {selectedSwap.initiator.name}
                    {selectedSwap.initiator.rating > 0 && (
                      <div className="d-flex align-items-center mt-1">
                        <div className="rating-stars me-2">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={i < Math.round(selectedSwap.initiator.rating) ? 'text-warning' : 'text-muted'} 
                              size={12}
                            />
                          ))}
                        </div>
                        <small className="text-muted">
                          {selectedSwap.initiator.rating ? Number(selectedSwap.initiator.rating).toFixed(1) : '0.0'}
                        </small>
                      </div>
                    )}
                  </div>
                  <div>
                    <strong>Recipient:</strong> {selectedSwap.recipient.name}
                    {selectedSwap.recipient.rating > 0 && (
                      <div className="d-flex align-items-center mt-1">
                        <div className="rating-stars me-2">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={i < Math.round(selectedSwap.recipient.rating) ? 'text-warning' : 'text-muted'} 
                              size={12}
                            />
                          ))}
                        </div>
                        <small className="text-muted">
                          {selectedSwap.recipient.rating ? Number(selectedSwap.recipient.rating).toFixed(1) : '0.0'}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MySwaps; 