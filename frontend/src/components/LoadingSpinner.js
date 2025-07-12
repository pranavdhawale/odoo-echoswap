import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <Row className="text-center">
        <Col>
          <div className="bounce-in">
            <FaSpinner 
              className="loading-spinner mb-3" 
              size={48}
              style={{ color: 'var(--primary-color)' }}
            />
            <h5 className="text-muted">{message}</h5>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoadingSpinner; 