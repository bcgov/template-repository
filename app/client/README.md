# Template Repository - Frontend

React web application for managing form templates in the FormFoundry ecosystem. Provides a user interface for uploading, versioning, and managing JSON form templates with Keycloak SSO authentication.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Tech Stack

- **React 18** - UI framework
- **React Router 7** - Client-side routing
- **@bcgov/citz-imb-sso-react** - Keycloak SSO integration
- **@bcgov/design-system-react-components** - BC Gov design system
- **Material React Table** - Data tables
- **React Dropzone** - File upload

## Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

The page reloads on changes and displays lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.

See [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.

The build is optimized and minified with hashed filenames, ready for deployment.

See [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you need full control over the build configuration, you can `eject` at any time. This copies all configuration files and dependencies into your project. However, you don't need to eject for most use cases.

## Features

**Form Management (FormList.js):**
- Upload JSON form templates
- View all templates in a data table
- Update deployment status (dev/test/prod)
- Associate PDF templates with forms
- Preview templates in Kiln

**PDF Template Management (PDFTemplates.js):**
- Upload ODT/DOCX templates
- Manage template versions
- Link templates to forms

**Authentication:**
- Keycloak SSO integration
- Role-based access (requires 'Developer' role)
- Automatic login redirect

## Development

The frontend is served by the Express backend in production. During development, it runs on its own dev server.

**Development mode:**
```bash
npm start  # Runs on port 3000
```

**Production build:**
```bash
npm run build  # Creates build/ folder
# The Express backend serves build/ as static files
```

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
- [Code Splitting](https://facebook.github.io/create-react-app/docs/code-splitting)
- [Analyzing Bundle Size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)
- [Making a Progressive Web App](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)
- [Advanced Configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)
- [Deployment](https://facebook.github.io/create-react-app/docs/deployment)
- [Troubleshooting: npm run build fails to minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
