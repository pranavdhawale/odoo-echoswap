import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Alert } from 'react-bootstrap';
import { FaUser, FaCog, FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile, skills, refreshSkills } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillModalType, setSkillModalType] = useState('offered');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const availableSkillsRes = await axios.get('/api/skills');
        setAvailableSkills(availableSkillsRes.data.skills);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'danger', text: 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill) return;

    try {
      const endpoint = `/api/users/me/skills/${skillModalType}`;
      const response = await axios.post(endpoint, {
        skill_id: selectedSkill,
        description: '',
        experience_level: 'intermediate'
      });
      
      // Refresh skills data and wait a bit to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshSkills();
      
      setShowSkillModal(false);
      setSelectedSkill('');
      setMessage({ type: 'success', text: 'Skill added successfully!' });
    } catch (error) {
      console.error('Add skill error:', error);
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Failed to add skill' });
    }
  };

  const handleRemoveSkill = async (skillId, type) => {
    try {
      const endpoint = `/api/users/me/skills/${type}/${skillId}`;
      await axios.delete(endpoint);
      
      // Refresh skills data and wait a bit to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshSkills();
      
      setMessage({ type: 'success', text: 'Skill removed successfully!' });
    } catch (error) {
      console.error('Remove skill error:', error);
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Failed to remove skill' });
    }
  };

  const openSkillModal = (type) => {
    setSkillModalType(type);
    setShowSkillModal(true);
  };

  const getAvailableSkillsForType = () => {
    const currentSkills = skills[`skills_${skillModalType}`].map(s => s.id);
    return availableSkills.filter(skill => !currentSkills.includes(skill.id));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <div className="fade-in-up">
            <h1 className="display-5 fw-bold mb-3">Profile Settings</h1>
            <p className="lead text-muted">Manage your account and skills</p>
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
        {/* Profile Information */}
        <Col lg={6} className="mb-5">
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h4 className="fw-bold mb-0">
                <FaUser className="me-2" />
                Profile Information
              </h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileUpdate}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="form-control-custom"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="form-control-custom"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                    className="form-control-custom"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself..."
                    className="form-control-custom"
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="btn-gradient w-100"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FaSave className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Skills Management */}
        <Col lg={6} className="mb-5">
          <Card className="border-0 shadow-custom">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h4 className="fw-bold mb-0">
                <FaCog className="me-2" />
                Skills Management
              </h4>
            </Card.Header>
            <Card.Body>
              {/* Skills Offered */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-success mb-0">Skills You Offer</h6>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => openSkillModal('offered')}
                    className="btn-outline-gradient"
                  >
                    <FaPlus className="me-1" />
                    Add Skill
                  </Button>
                </div>
                {skills.skills_offered.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {skills.skills_offered.map(skill => (
                      <Badge 
                        key={skill.id} 
                        bg="success" 
                        className="skill-badge d-flex align-items-center"
                      >
                        {skill.name}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-white p-0 ms-2"
                          onClick={() => handleRemoveSkill(skill.id, 'offered')}
                        >
                          <FaTrash size={12} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No skills offered yet. Add some skills to get started!</p>
                )}
              </div>

              {/* Skills Wanted */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary mb-0">Skills You Want</h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => openSkillModal('wanted')}
                    className="btn-outline-gradient"
                  >
                    <FaPlus className="me-1" />
                    Add Skill
                  </Button>
                </div>
                {skills.skills_wanted.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {skills.skills_wanted.map(skill => (
                      <Badge 
                        key={skill.id} 
                        bg="primary" 
                        className="skill-badge d-flex align-items-center"
                      >
                        {skill.name}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-white p-0 ms-2"
                          onClick={() => handleRemoveSkill(skill.id, 'wanted')}
                        >
                          <FaTrash size={12} />
                        </Button>
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
      </Row>

      {/* Skill Modal */}
      <Modal show={showSkillModal} onHide={() => setShowSkillModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Add {skillModalType === 'offered' ? 'Offered' : 'Wanted'} Skill
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Skill</Form.Label>
            <Form.Select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="form-control-custom"
            >
              <option value="">Select a skill...</option>
              {getAvailableSkillsForType().map(skill => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSkillModal(false)}>
            <FaTimes className="me-2" />
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddSkill}
            disabled={!selectedSkill}
            className="btn-gradient"
          >
            <FaPlus className="me-2" />
            Add Skill
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Profile; 