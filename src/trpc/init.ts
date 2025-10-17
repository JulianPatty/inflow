import { auth } from '@/lib/auth';
import { polarClient } from '@/lib/polar';
import { initTRPC, TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import { cache } from 'react';
import superjson from "superjson"
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return {};
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unathorized",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});
export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    try {
      const customer = await polarClient.customers.getStateExternal({
        externalId: ctx.auth.user.id,
      });

      if (
        !customer.activeSubscriptions ||
        customer.activeSubscriptions.length === 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Active subscription required",
        });
      }

      return next({ ctx: { ...ctx, customer } });
    } catch (error) {
      // If the error is already a TRPCError (like the FORBIDDEN above), rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      // For any other error (API failure, customer doesn't exist, etc.),
      // treat it as "no active subscription"
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active subscription required",
      });
    }
  },
);
