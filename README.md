# Template Repository

 Template repository for the FormFoundry. Allows developers to upload JSON templates and preview them in [Kiln](https://github.com/bcgov/kiln)

## Setup Instructions

Requirements:

-   [Docker](https://docs.docker.com/engine/install/)
-   [Pathfinder SSO](https://digital.gov.bc.ca/bcgov-common-components/pathfinder-sso/)
-   [Kiln](https://github.com/bcgov/kiln)
-   [Insomnia](https://insomnia.rest/download) (Or use any REST API Client)

Clone the repository:

```
git clone https://github.com/DavidOkulski/template-repository.git
```

Navigate into the repository:

```
cd template-respository
```

---

## Configuration

Copy and rename `.env.example` file to `.env` both in the root:

```
Copy-Item .env.example .env
```

Update variables in `.env` file with your credentials and congifurations.

## Docker Deployment

Have Docker installed and running. Run the following commands:

```
docker-compose build
```

```
docker-compose up
```
Server should be listening on `localhost:3000`

## User Interface

To log into Template Repository, you need to have a valid IDIR, create and assign the 'Developer' role to the IDIR in Pathfinder SSO.

Once logged in you can:
- Upload form templates
- View templates that have been uploaded in a tabular format
- Change the 'Deployment Status' of a template
- Preview a template in Kiln

## API Calls

Ensure your REST API client has SSO authentication configured:

```
ACCESS TOKEN URL: 
CLIENT ID:
ClIENT SECRET:
````

The API calls for the template repository are as follows:
```
// POST request to add a new form template
localhost:3000/api/forms
```
```
// GET request to retrieve a form template by UUID
localhost:3000/api/forms/{uuid}
```
```
// GET request to retrieve the form template by id with the latest version
http://localhost:3000/api/forms/form_id/{form_id}
```
```
// GET request to list all form templates 
http://localhost:3000/api/forms-list
```
