const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifyExternalApiKey = async (req, res, next) => {
    // 1. Headers se keys nikalna
    const clientId = req.headers['x-client-id'];
    const secretKey = req.headers['x-secret-key'];

    if (!clientId || !secretKey) {
        return res.status(401).json({ error: "Missing API Credentials (x-client-id or x-secret-key)" });
    }

    try {
        // 2. Database mein API Key check karna
        const apiKeyRecord = await prisma.api_keys.findUnique({
            where: { client_id: clientId }
        });

        // Agar key nahi mili ya secret match nahi hua
        if (!apiKeyRecord || apiKeyRecord.secret_key !== secretKey || apiKeyRecord.status !== 'Active') {
            return res.status(403).json({ error: "Invalid or Inactive API Keys" });
        }

        // 3. Request object mein sbu_id aur api_key_id attach karna
        req.sbu_id = apiKeyRecord.sbu_id;
        req.api_key_id = apiKeyRecord.id;

        // 4. API Hit ko LOG karna (NEW STEP ✅)
        // Taake humein pata chale kis ne kab hit kiya
        await prisma.api_logs.create({
            data: {
                api_key_id: apiKeyRecord.id,
                endpoint_hit: req.originalUrl,
                request_method: req.method,
                response_status: 200, // Pass ho gaya toh 200
                payload_received: JSON.stringify(req.body || {}),
                ip_address: req.ip || "127.0.0.1"
            }
        });

        next(); // Aglay controller par janay ki ijazat
    } catch (error) {
        console.error("AUTH_OR_LOG_ERROR:", error);
        res.status(500).json({ error: "External Auth or Logging Error" });
    }
};

module.exports = verifyExternalApiKey;