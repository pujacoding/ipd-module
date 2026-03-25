async function sendFast2Sms(message, phone) {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
        return {
            sent: false,
            provider: "fast2sms",
            reason: "FAST2SMS_API_KEY missing"
        };
    }

    try {
        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: {
                authorization: apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                route: "q",
                message,
                language: "english",
                flash: 0,
                numbers: phone
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                sent: false,
                provider: "fast2sms",
                reason: errorText
            };
        }

        return {
            sent: true,
            provider: "fast2sms"
        };
    } catch (error) {
        return {
            sent: false,
            provider: "fast2sms",
            reason: error.message
        };
    }
}

async function sendBookingSms({ patientName, phone, uhid }) {
    const cleanPhone = String(phone || "").trim();

    if (!cleanPhone) {
        return {
            sent: false,
            provider: "none",
            reason: "Primary phone missing"
        };
    }

    const message = `IPD booking confirmed for ${patientName}. Your IPD code is ${uhid}.`;

    return sendFast2Sms(message, cleanPhone);
}

module.exports = {
    sendBookingSms
};
