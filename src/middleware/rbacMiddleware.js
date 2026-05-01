const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * RBAC Middleware (Role-Based Access Control)
 * Purpose: To enforce module-level security at the database level.
 * Logic: Checks the 'permissions' table for the user's role before allowing access.
 */

const checkPermission = (moduleName) => {
    return async (req, res, next) => {
        // Extracting User ID from headers (simulating logged-in user)
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ 
                error: "Unauthorized: User ID missing in headers." 
            });
        }

        try {
            // 1. Fetch user and their associated role & permissions
            const user = await prisma.users.findUnique({
                where: { id: parseInt(userId) },
                include: {
                    roles: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({ error: "User account not found." });
            }

            // 2. Super Admin Bypass (Assuming Role ID 1 is Super Admin)
            if (user.role_id === 1) {
                return next();
            }

            // 3. Search for the specific module permission
            const hasAccess = user.roles.permissions.find(
                (p) => p.module_name === moduleName && p.can_view === true
            );

            if (hasAccess) {
                // Permission granted, proceed to the controller
                next();
            } else {
                // Permission denied
                return res.status(403).json({ 
                    error: `Forbidden: You do not have permission to access the ${moduleName} module.` 
                });
            }

        } catch (error) {
            console.error("RBAC_MIDDLEWARE_ERROR:", error.message);
            res.status(500).json({ error: "Internal security check failed." });
        }
    };
};

module.exports = { checkPermission };