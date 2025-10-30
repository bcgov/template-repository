import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Header,
  Button,
  InlineAlert,
  Modal,
  Dialog,
  TextField,
  TextArea
} from "@bcgov/design-system-react-components";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import { useSSO } from "@bcgov/citz-imb-sso-react";
import { IoIosLogOut } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import "./PDFTemplates.css"; 

const PdfTemplates = () => {
  const navigate = useNavigate();
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const { getAuthorizationHeaderValue, logout, user } = useSSO();
  const [errorModal, setErrorModal] = useState("");

   // Upload modal state
   const [showUpload, setShowUpload] = useState(false);
   const [name, setName] = useState("");
   const [version, setVersion] = useState("");
   const [notes, setNotes] = useState("");
   const [file, setFile] = useState(null);

  const flashAlert = (info, ms = 1500) => {
    setAlertInfo(info);
    setTimeout(() => setAlertInfo(null), ms);
  };

  const fetchPdfTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/pdf-templates-list", {
        headers: { Authorization: getAuthorizationHeaderValue() },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setPdfTemplates(data);
    } catch (e) {
      setError(e.message);
    }
  }, [getAuthorizationHeaderValue]);

  useEffect(() => {
    fetchPdfTemplates();
  }, [fetchPdfTemplates]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 80,
      },
      {
        accessorKey: "name",
        header: "Form ID",
      },
      {
        accessorKey: "version",
        header: "Version",
      },
      {
        accessorKey: "template_uuid",
        header: "Template UUID",
      },
      {
        accessorKey: "notes",
        header: "Notes",
        size: 10,
      },
      {
        id: "download",
        header: "File Download",
        Cell: ({ row }) => (
          <Button
          variant="secondary"
          onPress={async () => {
            const { template_uuid } = row.original;

            try {
              const response = await fetch(`/api/template/${template_uuid}`, {
                method: "GET",
                headers: {
                  Authorization: getAuthorizationHeaderValue(),
                },
              });

              if (!response.ok) throw new Error("Download failed");

              const blob = await response.blob();
              const contentType = response.headers.get("Content-Type");

              const extension = contentType.includes("opendocument") ? "odt"
                              : contentType.includes("wordprocessingml") ? "docx"
                              : "bin";

              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${row.original.name || "download"}.${extension}`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error("Error downloading file:", err);
            }
          }}
        >
          Download
        </Button>
        ),
      },
    ],
    []
  );

   // Actually upload and upsert
   const doUpload = async () => {
    try {
      
      const formData = new FormData();
            formData.append("libre_office_template", file);
            formData.append("pdf_template_name", name);
            formData.append("pdf_template_version", version);
            if (notes) formData.append("pdf_template_notes", notes);
      
            const res = await fetch("/api/newPETStemplate", {
              method: "POST",
              headers: {
                Authorization: getAuthorizationHeaderValue(),
              },
              body: formData,
            });
            if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      // refresh table
      await fetchPdfTemplates();
      setShowUpload(false);
      setName("");
      setVersion("");
      setNotes("");
      setFile(null);
      setErrorModal(""); 
      flashAlert({ title: "Uploaded", description: "PDF template saved", variant: "success" });
    } catch (e) {
      setError(e.message);
      setErrorModal(e.message);
    }
  };

  const handleUpload = async () => {
    // simple client-side validation
    if (!name.trim() || !version.trim() || !file) {
        flashAlert({
          title: "Error",
          description: "Name, version and file are required",
          variant: "danger",
        });
        return;
      }
    // if no conflict, proceed
    await doUpload();
  };

  const handleCancelUpload = () => {
    setShowUpload(false);
    setErrorModal("");
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length) {
      const f = acceptedFiles[0];
      setFile(f);
      setName(f.name.replace(/\.[^/.]+$/, "")); // set default name from file (without extension)
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/vnd.oasis.opendocument.text": [".odt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const table = useMaterialReactTable({
    columns,
    data: pdfTemplates,
    initialState: {
      density: "compact",
      sorting: [{ id: "created_at", desc: true }],
    },
  });

  return (
    <div className="App">
      {alertInfo && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            width: 300,
            zIndex: 2000,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          <InlineAlert
            title={alertInfo.title}
            description={alertInfo.description}
            variant={alertInfo.variant}
            onClose={() => setAlertInfo(null)}
          />
        </div>
      )}

      <Header title="PDF Templates">
      <Button size="medium" variant="primary" onPress={() => setShowUpload(true)}>
          Upload
        </Button>
        <span>
          Logged in: {user.first_name} {user.last_name}
        </span>
        <Button
          size="medium"
          variant="secondary"
          onPress={() => logout(process.env.REACT_APP_SSO_URL)}
        >
          <IoIosLogOut />
        </Button>
      </Header>

      <div style={{ padding: "1rem" }}>
        <Button variant="secondary" onPress={() => navigate("/forms")}>
          ← Back
        </Button>
      </div>

      {error ? (
        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
      ) : (
        <MaterialReactTable table={table} />
      )}
      <Modal isOpen={showUpload} onOpenChange={() => setShowUpload(false)}>
        <Dialog isCloseable role="dialog" aria-label="Upload PDF Template">
        <div
           style={{
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxWidth: "600px",       
            maxHeight: "80vh",      
             overflowY: "auto",       
              boxSizing: "border-box", 
            }}
          >
            <h2>Upload PDF Template</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label 
                htmlFor="pdf-template-dropzone"
                style={{
                  fontSize: "14px",
                  color: "var(--typography-color-secondary)",
              }}>
                PDF Template (required)
              </label>
              <div
                id="pdf-template-dropzone"
                {...getRootProps()}
                className="dropzone"
              >
                <input {...getInputProps()} />
                {file ? (
                  <p style={{
                    fontSize: "14px",
                    color: "var(--typography-color-secondary)",
                  }}>{file.name}</p>
                ) : isDragActive ? (
                  <p style={{
                    fontSize: "14px",
                    color: "var(--typography-color-secondary)",
                  }}>Drop the .odt/.docx file here…</p>
                ) : (
                  <p style={{
                    fontSize: "14px",
                    color: "var(--typography-color-secondary)",
                  }}>Drag &amp; drop a .odt or .docx file here, or click to select</p>
                )}
              </div>
            </div>
            <TextField
              label="Template Name"
              isRequired
              value={name}
              onChange={(val) => setName(val)}
            />
            <TextField
              label="Version"
              isRequired
              value={version}
              onChange={(val) => setVersion(val)}
            />
            <TextArea
              label="Notes"
              value={notes}
              onChange={(val) => setNotes(val)}
              className="small-notes" 
            />
            {errorModal && (
        <p style={{ color: "red", fontWeight: "bold", marginTop: "0.5rem" }}>
          {errorModal}
        </p>
      )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <Button onPress={handleCancelUpload}>Cancel</Button>
              <Button variant="primary" onPress={handleUpload}>Submit</Button>
            </div>
          </div>
        </Dialog>
      </Modal>
    </div>
  );
};

export default PdfTemplates;
