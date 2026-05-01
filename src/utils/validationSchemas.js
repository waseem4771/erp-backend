// const { z } = require('zod');

// /**
//  * Enterprise Validation Schemas ✅
//  * Purpose: Ensures data integrity and prevents backend crashes.
//  * Update: Refined authSignup to accept string/number IDs from frontend dropdowns. ✅
//  */

// const schemas = {
//     // =======================================================
//     // A. SETTINGS, FINANCE & CORE
//     // =======================================================
    
//     // 1. Fund Transfer Validation
//     fundTransfer: z.object({
//         body: z.object({
//             sbu_id: z.number().int().positive("Valid SBU ID is required"),
//             amount: z.number().positive("Amount must be a positive number"),
//             transfer_type: z.enum(['Allocation', 'Profit_Return'], { errorMap: () => ({ message: "Invalid Transfer Type" }) }),
//             description: z.string().min(5, "Description is too short for audit"),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // 2. Expense Entry Validation
//     expenseEntry: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()), 
//             account_id: z.string().or(z.number()),
//             amount: z.string().or(z.number()),
//             expense_date: z.string().min(1, "Date is required"),
//             description: z.string().optional().or(z.literal('')),
//             payment_account_id: z.string().or(z.number()).optional(),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // 3. New SBU Configuration
//     createSbu: z.object({
//         body: z.object({
//             sbu_name: z.string().min(3, "Business name is too short"),
//             sbu_type: z.string(),
//             currency: z.string().length(3, "Currency must be 3-letter ISO code"),
//             profit_share_percentage: z.string().or(z.number()), 
//             location: z.string().optional().or(z.literal('')), 
//             user_id: z.string().or(z.number()).optional()      
//         })
//     }),

//     // 4. API Key Generation
//     generateApiKey: z.object({
//         body: z.object({
//             sbu_id: z.number().int().positive(),
//             platform_name: z.string().min(2, "Platform name is required"),
//             webhook_url: z.string().url("Invalid Webhook URL format").optional().or(z.literal('')),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // 5. Standard GET Query with SBU ID
//     sbuIdQuery: z.object({
//         query: z.object({
//             sbu_id: z.string().min(1, "SBU ID is missing in query")
//         })
//     }),

//     // 6. Report Analytics Filter Query
//     reportQuery: z.object({
//         query: z.object({
//             sbu_id: z.string().optional(),
//             startDate: z.string().optional(),
//             endDate: z.string().optional(),
//             date: z.string().optional(),
//             account_id: z.string().optional()
//         })
//     }),

//     // =======================================================
//     // B. IDENTITY & CRM (MARKETING)
//     // =======================================================

//     // 7. Identity Access: Login
//     authLogin: z.object({
//         body: z.object({
//             email: z.string().email("Invalid email format"),
//             password: z.string().min(1, "Password is required")
//         })
//     }),

//     // 8. Identity Access: Signup/User Creation (FIXED ✅)
//     authSignup: z.object({
//         body: z.object({
//             email: z.string().email("Invalid corporate email format"),
//             password: z.string().min(6, "Initial password must be at least 6 characters"),
//             full_name: z.string().min(3, "Full legal name is required"),
//             // Flexibility added to accept IDs as strings from dropdowns
//             sbu_id: z.string().or(z.number()),
//             role_id: z.string().or(z.number()),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // 9. CRM: Lead Capture
//     crmLead: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             first_name: z.string().min(2, "First name is required"),
//             last_name: z.string().optional().or(z.literal('')),
//             email: z.string().email("Invalid email format"),
//             phone: z.string().optional().or(z.literal('')),
//             source: z.string().optional().or(z.literal('')),
//             lead_score: z.string().or(z.number()).optional(),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // 10. CRM: Update Lead Score
//     crmLeadScore: z.object({
//         body: z.object({
//             id: z.string().or(z.number()),
//             new_score: z.string().or(z.number()),
//             sbu_id: z.string().or(z.number()).optional(),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // 11. CRM: Marketing Campaign
//     crmCampaign: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             campaign_name: z.string().min(3, "Campaign name is required"),
//             campaign_type: z.string(),
//             budget: z.string().or(z.number()),
//             start_date: z.string().optional().or(z.literal('')),
//             end_date: z.string().optional().or(z.literal('')),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // =======================================================
//     // C. SALES MODULE VALIDATIONS
//     // =======================================================

