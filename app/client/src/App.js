import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import FormList from "./pages/FormList";
import PdfTemplates from "./pages/PDFTemplates";
import NotAuthorized from "./pages/NotAuthorized";
import { useSSO } from "@bcgov/citz-imb-sso-react";
import "@bcgov/bc-sans/css/BC_Sans.css";
import "./App.css"

const App = () => {
  const { isAuthenticated, hasRoles } = useSSO();

  if (!isAuthenticated) {
    // Redirect to Login if not authenticated
    return <Login />;
  }

  if (!hasRoles(["Developer"])) {
    // Redirect to NotAuthorized if the user doesn't have the required role
    return <NotAuthorized />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/forms" replace />} />
        <Route path="/forms" element={<FormList />} />
        <Route path="/pdf-templates" element={<PdfTemplates />} />
      </Routes>
    </Router>
  );
};

export default App;
