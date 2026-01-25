import React from 'react';
import { useAuth } from '../AuthContext';
import { Navbar, Container, Button } from 'react-bootstrap';

const DashboardHeader = () => {
    const { user, logout } = useAuth();
    
    return (
        <Navbar bg="light" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand href="#">Welcome, {user?.username}!</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Button variant="danger" onClick={logout}>
                                Logout
                            </Button>
                        </li>
                    </ul>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default DashboardHeader;