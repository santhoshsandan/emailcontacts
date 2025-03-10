const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Change if needed
  password: "", // Change if needed
  database: "srila",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database.");
});

// Bulk insert users
app.post("/api/users/bulk", (req, res) => {
  try {
    const users = req.body.users;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const values = users.map((user) => [
      user.action || "",
      user.contact_name || "",
      user.title || "",
      user.email || "",
      user.phone || "",
      user.engagement_status || "",
    ]);

    const insertQuery = `
      INSERT INTO users (action, contact_name, title, email, phone, engagement_status)
      VALUES ?
    `;

    db.query(insertQuery, [values], (err, result) => {
      if (err) {
        console.error("Error inserting users:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Users imported successfully", inserted: result.affectedRows });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch all users
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Insert a single user
app.post("/api/users", (req, res) => {
  const { action, contact_name, title, email, phone, engagement_status } = req.body;

  if (!contact_name || !email) {
    return res.status(400).json({ error: "Contact name and email are required" });
  }

  db.query(
    "INSERT INTO users (action, contact_name, title, email, phone, engagement_status) VALUES (?, ?, ?, ?, ?, ?)",
    [action, contact_name, title, email, phone, engagement_status],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "User added successfully", id: result.insertId });
    }
  );
});

// Update user
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { action, contact_name, title, email, phone, engagement_status } = req.body;

  if (!contact_name || !email) {
    return res.status(400).json({ error: "Contact name and email are required" });
  }

  db.query(
    "UPDATE users SET action = ?, contact_name = ?, title = ?, email = ?, phone = ?, engagement_status = ? WHERE id = ?",
    [action, contact_name, title, email, phone, engagement_status, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User updated successfully" });
    }
  );
});

// Delete user
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
