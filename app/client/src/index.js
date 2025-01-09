import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SSOProvider } from "@bcgov/citz-imb-sso-react";

const root = ReactDOM.createRoot(document.getElementById("root"));

console.log("Backend URL passed to SSOProvider:", process.env.REACT_APP_SSO_URL);

root.render(
  <React.StrictMode>
    <SSOProvider idpHint="idir" backendURL={process.env.REACT_APP_SSO_URL}>
      <App />
    </SSOProvider>
  </React.StrictMode>
);
