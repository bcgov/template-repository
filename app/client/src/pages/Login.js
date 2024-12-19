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
    console.log("REACT_APP_SSO_URL:", process.env.REACT_APP_SSO_URL);
    console.log("Type of URL:", typeof process.env.REACT_APP_SSO_URL);
    console.log("Value of URL:", process.env.REACT_APP_SSO_URL);

    return (
        <div className="App">
            <Header title="Form Templates"></Header>
            <div className="login-container">
                <h3 style={{ margin: "3vh" }}>Please log in to access this application</h3>
                <Button onPress={() => login({ backendURL: process.env.REACT_APP_SSO_URL })}>Log In</Button>
            </div>
        </div>
    );
};

export default Login;

//process.env.REACT_APP_SSO_URL