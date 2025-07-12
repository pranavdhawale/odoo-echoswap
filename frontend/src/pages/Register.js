import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <div className="fade-in-up">
              <Card className="border-0 shadow-lg">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div className="bounce-in mb-3">
                      <FaUserPlus size={48} className="text-primary" />
                    </div>
                    <h2 className="fw-bold mb-2">Create Account</h2>
                    <p className="text-muted">Join our skill exchange community</p>
                  </div>

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`form-control-custom ${errors.name ? 'is-invalid' : ''}`}
                            placeholder="Enter your full name"
                          />
                          {errors.name && (
                            <Form.Control.Feedback type="invalid">
                              {errors.name}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Location (Optional)</Form.Label>
                          <Form.Control
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="form-control-custom"
                            placeholder="City, Country"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-control-custom ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <Form.Control.Feedback type="invalid">
                          {errors.email}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Password</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className={`form-control-custom ${errors.password ? 'is-invalid' : ''}`}
                              placeholder="Create a password"
                            />
                            <Button
                              type="button"
                              variant="link"
                              className="position-absolute end-0 top-50 translate-middle-y text-muted"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ zIndex: 10 }}
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                          </div>
                          {errors.password && (
                            <Form.Control.Feedback type="invalid">
                              {errors.password}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-medium">Confirm Password</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className={`form-control-custom ${errors.confirmPassword ? 'is-invalid' : ''}`}
                              placeholder="Confirm your password"
                            />
                            <Button
                              type="button"
                              variant="link"
                              className="position-absolute end-0 top-50 translate-middle-y text-muted"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{ zIndex: 10 }}
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                          </div>
                          {errors.confirmPassword && (
                            <Form.Control.Feedback type="invalid">
                              {errors.confirmPassword}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100 btn-gradient mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner me-2"></span>
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="mb-0 text-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-decoration-none fw-medium">
                          Sign in here
                        </Link>
                      </p>
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              {/* Benefits Info */}
              <div className="text-center mt-4">
                <Alert variant="success" className="border-0">
                  <strong>Join our community and:</strong><br />
                  • Exchange skills with others<br />
                  • Learn new abilities<br />
                  • Build your network<br />
                  • Earn ratings and reviews
                </Alert>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register; 