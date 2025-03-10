import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import * as XLSX from "xlsx";

function App() {
  const [users, setUsers] = useState([]); // Ensure users is an array
  const [showForm, setShowForm] = useState(false);
  const [action, setAction] = useState("");
  const [contact_name, setContact_name] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [engagement_status, setEngagement_status] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [uploadedData, setUploadedData] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async () => {
    if (!action || !contact_name || !title || !email || !phone || !engagement_status) {
      alert("All fields are required!");
      return;
    }

    const userData = { action, contact_name, title, email, phone, engagement_status };

    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, userData);
      } else {
        await axios.post("http://localhost:5000/api/users", userData);
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }); // Prevent empty values
  
      // Normalize keys to match database schema
      jsonData = jsonData.map((row) => ({
        action: row["Action"] || "",
        contact_name: row["Contact Name"] || "",
        title: row["Title"] || "",
        email: row["Email"] || "",
        phone: row["Phone"] || "",
        engagement_status: row["Engagement Status"] || "",
      }));
  
      console.log("Parsed Data:", jsonData); // Debugging
      setUploadedData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };
  
  const uploadToDatabase = async () => {
    if (uploadedData.length === 0) {
      alert("No data to upload. Please select a file first.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/users/bulk", { users: uploadedData });
      console.log("Server Response:", response.data);
      fetchUsers();
      setUploadedData([]);
      alert("Data uploaded successfully!");
    } catch (error) {
      console.error("Error uploading data:", error);
    }
  };

  const resetForm = () => {
    setAction("");
    setContact_name("");
    setTitle("");
    setEmail("");
    setPhone("");
    setEngagement_status("");
    setEditingUser(null);
    setShowForm(false);
  };

  return (
    <div className="App">
      <h1>User Management</h1>
      <div className="button-group">
        <button onClick={() => setShowForm(true)}>Add New User</button>
        <input type="file" onChange={handleFileUpload} />
        <button onClick={uploadToDatabase}>Upload to Database</button>
      </div>

      {uploadedData.length > 0 && (
        <div className="preview-container">
          <h3>Preview Data Before Upload:</h3>
          <table>
            <thead>
              <tr>
                {Object.keys(uploadedData[0]).map((key, index) => (
                  <th key={index}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uploadedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="popup-container">
          <div className="popup">
            <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
            <input type="text" placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} />
            <input type="text" placeholder="Contact Name" value={contact_name} onChange={(e) => setContact_name(e.target.value)} />
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input type="text" placeholder="Engagement Status" value={engagement_status} onChange={(e) => setEngagement_status(e.target.value)} />
            <div className="popup-buttons">
              <button onClick={handleSubmit}>{editingUser ? "Update User" : "Add User"}</button>
              <button onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Action</th>
            <th>Contact Name</th>
            <th>Title</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Engagement Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.action}</td>
              <td>{user.contact_name}</td>
              <td>{user.title}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>{user.engagement_status}</td>
              <td>
                <button
                  onClick={() => {
                    setEditingUser(user);
                    setAction(user.action);
                    setContact_name(user.contact_name);
                    setTitle(user.title);
                    setEmail(user.email);
                    setPhone(user.phone);
                    setEngagement_status(user.engagement_status);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button onClick={() => deleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
