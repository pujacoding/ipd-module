const db = require('../db');

exports.listUsers = (req, res) => {
    const sql = "SELECT id, name, username, email, role, status FROM users ORDER BY id DESC";

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Unable to load users", error: err.message });
        }

        res.json(result);
    });
};

exports.createUser = (req, res) => {
    const { name, username, email, password, role, status } = req.body;

    if (!name || !username || !email || !password || !role) {
        return res.status(400).json({ message: "Name, username, email, password, and role are required" });
    }

    const sql = `
        INSERT INTO users (name, username, email, password, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, username, email, password, role, status || "active"], (err) => {
        if (err) {
            return res.status(500).json({ message: "Unable to create user", error: err.message });
        }

        res.json({ message: "User created successfully" });
    });
};

exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const { name, username, email, role, status } = req.body;

    if (!name || !username || !email || !role || !status) {
        return res.status(400).json({ message: "Name, username, email, role, and status are required" });
    }

    const sql = `
        UPDATE users
        SET name = ?, username = ?, email = ?, role = ?, status = ?
        WHERE id = ?
    `;

    db.query(sql, [name, username, email, role, status, userId], (err) => {
        if (err) {
            return res.status(500).json({ message: "Unable to update user", error: err.message });
        }

        res.json({ message: "User updated successfully" });
    });
};
