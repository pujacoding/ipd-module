const db = require('../db');
const { sendBookingSms } = require('../services/smsService');

function getMonthCode(date = new Date()) {
    return date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
}

function createMonthlyUhid(callback) {
    const monthCode = getMonthCode();
    const prefix = `IPD-${monthCode}`;

    db.query(
        "SELECT COUNT(*) AS total FROM patients WHERE uhid LIKE ?",
        [`${prefix}-%`],
        (countErr, countResult) => {
            if (countErr) {
                callback(countErr);
                return;
            }

            const nextSequence = String((countResult[0]?.total || 0) + 1).padStart(3, '0');
            callback(null, `${prefix}-${nextSequence}`);
        }
    );
}

exports.addPatient = (req, res) => {
    const {
        name,
        age,
        gender,
        phone,
        alternatePhone,
        address,
        bedLabel,
        bedPrice,
        panelType,
        insuranceCompany,
        surgeryName,
        surgeryPrice,
        adviceDoctor,
        bookingDate,
        bookedTime,
        anaesthesiaType,
        anaesthesiaPrice,
        organPart,
        lensName,
        sphValue,
        cylValue,
        specialNote,
        totalAmount,
        prescriptionFile,
        reportFiles
    } = req.body;

    if (!name || !age || !gender || !phone || !address) {
        return res.status(400).json({ message: "Name, age, gender, primary number, and address are required" });
    }

    createMonthlyUhid(async (uhidErr, uhid) => {
        if (uhidErr) {
            return res.status(500).json({ message: "Unable to generate booking ID" });
        }

        const sql = `
            INSERT INTO patients (
                uhid, name, age, gender, phone, alternate_phone, address,
                bed_label, bed_price, panel_type, insurance_company, surgery_name,
                surgery_price, advice_doctor, booking_date, booked_time, anaesthesia_type, anaesthesia_price,
                organ_part, lens_name, sph_value, cyl_value, special_note,
                total_amount, prescription_file, report_files
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            uhid,
            name,
            age,
            gender,
            phone,
            alternatePhone || null,
            address,
            bedLabel || null,
            Number(bedPrice) || 0,
            panelType || null,
            insuranceCompany || null,
            surgeryName || null,
            Number(surgeryPrice) || 0,
            adviceDoctor || null,
            bookingDate || null,
            bookedTime || null,
            anaesthesiaType || null,
            Number(anaesthesiaPrice) || 0,
            organPart || null,
            lensName || null,
            sphValue || null,
            cylValue || null,
            specialNote || null,
            Number(totalAmount) || 0,
            prescriptionFile || null,
            Array.isArray(reportFiles) ? reportFiles.join(', ') : null
        ], async (err) => {
            if (err) {
                return res.status(500).json({
                    message: "Patient save failed. Database upgrade run karo.",
                    error: err.message
                });
            }

            const smsResult = await sendBookingSms({
                patientName: name,
                phone,
                uhid
            });

            res.json({
                message: smsResult.sent
                    ? "Patient Added and booking SMS sent"
                    : "Patient Added",
                uhid,
                sms: smsResult
            });
        });
    });
};

exports.getPatients = (req, res) => {
    const sql = "SELECT * FROM patients ORDER BY id DESC";

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(result);
    });
};

exports.updatePatient = (req, res) => {
    const patientId = req.params.id;
    const {
        name,
        age,
        gender,
        phone,
        address,
        bedLabel,
        bedPrice,
        surgeryName,
        surgeryPrice,
        anaesthesiaType,
        anaesthesiaPrice,
        insuranceCompany,
        panelType,
        totalAmount,
        role
    } = req.body;

    if (!name || !age || !gender || !phone || !address || !surgeryName) {
        return res.status(400).json({ message: "Required editable fields missing" });
    }

    const fields = [
        "name = ?",
        "age = ?",
        "gender = ?",
        "phone = ?",
        "address = ?",
        "bed_label = ?",
        "bed_price = ?",
        "insurance_company = ?",
        "surgery_name = ?",
        "surgery_price = ?",
        "anaesthesia_type = ?",
        "anaesthesia_price = ?",
        "total_amount = ?"
    ];
    const values = [
        name,
        age,
        gender,
        phone,
        address,
        bedLabel || null,
        Number(bedPrice) || 0,
        insuranceCompany || null,
        surgeryName,
        Number(surgeryPrice) || 0,
        anaesthesiaType || null,
        Number(anaesthesiaPrice) || 0,
        Number(totalAmount) || 0
    ];

    if (role === "admin") {
        fields.push("panel_type = ?");
        values.push(panelType || null);
    }

    values.push(patientId);

    const sql = `UPDATE patients SET ${fields.join(", ")} WHERE id = ?`;

    db.query(sql, values, (err) => {
        if (err) {
            return res.status(500).json({ message: "Patient update failed", error: err.message });
        }

        res.json({ message: "Patient updated successfully" });
    });
};
