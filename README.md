# Template Repository

A service for managing form templates in the FormFoundry platform, enabling developers to upload JSON templates and preview them in Kiln.

## Features

- Upload and version JSON form templates
- Manage deployment status (dev/test/prod)
- Preview templates in Kiln
- PDF template management via PETS integration
- Keycloak SSO authentication

## Quick Start

**Requirements:**
- [Docker](https://docs.docker.com/engine/install/)
- Pathfinder SSO account with 'Developer' role

**1. Clone and configure:**
```bash
git clone https://github.com/bcgov/template-repository.git
cd template-repository
cp .env.example .env
# Edit .env with your credentials
```

**2. Start the application:**
```bash
# Windows (PowerShell)
$env:DOCKERFILE="dockerfile-local"; docker-compose up --build

# Mac/Linux
DOCKERFILE=dockerfile-local docker-compose up --build
```

**3. Access:**
- Web UI: http://localhost:3000
- API Health: http://localhost:3000/health

## Environment Variables

Key variables to configure in `.env`:

```bash
# Application
APP_PORT=3000

# Database
POSTGRES_HOST=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=form_templates
POSTGRES_PORT=5432

# Keycloak SSO
SSO_URL=https://dev.loginproxy.gov.bc.ca/auth
SSO_REALM=standard
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret
SSO_AUTH_SERVER_URL=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect

# Frontend URLs
REACT_APP_SSO_URL=http://localhost:3000
REACT_APP_KILN_PREVIEW_URL=http://localhost:4173/preview
REACT_APP_KILN_URL=http://localhost:4173

# PETS (PDF Export Template Service)
PETS_BASE_URL=http://your-pets-service
```

## Database

**Run migrations:**
```bash
cd app/src
npx knex migrate:latest --knexfile knexfile.js
```

**Schema:**
- `form_templates` - Form JSON definitions, versions, and deployment status
- `pdf_templates` - PDF template references for PETS service

## API Endpoints

All `/api/*` endpoints require authentication except where noted.

### Form Templates
```bash
# Create form template
POST /api/forms
Body: { version, ministry_id, title, form_id, data, deployed_to, ... }

# Get form by UUID (public)
GET /api/forms/:id

# Get form by form_id (public, returns highest priority deployment)
GET /api/forms/form_id/:form_id

# List all forms
GET /api/forms-list

# Update deployment status
PUT /api/forms/update
Body: { form_id, id, deployed_to, pdf_template_id }
```

### PDF Templates
```bash
# List all PDF templates
GET /api/pdf-templates-list

# Upload new PDF template (ODT/DOCX)
POST /api/newPETStemplate
Form-data: { pdf_template_name, pdf_template_version, pdf_template_notes, libre_office_template }

# Download template file
GET /api/template/:template_uuid

# Render PDF
POST /api/pdfRender/:id
Body: { data: {...} }
```

## Development

**Backend (Express API):**
```bash
cd app/src
npm install
npm run dev    # Development with nodemon
npm start      # Production
```

**Frontend (React):**
```bash
cd app/client
npm install
npm start      # Dev server on port 3000
npm run build  # Production build
```

**Database access:**
```bash
# Via Docker
docker exec -it template-repository-db-1 psql -U postgres -d form_templates

# Via PgAdmin
Host: localhost, Port: 5432, User: postgres, Password: postgres, Database: form_templates
```

## Authentication

Access requires:
1. Valid IDIR account
2. 'Developer' role assigned in Pathfinder SSO

Login redirects to Keycloak SSO configured in environment variables.
