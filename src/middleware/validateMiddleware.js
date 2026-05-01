// /**
//  * Global Request Validation Middleware ✅
//  * Purpose: Intercepts requests and validates them against a Zod schema.
//  */
// const validate = (schema) => (req, res, next) => {
//     try {
//         // Validate req.body, req.query, or req.params based on the schema
//         schema.parse({
//             body: req.body,
//             query: req.query,
//             params: req.params,
//         });
//         next(); // Sab theek hai, aglay step par jao
//     } catch (err) {
//         // Agar validation fail ho jaye, toh controller par janay se pehle hi error return karein
//         return res.status(400).json({
//             success: false,
//             error: "Security & Data Validation Failed",
//             details: err.errors.map(e => ({
//                 field: e.path.join('.').replace('body.', ''),
//                 message: e.message
//             }))
//         });
//     }
// };

// module.exports = validate;





/**
 * Global Request Validation Middleware ✅
 * Purpose: Intercepts requests and validates them against a Zod schema.
 * Update: Added safety check for 'err.errors' to prevent backend crashes. ✅
 */
const validate = (schema) => (req, res, next) => {
    try {
        // Validate req.body, req.query, or req.params based on the schema
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next(); // Validation passed, proceed to controller
    } catch (err) {
        // Safety Check: Ensure err.errors exists before mapping to avoid crashes
        const validationDetails = err.errors 
            ? err.errors.map(e => ({
                field: e.path.join('.').replace('body.', '').replace('query.', '').replace('params.', ''),
                message: e.message
            })) 
            : [{ field: "system", message: "Unexpected validation error occurred" }];

        // Return professional error response
        return res.status(400).json({
            success: false,
            error: "Security & Data Validation Failed",
            details: validationDetails
        });
    }
};

module.exports = validate;