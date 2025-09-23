import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";

type ZodResolverSchema = Parameters<typeof zodResolver>[0];

export function zodResolverCompat<T extends FieldValues>(
	schema: ZodResolverSchema,
): Resolver<T> {
	return zodResolver(schema) as unknown as Resolver<T>;
}
