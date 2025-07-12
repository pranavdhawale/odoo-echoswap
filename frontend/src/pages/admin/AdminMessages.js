import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Table, Badge } from 'react-bootstrap';
import { FaEnvelope, FaPlus, FaEdit, FaTrash, FaEye, FaPaperPlane, FaCalendar } from 'react-icons/fa';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  // Allowed types for admin messages
  const typeOptions = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'alert', label: 'Alert' }
  ];
  // In the messageData state, set default type to 'info'
  const [messageData, setMessageData] = useState({ title: '', content: '', type: 'info', priority: 'normal' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/admin/messages');
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessage({ type: 'danger', text: 'Failed to load messages' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/api/admin/messages', {
        title: messageData.title,
        message: messageData.content,
        type: messageData.type
      });
      setMessage({ type: 'success', text: 'Message created successfully!' });
      setShowCreateModal(false);
      setMessageData({ title: '', content: '', type: 'info', priority: 'normal' });
      fetchMessages();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to create message' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditMessage = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(`/api/admin/messages/${selectedMessage.id}`, {
        title: messageData.title,
        message: messageData.content,
        type: messageData.type,
        is_active: selectedMessage.is_active
      });
      setMessage({ type: 'success', text: 'Message updated successfully!' });
      setShowEditModal(false);
      setSelectedMessage(null);
      setMessageData({ title: '', content: '', type: 'info', priority: 'normal' });
      fetchMessages();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to update message' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/messages/${messageId}`);
        setMessage({ type: 'success', text: 'Message deleted successfully!' });
        fetchMessages();
      } catch (error) {
        setMessage({ type: 'danger', text: 'Failed to delete message' });
      }
    }
  };

  const handleSendMessage = async (messageId) => {
    try {
      await axios.post(`/api/admin/messages/${messageId}/send`);
      setMessage({ type: 'success', text: 'Message sent to all users successfully!' });
      fetchMessages();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to send message' });
    }
  };

  const openEditModal = (msg) => {
    setSelectedMessage(msg);
    setMessageData({
      title: msg.title,
      content: msg.message,
      type: msg.type,
      priority: msg.priority
    });
    setShowEditModal(true);
  };

  const openViewModal = (msg) => {
    setSelectedMessage(msg);
    setShowViewModal(true);
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      announcement: { variant: 'primary', text: 'Announcement' },
      notification: { variant: 'info', text: 'Notification' },
      warning: { variant: 'warning', text: 'Warning' },
      maintenance: { variant: 'danger', text: 'Maintenance' }
    };
    
    const config = typeConfig[type] || { variant: 'secondary', text: type };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { variant: 'success', text: 'Low' },
      normal: { variant: 'info', text: 'Normal' },
      high: { variant: 'warning', text: 'High' },
      urgent: { variant: 'danger', text: 'Urgent' }
    };
    
    const config = priorityConfig[priority] || { variant: 'secondary', text: priority };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getStatusBadge = (sent) => {
    return sent ? (
      <Badge bg="success">Sent</Badge>
    ) : (
      <Badge bg="warning">Draft</Badge>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">Admin Messages</h1>
            <p className="lead text-muted">Send platform-wide announcements</p>
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
              <FaEnvelope size={32} className="text-primary mb-3" />
              <h3 className="fw-bold text-gradient">{messages.length}</h3>
              <p className="text-muted mb-0">Total Messages</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaPaperPlane size={32} className="text-success mb-3" />
              <h3 className="fw-bold text-gradient">
                {messages.filter(m => m.sent).length}
              </h3>
              <p className="text-muted mb-0">Sent Messages</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaEdit size={32} className="text-warning mb-3" />
              <h3 className="fw-bold text-gradient">
                {messages.filter(m => !m.sent).length}
              </h3>
              <p className="text-muted mb-0">Draft Messages</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="border-0 shadow-custom card-hover">
            <Card.Body className="text-center p-4">
              <FaEnvelope size={32} className="text-info mb-3" />
              <h3 className="fw-bold text-gradient">
                {messages.filter(m => m.type === 'announcement').length}
              </h3>
              <p className="text-muted mb-0">Announcements</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Message Button */}
      <Row className="mb-4">
        <Col>
          <Button
            variant="primary"
            className="btn-gradient"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus className="me-2" />
            Create New Message
          </Button>
        </Col>
      </Row>

      {/* Messages Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-custom">
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map(msg => (
                    <tr key={msg.id}>
                      <td>
                        <div>
                          <div className="fw-bold">{msg.title}</div>
                          <small className="text-muted">
                            {msg.message ? msg.message.substring(0, 50) + '...' : ''}
                          </small>
                        </div>
                      </td>
                      <td>{getTypeBadge(msg.type)}</td>
                      <td>{getPriorityBadge(msg.priority)}</td>
                      <td>{getStatusBadge(msg.sent)}</td>
                      <td>{new Date(msg.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openViewModal(msg)}
                            className="btn-outline-gradient"
                          >
                            <FaEye size={12} />
                          </Button>
                          
                          {!msg.sent && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => openEditModal(msg)}
                            >
                              <FaEdit size={12} />
                            </Button>
                          )}
                          
                          {!msg.sent && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleSendMessage(msg.id)}
                            >
                              <FaPaperPlane size={12} />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteMessage(msg.id)}
                          >
                            <FaTrash size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {messages.length === 0 && (
                <div className="text-center py-5">
                  <FaEnvelope size={64} className="text-muted mb-3" />
                  <h4 className="text-muted">No messages found</h4>
                  <p className="text-muted">Create your first platform message</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Message Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateMessage}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={messageData.title}
                onChange={(e) => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="form-control-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={messageData.content}
                onChange={(e) => setMessageData(prev => ({ ...prev, content: e.target.value }))}
                required
                className="form-control-custom"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={messageData.type}
                    onChange={(e) => setMessageData(prev => ({ ...prev, type: e.target.value }))}
                    className="form-control-custom"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={messageData.priority}
                    onChange={(e) => setMessageData(prev => ({ ...prev, priority: e.target.value }))}
                    className="form-control-custom"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateMessage}
            disabled={saving}
            className="btn-gradient"
          >
            {saving ? 'Creating...' : 'Create Message'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Message Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditMessage}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={messageData.title}
                onChange={(e) => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="form-control-custom"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={messageData.content}
                onChange={(e) => setMessageData(prev => ({ ...prev, content: e.target.value }))}
                required
                className="form-control-custom"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={messageData.type}
                    onChange={(e) => setMessageData(prev => ({ ...prev, type: e.target.value }))}
                    className="form-control-custom"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={messageData.priority}
                    onChange={(e) => setMessageData(prev => ({ ...prev, priority: e.target.value }))}
                    className="form-control-custom"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditMessage}
            disabled={saving}
            className="btn-gradient"
          >
            {saving ? 'Updating...' : 'Update Message'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Message Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Message Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMessage && (
            <div>
              <div className="mb-3">
                <h5>{selectedMessage.title}</h5>
                <div className="d-flex gap-2 mb-2">
                  {getTypeBadge(selectedMessage.type)}
                  {getPriorityBadge(selectedMessage.priority)}
                  {getStatusBadge(selectedMessage.sent)}
                </div>
                <small className="text-muted">
                  <FaCalendar className="me-1" />
                  Created: {new Date(selectedMessage.created_at).toLocaleString()}
                </small>
              </div>
              <div className="mb-3">
                <h6 className="fw-bold">Content:</h6>
                <p className="text-muted">{selectedMessage.message}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminMessages; 