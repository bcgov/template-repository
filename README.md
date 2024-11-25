# Template Repository
 Template repository for the FormFoundry.

## Setup Instructions

Requirements:

-   [Docker](https://docs.docker.com/engine/install/)
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

Copy and rename `.env.example` file to `.env` 

```
Copy-Item .env.example .env
```

Update `SSO_CLIENT_ID` and `SSO_CLIENT_SECRET` variables in `.env` file with your credentials.

## Docker Deployment

Have Docker installed and running. Run the following commands:

```
docker-compose build
```

```
docker-compose up
```
Server should be listening on `localhost:3000`
## API Calls

Ensure your REST API client has `Client Credentials` authentication configured:

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