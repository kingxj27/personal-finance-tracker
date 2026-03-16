"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
// Prisma 7 requires either an adapter or accelerateUrl.
// Create a proxy that mimics the Prisma client structure at runtime
// while throwing helpful errors if actually invoked.
const createModel = (modelName) => {
    return new Proxy({}, {
        get: () => async (...args) => {
            throw new Error(`Prisma is not fully configured for ${modelName}. Install a database adapter (e.g., @prisma/adapter-better-sqlite3) to use Prisma features.`);
        },
    });
};
exports.prisma = new Proxy({
    user: createModel("User"),
    budget: createModel("Budget"),
    expense: createModel("Expense"),
    goal: createModel("Goal"),
    income: createModel("Income"),
}, {
    get: (target, prop) => {
        if (prop in target) {
            return target[prop];
        }
        return createModel(String(prop));
    },
});
//# sourceMappingURL=prismaClient.js.map