//     salesCustomer: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             customer_name: z.string().min(2, "Customer name is required"),
//             email: z.string().email("Invalid email").optional().or(z.literal('')),
//             phone: z.string().optional().or(z.literal('')),
//             address: z.string().optional().or(z.literal('')),
//             tier: z.string().optional(),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     salesOrder: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             customer_id: z.string().or(z.number()),
//             total_amount: z.string().or(z.number()),
//             items: z.array(z.any()).min(1, "Order must contain at least 1 item"),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     salesQuote: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             customer_id: z.string().or(z.number()),
//             total_amount: z.string().or(z.number()),
//             valid_until: z.string().optional().or(z.literal('')),
//             items: z.array(z.any()).min(1, "Quote must contain at least 1 item"),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     salesConvertQuote: z.object({
//         body: z.object({
//             quote_id: z.string().or(z.number()),
//             warehouse_id: z.string().or(z.number()).optional(),
//             sbu_id: z.string().or(z.number()).optional(),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     // =======================================================
//     // D. INVENTORY & OPERATIONS VALIDATIONS
//     // =======================================================

//     inventoryProduct: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             name: z.string().min(2, "Product name is required"),
//             description: z.string().optional().or(z.literal('')),
//             category: z.string().optional().or(z.literal('')),
//             product_type: z.string().optional(),
//             base_price: z.string().or(z.number()),
//             variants: z.array(z.any()).optional(),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     inventoryWarehouse: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             name: z.string().min(2, "Warehouse name is required"),
//             location: z.string().optional().or(z.literal('')),
//             is_main: z.boolean().optional().or(z.string().optional()),
//             user_id: z.string().or(z.number()).optional()
//         })
//     }),

//     inventoryPO: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             supplier_id: z.string().or(z.number()),
//             total_amount: z.string().or(z.number()),
//             created_by: z.string().or(z.number()),
//             order_date: z.string()
//         })
//     }),

//     inventoryReceivePO: z.object({
//         body: z.object({
//             po_id: z.string().or(z.number()),
//             variant_id: z.string().or(z.number()),
//             warehouse_id: z.string().or(z.number()),
//             quantity: z.string().or(z.number())
//         })
//     }),

//     inventoryAdjust: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             variant_id: z.string().or(z.number()),
//             warehouse_id: z.string().or(z.number()),
//             quantity: z.string().or(z.number()),
//             adjustment_type: z.string(),
//             reason: z.string().optional().or(z.literal(''))
//         })
//     }),

//     inventoryTransfer: z.object({
//         body: z.object({
//             sbu_id: z.string().or(z.number()),
//             from_warehouse_id: z.string().or(z.number()),
//             to_warehouse_id: z.string().or(z.number()),
//             variant_id: z.string().or(z.number()),
//             quantity: z.string().or(z.number())
//         })
//     })
// };

// module.exports = schemas;








const { z } = require('zod');

/**
 * Enterprise Validation Schemas ✅
 * Purpose: Ensures data integrity and prevents backend crashes.
 * Update: Refined fundTransfer to accept string/number inputs for capital movements. ✅
 */

