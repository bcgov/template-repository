import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header, Button, Modal, TextArea, Dialog } from "@bcgov/design-system-react-components";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import { useSSO } from "@bcgov/citz-imb-sso-react";
import { IoIosLogOut } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import "./FormList.css";

const FormList = () => {
    const [forms, setForms] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [inputText, setInputText] = useState("");
    const [errorModal, setErrorModal] = useState("");
    const [error, setError] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedJson, setSelectedJson] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [newDeployedStatus, setNewDeployedStatus] = useState("");
    const [editOptions, setEditOptions] = useState([]);
    const [grouping, setGrouping] = useState(["form_id", "deployed_to"]);

    const { fetchProtectedRoute, getAuthorizationHeaderValue, logout, user } = useSSO();

    //Fetches forms from the database
    const fetchForms = useCallback(async () => {
        try {
            const response = await fetch("/api/forms-list", {
                method: "GET",
                headers: {
                    Authorization: getAuthorizationHeaderValue(),
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch forms.");
            }

            const data = await response.json();
            setForms(data);
        } catch (err) {
            setError(err.message);
        }
    }, [fetchProtectedRoute, getAuthorizationHeaderValue]);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    const handlePreviewJson = (json) => {
        setSelectedJson(json);
    };

    //Uploads form to the database
    const handleOkPress = async () => {
        try {
            const response = await fetch("/api/forms", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": getAuthorizationHeaderValue() },
                body: inputText,
            });

            if (!response.ok) {
                throw new Error("Failed to upload template");
            }

            fetchForms();
            setInputText("");
            setErrorModal("");
            setModalVisible(false);
        } catch (err) {
            console.error("Error uploading form:", err);
            setErrorModal(err.message);
        }
    };

    //Updates the deployment status of a form
    const handleDeployedStatusChange = useCallback(
        async (id, form_id, newStatus) => {
            try {
                const response = await fetch("/api/forms/update", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: getAuthorizationHeaderValue(),
                    },
                    body: JSON.stringify({ id, form_id, deployed_to: newStatus }),
                });

                if (!response.ok) throw new Error("Failed to update deployed status");

                fetchForms();
            } catch (err) {
                setError(err.message);
            }
        },
        [fetchProtectedRoute, getAuthorizationHeaderValue, fetchForms]
    );

    const openEditModal = (row) => {
        setSelectedRow(row);
        setNewDeployedStatus(row.original.deployed_to || "");
        const options = getEnvironmentOptions();
        setEditOptions(options);
        setIsEditModalVisible(true);
    };

    const handleModalSubmit = () => {
        if (selectedRow) {
            handleDeployedStatusChange(
                selectedRow.original.id,
                selectedRow.original.form_id,
                newDeployedStatus
            ).then(() => setIsEditModalVisible(false));
        }
    };

    //Sets the dropdown values of "Edit Deployment Status" based on where the form is deployed
    const getEnvironmentOptions = () => {
        const env = process.env.REACT_APP_ENV || "dev";
        const optionsMap = {
            dev: [{ value: "", label: "None" }, { value: "dev", label: "Development" }],
            test: [{ value: "", label: "None" }, { value: "test", label: "Test" }],
            prod: [{ value: "", label: "None" }, { value: "prod", label: "Production" }],
        };

        return optionsMap[env] || [{ value: "", label: "None" }];
    };

    const toggleGrouping = () => {
        setGrouping((prev) => (prev.length > 0 ? [] : ["form_id", "deployed_to"]));
    };

    const handleCancelPress = () => {
        setModalVisible(false);
        setInputText("");
        setErrorModal("");
    };

    const handleDownloadJson = () => {
        const jsonBlob = new Blob([JSON.stringify(selectedJson, null, 2)], {
            type: "application/json",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(jsonBlob);
        link.download = `form_${selectedJson.form_id || "data"}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    //Column configuration for the Form list table
    const columns = useMemo(() => [
        {
            accessorKey: "deployed_to",
            header: "Deployed To",
            size: 50,
            enableGrouping: true,
            Cell: ({ cell }) => {
                const labelMap = {
                    "": "None",
                    dev: "Development",
                    test: "Test",
                    prod: "Production",
                };
                return labelMap[cell.getValue()] || "None";
            },
            enableEditing: false,
            sortingFn: (rowA, rowB, columnId) => { // Custom sorting: prod > test > dev > none
                const order = { prod: 0, test: 1, dev: 2, "": 3 };
                return order[rowA.getValue(columnId)] - order[rowB.getValue(columnId)];
            },
        },
        {
            accessorKey: "version",
            header: "Version",
            filterVariant: "autocomplete",
            enableEditing: false,
            sortingFn: "alphanumeric",
            size: 30,
        },
        {
            accessorKey: "form_id",
            header: "Form ID",
            filterVariant: "autocomplete",
            enableEditing: false,
            enableGrouping: true,
            size: 50,
        },
        {
            accessorKey: "title",
            header: "Title",
            filterVariant: "autocomplete",
            enableEditing: false,
            size: 50,
        },
        {
            accessorKey: "id",
            header: "UUID",
            filterVariant: "autocomplete",
            enableEditing: false,
            size: 50,
        },
        {
            accessorKey: "last_modified",
            header: "Last Modified",
            Cell: ({ cell }) => new Date(cell.getValue()).toLocaleString(),
            enableEditing: false,
            size: 50,
        },
        {
            header: "JSON",
            enableEditing: false,
            size: 50,
            Cell: ({ row }) => (
                <Button
                    variant="link"
                    onPress={() => handlePreviewJson(row.original)}
                    style={{ padding: "0" }}
                >
                    Preview JSON
                </Button>
            ),
        },
        {
            header: "KILN",
            id: "preview",
            Cell: ({ row }) => {
                const handlePreviewClick = () => {
                    const jsonString = JSON.stringify(row.original, null, 2);
                    const previewURL = process.env.REACT_APP_KILN_PREVIEW_URL;
                    const targetOrigin = process.env.REACT_APP_KILN_URL;

                    const newTab = window.open(previewURL, "_blank");

                    if (newTab) {
                        const sendMessage = () => {
                            newTab.postMessage({ type: "LOAD_JSON", data: jsonString }, targetOrigin);
                        };

                        newTab.onload = sendMessage;

                        setTimeout(() => {
                            sendMessage();
                        }, 1000);
                    } else {
                        console.error("Failed to open the new tab. Check popup blockers.");
                    }
                };

                return (
                    <Button
                        variant="link"
                        onPress={handlePreviewClick}
                        style={{ padding: "0" }}
                    >
                        Preview Kiln
                    </Button>
                );
            },
            enableEditing: false,
            size: 50,
        },
        {
            id: "actions",
            header: "Edit",
            size: 50,
            Cell: ({ row }) => (
                <Button variant="link" onPress={() => openEditModal(row)} color="primary">
                    <MdEdit />
                </Button>
            ),
        },
    ], [handleDeployedStatusChange]);

    //Form list table configuration
    const table = useMaterialReactTable({
        columns,
        data: forms,
        positionToolbarAlertBanner: "none",
        enableGrouping: true,
        groupedColumnMode: "retain",
        onGroupingChange: setGrouping,
        isMultiSortEvent: () => true,
        state: { grouping },
        renderTopToolbarCustomActions: () => (
            <div style={{ display: "flex", gap: "1vh" }}>
                <Button variant="secondary" onPress={toggleGrouping}>
                    {grouping.length > 0 ? "Ungroup" : "Group"}
                </Button>
            </div>
        ),
        initialState: {
            density: "compact",
            expanded: false,
            showColumnFilters: true,
            sorting: [
                { id: "form_id", desc: false },
                { id: "deployed_to", desc: false },
                { id: "version", desc: true },
            ],
            pagination: {
                pageSize: 30,
            },
        },
    });

    return (
        <div className="App">
            <Header title="Form Templates">
                <Button size="medium" variant="primary" onPress={() => setModalVisible(true)}>
                    Upload
                </Button>
                <span>
                    Logged in: {user.first_name} {user.last_name}
                </span>
                <Button size="medium" variant="secondary" onPress={() => logout(process.env.REACT_APP_SSO_URL)}>
                    <IoIosLogOut />
                </Button>
            </Header>
            <Modal isOpen={modalVisible} onOpenChange={setModalVisible}>
                <Dialog isCloseable role="dialog">
                    <div className="dialog-container">
                        <TextArea
                            placeholder="Paste Form Template JSON here..."
                            value={inputText}
                            onChange={(value) => setInputText(value)}
                            style={{ flex: 1, marginTop: "3vh", width: "100%" }}
                        />
                        {errorModal && (
                            <p style={{ color: "red", fontWeight: "bold", margin: "1vh" }}>{errorModal}</p>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Button onPress={handleCancelPress}>Cancel</Button>
                            <Button onPress={handleOkPress}>Ok</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
            {selectedJson && (
                <Modal isOpen={!!selectedJson} onOpenChange={() => setSelectedJson(null)}>  {/*Modal for Uploading JSON*/}
                    <Dialog isCloseable>
                        <div style={{ height: "91vh", padding: "1vh" }}>
                            <h2>JSON Preview</h2>
                            <pre style={{ overflow: "auto", maxHeight: "75vh" }}>
                                {JSON.stringify(selectedJson, null, 2)}
                            </pre>
                            <div style={{ display: "flex", justifyContent: "space-between", margin: "3vh" }}>
                                <Button onPress={() => setSelectedJson(null)}>Close</Button>
                                <Button onPress={handleDownloadJson} variant="primary">
                                    Download JSON
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            )}
            {error ? (
                <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
            ) : (
                <><MaterialReactTable table={table} />
                    <Modal isOpen={isEditModalVisible} onOpenChange={setIsEditModalVisible} title="Change Deployment Status"> {/*Modal for Changing Deployement Status*/}
                        <Dialog isCloseable>
                            <div style={{ padding: "16px" }}>
                                <h3>Edit Deployment Status</h3>
                                <select
                                    value={newDeployedStatus}
                                    onChange={(e) => setNewDeployedStatus(e.target.value)}
                                    style={{ width: "100%", padding: "1vh" }}
                                >
                                    {editOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div style={{ marginTop: "2vh", display: "flex", justifyContent: "flex-end" }}>
                                    <Button onPress={() => setIsEditModalVisible(false)}>Cancel</Button>
                                    <Button onPress={handleModalSubmit} style={{ marginLeft: "1vh" }}>
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal></>
            )}
        </div>
    );
};

export default FormList;
