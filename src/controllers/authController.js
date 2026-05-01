const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * Auth & Team Management Controller
 * Purpose: Handles user authentication and secure administrative user registration.
 * Update: Integrated Unit-specific Audit Logging and secure bcrypt password hashing. ✅
 */

// ============================================================
// 1. ADMINISTRATIVE USER REGISTRATION (Create Team Members)
// ============================================================
/**
 * Function: signup
 * Purpose: Allows an Admin to create new Managers or Accountants.
 * Logic: Hashes password securely and logs the creation event in the Audit Trail.
 */
const signup = async (req, res) => {
    const { email, password, full_name, sbu_id, role_id, user_id } = req.body;

    try {
        // Validation: Check if the user identity already exists in the organization
        const existingUser = await prisma.users.findUnique({
            where: { email: email.trim() }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Identity Error: A user with this email already exists." });
        }

        // Security: Hashing the raw password using bcrypt (10 rounds)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creating the new user record linked to a specific SBU/Unit
        const newUser = await prisma.users.create({
            data: {
                email: email.trim(),
                password_hash: hashedPassword,
                full_name: full_name,
                sbu_id: sbu_id ? parseInt(sbu_id) : null, // Global Admins may have null SBU
                role_id: parseInt(role_id),
                status: 'Active'
            }
        });

        // FIXED: Re-aligned Audit Log signature (userId, sbuId, action, module, details, ip) ✅
        await recordAuditLog(
            user_id || 1, 
            parseInt(sbu_id || 1), 
            'CREATE_USER', 
            'Settings', 
            { created_user: email, role_id: role_id }, 
            req.ip
        );

        res.status(201).json({ 
            success: true, 
            message: "Team member registered and authorized successfully.", 
            user: { id: newUser.id, email: newUser.email } 
        });

    } catch (error) {
        console.error("USER_CREATION_ERROR:", error.message);
        res.status(500).json({ error: "System failure during user registration." });
    }
};

// ============================================================
// 2. USER AUTHENTICATION (System Entry)
// ============================================================
/**
 * Function: login
 * Purpose: Validates credentials and initiates an active session.
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.users.findUnique({
            where: { email: email.trim() }
        });

        // Validation: Check if user exists and is not suspended
        if (!user || user.status !== 'Active') {
            return res.status(401).json({ error: "Access Denied: Invalid credentials or inactive account." });
        }

        // Security Check: Comparing provided password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Access Denied: Incorrect secure password." });
        }

        // Return session context to the frontend
        res.json({
            success: true,
            user: { 
                id: user.id, 
                full_name: user.full_name, 
                role_id: user.role_id, 
                sbu_id: user.sbu_id 
            }
        });

    } catch (error) {
        console.error("LOGIN_ERROR:", error.message);
        res.status(500).json({ error: "Internal Authentication Service Error." });
    }
};

module.exports = { login, signup };