const schemas = {
    // =======================================================
    // A. SETTINGS, FINANCE & CORE
    // =======================================================
    
    // 1. Fund Transfer Validation (FIXED ✅)
    fundTransfer: z.object({
        body: z.object({
            // Allows IDs and Amounts as strings (from frontend) or numbers
            sbu_id: z.string().or(z.number()),
            amount: z.string().or(z.number()),
            transfer_type: z.enum(['Allocation', 'Profit_Return'], { 
                errorMap: () => ({ message: "Invalid Transfer Type" }) 
            }),
            description: z.string().min(5, "Description is too short for audit"),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // 2. Expense Entry Validation
    expenseEntry: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()), 
            account_id: z.string().or(z.number()),
            amount: z.string().or(z.number()),
            expense_date: z.string().min(1, "Date is required"),
            description: z.string().optional().or(z.literal('')),
            payment_account_id: z.string().or(z.number()).optional(),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // 3. New SBU Configuration
    createSbu: z.object({
        body: z.object({
            sbu_name: z.string().min(3, "Business name is too short"),
            sbu_type: z.string(),
            currency: z.string().length(3, "Currency must be 3-letter ISO code"),
            profit_share_percentage: z.string().or(z.number()), 
            location: z.string().optional().or(z.literal('')), 
            user_id: z.string().or(z.number()).optional()      
        })
    }),

    // 4. API Key Generation (Marketplace Gateway)
    generateApiKey: z.object({
        body: z.object({
            sbu_id: z.number().int().positive(),
            platform_name: z.string().min(2, "Platform name is required"),
            webhook_url: z.string().url("Invalid Webhook URL format").optional().or(z.literal('')),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // 5. Standard GET Query with SBU ID
    sbuIdQuery: z.object({
        query: z.object({
            sbu_id: z.string().min(1, "SBU ID is missing in query")
        })
    }),

    // 6. Report Analytics Filter Query
    reportQuery: z.object({
        query: z.object({
            sbu_id: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            date: z.string().optional(),
            account_id: z.string().optional()
        })
    }),

    // =======================================================
    // B. IDENTITY & CRM (MARKETING)
    // =======================================================

    // 7. Identity Access: Login
    authLogin: z.object({
        body: z.object({
            email: z.string().email("Invalid email format"),
            password: z.string().min(1, "Password is required")
        })
    }),

    // 8. Identity Access: Signup/User Creation
    authSignup: z.object({
        body: z.object({
            email: z.string().email("Invalid corporate email format"),
            password: z.string().min(6, "Initial password must be at least 6 characters"),
            full_name: z.string().min(3, "Full legal name is required"),
            sbu_id: z.string().or(z.number()),
            role_id: z.string().or(z.number()),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // 9. CRM: Lead Capture
    crmLead: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            first_name: z.string().min(2, "First name is required"),
            last_name: z.string().optional().or(z.literal('')),
            email: z.string().email("Invalid email format"),
            phone: z.string().optional().or(z.literal('')),
            source: z.string().optional().or(z.literal('')),
            lead_score: z.string().or(z.number()).optional(),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // 10. CRM: Update Lead Score
    crmLeadScore: z.object({
        body: z.object({
            id: z.string().or(z.number()),
            new_score: z.string().or(z.number()),
            sbu_id: z.string().or(z.number()).optional(),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // 11. CRM: Marketing Campaign
    crmCampaign: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            campaign_name: z.string().min(3, "Campaign name is required"),
            campaign_type: z.string(),
            budget: z.string().or(z.number()),
            start_date: z.string().optional().or(z.literal('')),
            end_date: z.string().optional().or(z.literal('')),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // =======================================================
    // C. SALES MODULE VALIDATIONS
    // =======================================================

    salesCustomer: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            customer_name: z.string().min(2, "Customer name is required"),
            email: z.string().email("Invalid email").optional().or(z.literal('')),
            phone: z.string().optional().or(z.literal('')),
            address: z.string().optional().or(z.literal('')),
            tier: z.string().optional(),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    salesOrder: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            customer_id: z.string().or(z.number()),
            total_amount: z.string().or(z.number()),
            items: z.array(z.any()).min(1, "Order must contain at least 1 item"),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    salesQuote: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            customer_id: z.string().or(z.number()),
            total_amount: z.string().or(z.number()),
            valid_until: z.string().optional().or(z.literal('')),
            items: z.array(z.any()).min(1, "Quote must contain at least 1 item"),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    salesConvertQuote: z.object({
        body: z.object({
            quote_id: z.string().or(z.number()),
            warehouse_id: z.string().or(z.number()).optional(),
            sbu_id: z.string().or(z.number()).optional(),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    // =======================================================
    // D. INVENTORY & OPERATIONS VALIDATIONS
    // =======================================================

    inventoryProduct: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            name: z.string().min(2, "Product name is required"),
            description: z.string().optional().or(z.literal('')),
            category: z.string().optional().or(z.literal('')),
            product_type: z.string().optional(),
            base_price: z.string().or(z.number()),
            variants: z.array(z.any()).optional(),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    inventoryWarehouse: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            name: z.string().min(2, "Warehouse name is required"),
            location: z.string().optional().or(z.literal('')),
            is_main: z.boolean().optional().or(z.string().optional()),
            user_id: z.string().or(z.number()).optional()
        })
    }),

    inventoryPO: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            supplier_id: z.string().or(z.number()),
            total_amount: z.string().or(z.number()),
            created_by: z.string().or(z.number()),
            order_date: z.string()
        })
    }),

    inventoryReceivePO: z.object({
        body: z.object({
            po_id: z.string().or(z.number()),
            variant_id: z.string().or(z.number()),
            warehouse_id: z.string().or(z.number()),
            quantity: z.string().or(z.number())
        })
    }),

    inventoryAdjust: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            variant_id: z.string().or(z.number()),
            warehouse_id: z.string().or(z.number()),
            quantity: z.string().or(z.number()),
            adjustment_type: z.string(),
            reason: z.string().optional().or(z.literal(''))
        })
    }),

    inventoryTransfer: z.object({
        body: z.object({
            sbu_id: z.string().or(z.number()),
            from_warehouse_id: z.string().or(z.number()),
            to_warehouse_id: z.string().or(z.number()),
            variant_id: z.string().or(z.number()),
            quantity: z.string().or(z.number())
        })
    })
};

module.exports = schemas;