import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import type { Express } from 'express';
import type http from 'http';
import express from 'express';
import cors from 'cors';
import type { OperationDefinitionNode } from 'graphql';
import { print } from 'graphql';
import { randomUUID } from 'node:crypto';
import { loadTypeDefs } from '../graphql/loadTypeDefs';
import { loadResolvers } from '../graphql/loadResolvers';
import type { Request, Response } from 'express';
import { getAuthUserFromRequest } from '../services/firebaseAdmin';
import { getPrisma } from '../services/prisma';
import type { User, PrismaClient } from '@prisma/client';

// Whitelist of operations that don't require authentication
const UNAUTHENTICATED_OPERATIONS = [
  'loginWithIdToken',
  'IntrospectionQuery'
  // Add other operations that don't need auth here
];

// Convert all operation names to lowercase for case-insensitive comparison
const UNAUTHENTICATED_OPERATIONS_LOWERCASE = UNAUTHENTICATED_OPERATIONS.map(op => op.toLowerCase());

function requiresAuthentication(operationName: string): boolean {
  return !UNAUTHENTICATED_OPERATIONS_LOWERCASE.includes(operationName.toLowerCase());
}

function createLoggingPlugin() {
  return {
    async requestDidStart(requestContext: any) {
      const start = Date.now();
      let opName: string = requestContext.request.operationName || 'anonymous';
      let opType: string | undefined;
      let fields: string[] = [];
      const requestId: string = requestContext.contextValue?.requestId ?? randomUUID();

      return {
        didResolveOperation(ctx: any) {
          const operation: OperationDefinitionNode | undefined = ctx.operation as OperationDefinitionNode | undefined;
          if (operation) {
            opType = operation.operation;
            opName = opName || (operation.name?.value ?? 'anonymous');
            fields = operation.selectionSet.selections
              .filter((s: any) => s.kind === 'Field')
              .map((s: any) => s.name.value as string);
          }
          const opTypeLabel = opType ? ` type=${opType}` : '';
          const fieldsLabel = fields.length ? ` fields=[${fields.join(',')}]` : '';
          console.log(`[GraphQL][rid=${requestId}] → start op=${opName}${opTypeLabel}${fieldsLabel}`);

          const rawQuery: string | undefined = requestContext.request.query?.trim();
          const printedQuery: string | undefined = rawQuery && rawQuery.length > 0
            ? rawQuery
            : (ctx.document ? print(ctx.document) : undefined);
          if (printedQuery) {
            console.log(printedQuery);
          }
          const vars = requestContext.request.variables;
          if (vars && Object.keys(vars).length > 0) {
            console.log(`[GraphQL][rid=${requestId}] variables:`);
            console.log(JSON.stringify(vars, null, 2));
          }
        },
        didEncounterErrors(ctx: any) {
          for (const err of ctx.errors) {
            console.error(`[GraphQL][rid=${requestId}] ✖ error`, {
              op: opName,
              message: err.message,
              path: err.path,
              locations: err.locations,
            });
          }
        },
        willSendResponse() {
          const ms = Date.now() - start;
          console.log(`[GraphQL][rid=${requestId}] ← complete op=${opName} in ${ms}ms`);
        },
      };
    },
  } as any;
}

type GraphQLContext = {
  requestId: string;
  req: Request;
  res: Response;
  user: User | null;
  prisma: PrismaClient;
};

type ApplyApolloArgs = {
  app: Express;
  httpServer: http.Server;
};

export async function applyApolloMiddleware({ app, httpServer }: ApplyApolloArgs): Promise<void> {
  const typeDefs = await loadTypeDefs();
  const resolvers = await loadResolvers();

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), createLoggingPlugin()],
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({ origin: true, credentials: true }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }: { req: Request; res: Response }) => {
        const headerId = (req.headers?.['x-request-id'] as string | undefined) || undefined;
        const requestId = headerId ?? randomUUID();
        try {
          res.setHeader('x-request-id', requestId);
        } catch {}
        
        const user = await getAuthUserFromRequest(req);
        const prisma = getPrisma();
        
        // Get operation name for authentication check
        const operationName = (req.body?.operationName as string) || '';

        console.log('operationName', operationName);
        
        // Check if operation requires authentication
        if (requiresAuthentication(operationName) && !user) {
          throw new Error('Unauthorized');
        }
        
        return { requestId, req, res, user: user ?? null, prisma } as GraphQLContext;
      },
    })
  );
}


