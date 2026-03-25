const db = require('../db');
const otpStore = new Map();

function buildUserPayload(user) {
    return {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role || "staff",
        email: user.email || ""
    };
}

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Login failed due to server error" });
        }

        if (result.length > 0) {
            const user = result[0];

            res.json({
                message: "Login Success",
                user: buildUserPayload(user)
            });
        } else {
            res.status(401).json({ message: "Invalid Credentials" });
        }
    });
};

exports.requestOtp = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const sql = "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1";

    db.query(sql, [email, email], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "OTP request failed. Ensure users table has an email column or use username mapped as email.",
                error: err.message
            });
        }

        if (!result.length) {
            return res.status(404).json({ message: "No user found for this email" });
        }

        const user = result[0];
        const otp = generateOtp();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStore.set(String(user.id), {
            otp,
            expiresAt,
            user: buildUserPayload(user)
        });

        console.log(`OTP for ${email}: ${otp}`);

        res.json({
            message: "OTP generated. Demo mode active.",
            userId: String(user.id),
            demoOtp: otp
        });
    });
};

exports.verifyOtp = (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.status(400).json({ message: "User and OTP are required" });
    }

    const entry = otpStore.get(String(userId));

    if (!entry) {
        return res.status(400).json({ message: "OTP not requested or expired" });
    }

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(String(userId));
        return res.status(400).json({ message: "OTP expired. Request a new OTP." });
    }

    if (entry.otp !== String(otp).trim()) {
        return res.status(401).json({ message: "Invalid OTP" });
    }

    otpStore.delete(String(userId));
    res.json({
        message: "Login Success",
        user: entry.user
    });
};
