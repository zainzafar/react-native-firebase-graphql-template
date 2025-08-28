import { GraphQLScalarType, Kind } from 'graphql';

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO-8601 Date scalar',
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    const d = new Date(value as any);
    if (isNaN(d.getTime())) throw new TypeError('Date cannot represent an invalid date');
    return d.toISOString();
  },
  parseValue(value: unknown): Date {
    const d = new Date(value as any);
    if (isNaN(d.getTime())) throw new TypeError('Date cannot represent an invalid date');
    return d;
  },
  parseLiteral(ast): Date | null {
    if (ast.kind !== Kind.STRING) return null;
    const d = new Date(ast.value);
    if (isNaN(d.getTime())) return null;
    return d;
  },
});

export const TimestampScalar = new GraphQLScalarType({
  name: 'Timestamp',
  description: 'UNIX epoch milliseconds',
  serialize(value: unknown): number {
    if (value instanceof Date) return value.getTime();
    const d = new Date(value as any);
    if (isNaN(d.getTime())) throw new TypeError('Timestamp cannot represent an invalid date');
    return d.getTime();
  },
  parseValue(value: unknown): Date {
    const n = typeof value === 'number' ? value : Number(value);
    const d = new Date(n);
    if (isNaN(d.getTime())) throw new TypeError('Timestamp cannot represent an invalid date');
    return d;
  },
  parseLiteral(ast): Date | null {
    if (ast.kind !== Kind.INT && ast.kind !== Kind.STRING) return null;
    const n = Number(ast.value);
    const d = new Date(n);
    if (isNaN(d.getTime())) return null;
    return d;
  },
});

export default { Date: DateScalar, Timestamp: TimestampScalar };


