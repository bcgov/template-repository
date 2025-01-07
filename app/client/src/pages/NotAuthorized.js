// src/pages/NotAuthorized.js
import React from "react";
import { useSSO } from "@bcgov/citz-imb-sso-react";
import { Header, Button } from "@bcgov/design-system-react-components";
import { IoIosLogOut } from "react-icons/io";
import "./NotAuthorized.css";

const NotAuthorized = () => {
    const { logout, user } = useSSO();

    return (
        <div className="App">
            <Header title="Form Templates"></Header>
            <div className="login-container">
                <h3 style={{ margin: "3vh" }}>
                    {user
                        ? `Your account: ${user.first_name ?? "N/A"} ${user.last_name ?? "N/A"} does not have access to this application.`
                        : "Your account information is unavailable. Please log out and try again."}
                </h3>
                <Button size="medium" variant="primary" onPress={() => logout(process.env.REACT_APP_SSO_URL)}>
                    <IoIosLogOut /> Logout
                </Button>
            </div>
        </div>
    );
};

export default NotAuthorized;