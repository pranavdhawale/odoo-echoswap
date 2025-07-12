import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { FaUser, FaExchangeAlt, FaMapMarkerAlt, FaStar, FaEnvelope, FaTimes, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, skills: currentUserSkills, refreshSkills } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapData, setSwapData] = useState({
    skills_offered: [],
    skills_wanted: [],
    message: ''
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
  }, [id]);

  useEffect(() => {
    console.log('swapData changed:', swapData);
  }, [swapData]);

  const fetchUserData = async () => {
    try {
      const [userRes, skillsRes] = await Promise.all([
        axios.get(`/api/users/${id}`),
        axios.get('/api/skills')
      ]);
      setUser(userRes.data.user);
      setAvailableSkills(skillsRes.data.skills);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 404) {
        setMessage({ type: 'danger', text: 'User not found' });
      } else {
        setMessage({ type: 'danger', text: 'Failed to load user profile. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwapRequest = async (e) => {
    e.preventDefault();
    
    if (swapData.skills_offered.length === 0 || swapData.skills_wanted.length === 0) {
      setMessage({ type: 'warning', text: 'Please select skills to offer and skills you want' });
      return;
    }

    try {
      // Send a single POST with arrays of skill IDs
      await axios.post('/api/swaps', {
        provider_id: id,
        offered_skill_ids: swapData.skills_offered,
        requested_skill_ids: swapData.skills_wanted,
        message: swapData.message
      });
      
      setMessage({ type: 'success', text: 'Swap request sent successfully!' });
      setShowSwapModal(false);
      setSwapData({ skills_offered: [], skills_wanted: [], message: '' });
    } catch (error) {
      console.error('Swap request error:', error);
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Failed to send swap request' });
    }
  };

  const addSkillToSwap = (skillId, type) => {
    setSwapData(prev => ({
      ...prev,
      [type]: [...prev[type], Number(skillId)]
    }));
  };

  const removeSkillFromSwap = (skillId, type) => {
    setSwapData(prev => ({
      ...prev,
      [type]: prev[type].filter(id => id !== Number(skillId))
    }));
  };

  const getSkillName = (skillId) => {
    const skill = availableSkills.find(s => s.id === skillId);
    return skill ? skill.name : 'Unknown Skill';
  };

  const getCurrentUserSkills = (type) => {
    if (!currentUser) return [];
    return currentUser[`skills_${type}`] || [];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h4 className="text-muted">User not found</h4>
          <Button variant="primary" onClick={() => navigate('/browse')}>
            Back to Browse
          </Button>
        </div>
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container className="py-5">
        <Row className="mb-5">
          <Col>
            <div className="fade-in-up">
              <h1 className="display-5 fw-bold mb-3">User Profile</h1>
              <p className="lead text-muted">View user details and request skill swaps</p>
              <Alert variant="info" className="mt-3">
                <FaLock className="me-2" />
                <strong>Guest Mode:</strong> You can view user profiles, but you'll need to log in to request skill swaps.
              </Alert>
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

        <Row>
          {/* User Info Card */}
          <Col lg={4} className="mb-5">
            <Card className="border-0 shadow-custom">
              <Card.Body className="text-center p-5">
                {user?.profile_photo ? (
                  <img 
                    src={user.profile_photo} 
                    alt={user.name}
                    className="rounded-circle mb-4"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                       style={{ width: '120px', height: '120px' }}>
                    <span className="text-white fw-bold" style={{ fontSize: '3rem' }}>
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                )}

                <h3 className="fw-bold mb-2">{user?.name}</h3>
                
                {user?.location && (
                  <p className="text-muted mb-3">
                    <FaMapMarkerAlt className="me-2" />
                    {user.location}
                  </p>
                )}

                {user?.rating > 0 && (
                  <div className="mb-3">
                    <div className="rating-stars mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          className={i < Math.round(user.rating) ? 'text-warning' : 'text-muted'} 
                        />
                      ))}
                    </div>
                    <p className="text-muted small mb-0">
                      {user.rating ? Number(user.rating).toFixed(1) : '0.0'} ({user.total_ratings || 0} reviews)
                    </p>
                  </div>
                )}

                {user?.bio && (
                  <div className="mb-4">
                    <p className="text-muted">{user.bio}</p>
                  </div>
                )}

                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/login', { state: { message: 'Please log in to request skill swaps' } })}
                  className="w-100"
                >
                  <FaLock className="me-2" />
                  Login to Request Swap
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Skills and Swap Request */}
          <Col lg={8}>
            {/* Skills Offered */}
            <Card className="border-0 shadow-custom mb-4">
              <Card.Body>
                <h4 className="fw-bold mb-3">Skills Offered</h4>
                {user?.skills_offered && user.skills_offered.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {user.skills_offered.map(skill => (
                      <Badge key={skill.id} bg="success" className="skill-badge">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No skills offered yet</p>
                )}
              </Card.Body>
            </Card>

            {/* Skills Wanted */}
            <Card className="border-0 shadow-custom mb-4">
              <Card.Body>
                <h4 className="fw-bold mb-3">Skills Wanted</h4>
                {user?.skills_wanted && user.skills_wanted.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {user.skills_wanted.map(skill => (
                      <Badge key={skill.id} bg="primary" className="skill-badge">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No skills wanted yet</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">User Profile</h1>
            <p className="lead text-muted">View user details and request skill swaps</p>
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

      <Row>
        {/* User Info Card */}
        <Col lg={4} className="mb-5">
          <Card className="border-0 shadow-custom">
            <Card.Body className="text-center p-5">
              {user.profile_photo ? (
                <img 
                  src={user.profile_photo} 
                  alt={user.name}
                  className="rounded-circle mb-4"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              ) : (
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                     style={{ width: '120px', height: '120px' }}>
                  <span className="text-white fw-bold" style={{ fontSize: '3rem' }}>
                    {user.name.charAt(0)}
                  </span>
                </div>
              )}

              <h3 className="fw-bold mb-2">{user.name}</h3>
              
              {user.location && (
                <p className="text-muted mb-3">
                  <FaMapMarkerAlt className="me-2" />
                  {user.location}
                </p>
              )}

              {user.rating > 0 && (
                <div className="mb-3">
                  <div className="rating-stars mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        className={i < Math.round(user.rating) ? 'text-warning' : 'text-muted'} 
                      />
                    ))}
                  </div>
                  <p className="text-muted small mb-0">
                    {user.rating ? Number(user.rating).toFixed(1) : '0.0'} ({user.total_ratings || 0} reviews)
                  </p>
                </div>
              )}

              {user.bio && (
                <div className="mb-4">
                  <p className="text-muted">{user.bio}</p>
                </div>
              )}

              {currentUser && currentUser.id !== user.id && (
                <Button
                  variant="primary"
                  className="btn-gradient w-100"
                  onClick={async () => {
                    console.log('Current user:', currentUser);
                    console.log('Current user skills from global state:', currentUserSkills);
                    await refreshSkills();
                    console.log('After refreshing skills:', currentUserSkills);
                    setShowSwapModal(true);
                  }}
                >
                  <FaExchangeAlt className="me-2" />
                  Request Swap
                </Button>
              )}

              {currentUser && currentUser.id === user.id && (
                <Button
                  variant="outline-primary"
                  className="btn-outline-gradient w-100"
                  onClick={() => navigate('/profile')}
                >
                  <FaUser className="me-2" />
                  Edit Profile
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Skills Section */}
        <Col lg={8} className="mb-5">
          <Row>
            {/* Skills Offered */}
            <Col md={6} className="mb-4">
              <Card className="border-0 shadow-custom h-100">
                <Card.Header className="bg-transparent border-0 pb-0">
                  <h4 className="fw-bold text-success mb-0">
                    <FaStar className="me-2" />
                    Skills Offered
                  </h4>
                </Card.Header>
                <Card.Body>
                  {user.skills_offered.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {user.skills_offered.map(skill => (
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
                    <p className="text-muted">No skills offered yet.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Skills Wanted */}
            <Col md={6} className="mb-4">
              <Card className="border-0 shadow-custom h-100">
                <Card.Header className="bg-transparent border-0 pb-0">
                  <h4 className="fw-bold text-primary mb-0">
                    <FaEnvelope className="me-2" />
                    Skills Wanted
                  </h4>
                </Card.Header>
                <Card.Body>
                  {user.skills_wanted.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {user.skills_wanted.map(skill => (
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
                    <p className="text-muted">No skills wanted yet.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Swap Request Modal */}
      <Modal show={showSwapModal} onHide={() => setShowSwapModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Request Skill Swap with {user.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSwapRequest}>
            <Row>
              {/* Skills You Offer */}
              <Col md={6} className="mb-4">
                <h6 className="fw-bold text-success mb-3">Skills You'll Offer: ({currentUserSkills.skills_offered.length} available)</h6>
                {currentUserSkills.skills_offered.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {currentUserSkills.skills_offered.map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        className={`btn btn-sm skill-badge mb-1 me-1 ${swapData.skills_offered.includes(Number(skill.id)) ? 'btn-success text-white' : 'btn-outline-success'}`}
                        style={{ borderRadius: '20px', minWidth: '100px' }}
                        onClick={() => {
                          if (swapData.skills_offered.includes(Number(skill.id))) {
                            removeSkillFromSwap(skill.id, 'skills_offered');
                          } else {
                            addSkillToSwap(skill.id, 'skills_offered');
                          }
                        }}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p className="text-muted">No skills offered yet. Add some in your profile.</p>
                  </div>
                )}
              </Col>

              {/* Skills You Want */}
              <Col md={6} className="mb-4">
                <h6 className="fw-bold text-primary mb-3">Skills You Want:</h6>
                {user.skills_offered.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {user.skills_offered.map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        className={`btn btn-sm skill-badge mb-1 me-1 ${swapData.skills_wanted.includes(Number(skill.id)) ? 'btn-primary text-white' : 'btn-outline-primary'}`}
                        style={{ borderRadius: '20px', minWidth: '100px' }}
                        onClick={() => {
                          if (swapData.skills_wanted.includes(Number(skill.id))) {
                            removeSkillFromSwap(skill.id, 'skills_wanted');
                          } else {
                            addSkillToSwap(skill.id, 'skills_wanted');
                          }
                        }}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">This user doesn't offer any skills yet.</p>
                )}
              </Col>
              {/* Debug swapData */}
              <Col xs={12}>
                <pre style={{ fontSize: '0.8em', color: '#888' }}>swapData: {JSON.stringify(swapData, null, 2)}</pre>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Message (Optional):</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={swapData.message}
                onChange={(e) => setSwapData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a personal message to your swap request..."
                className="form-control-custom"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSwapModal(false)}>
            <FaTimes className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSwapRequest}
            disabled={swapData.skills_offered.length === 0 || swapData.skills_wanted.length === 0}
            className="btn-gradient"
          >
            <FaExchangeAlt className="me-2" />
            Send Request ({swapData.skills_offered.length} offered, {swapData.skills_wanted.length} wanted)
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile; 