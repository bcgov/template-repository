import React from "react";
import { BrowserRouter as Navigate } from "react-router-dom";
import { useSSO } from "@bcgov/citz-imb-sso-react";
import { Header, Button } from "@bcgov/design-system-react-components";
import "./Login.css";

const Login = () => {
    const { isAuthenticated, login } = useSSO();

    if (isAuthenticated) {
        return <Navigate to="/forms" replace />;
    }

    return (
        <div className="App">
            <Header title="Form Templates"></Header>
            <div className="login-container">
                <h3 style={{ margin: "3vh" }}>Please log in to access this application</h3>
                <Button onPress={() => {
                    //console.log("Backend URL passed to login:", process.env.REACT_APP_SSO_URL);
                    login({ backendURL: process.env.REACT_APP_SSO_URL })
                }}>Log In</Button>
            </div>
        </div>
    );
};

export default Login;

//process.env.REACT_APP_SSO_URL