
import './App.css';
import "@bcgov/bc-sans/css/BC_Sans.css";


import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { Header, Button } from '@bcgov/design-system-react-components';



function App() {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch form templates from the Express API
    async function fetchForms() {

      try {
        const response = await fetch('/api2/forms-list');
        if (!response.ok) {
          throw new Error('Failed to fetch form templates');
        }
        const data = await response.json();
        setForms(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchForms();
  }, []);


  const columns = [
    {
      name: 'Version',
      selector: row => row.version,
      sortable: true,
    },
    {
      name: 'Form ID',
      selector: row => row.form_id,
      sortable: true,
    },
    {
      name: 'Title',
      selector: row => row.title,
      sortable: true,
    },
    {
      name: 'UUID',
      selector: row => row.id,
      sortable: true,
    },
    {
      name: 'Ministry ID',
      selector: row => row.ministry_id,
      sortable: true,
    },
    {
      name: 'Last Modified',
      selector: row => new Date(row.last_modified).toLocaleString(),
      sortable: true,
    }, 
  ];

  const ExpandedComponent = ({ data }) => <pre>{JSON.stringify(data, null, 2)}</pre>;

  return (
    <div className={`App`}> 
      <Header
        title="Form Templates"
      >
        <Button
      onPress={function Ms(){}}
      size="medium"
      variant="primary"
      >
      Upload
      </Button>
      </Header>
      
        {error ? (
          <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>
        ) : (
          <DataTable
            columns={columns}
            data={forms}
            pagination
            highlightOnHover
            expandableRows  
            expandableRowsComponent={ExpandedComponent}
          />
        )}     
    </div>
  );
}

export default App;
