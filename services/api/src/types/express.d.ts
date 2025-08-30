/**
 * Express type extensions
 */

import { UserContext } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
      requestId?: string;
      correlationId?: string;
      apiVersion?: string;
    }
  }
}

// Export empty object to make this a module
export {};