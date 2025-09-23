import { create, type StateCreator } from "zustand";
import { devtools, persist } from "zustand/middleware";

type Options = {
	persist?: boolean;
	label?: string;
};

type WithPersist<T> = StateCreator<T, [["zustand/persist", unknown]], []>;
type WithDevtools<T> = StateCreator<T, [["zustand/devtools", never]], []>;

export function createStore<T>(
	name: string,
	init: StateCreator<T, [], []>,
	opts: Options = {},
) {
	const isDev = import.meta.env.MODE !== "production";
	const label = opts.label ?? name;

	let wrapped: StateCreator<T, [], []> = init;

	if (opts.persist !== false) {
		const p = persist(wrapped as WithPersist<T>, {
			name,
		}) as unknown as StateCreator<T, [], []>;
		wrapped = p;
	}

	if (isDev) {
		const d = devtools(wrapped as WithDevtools<T>, {
			name: label,
		}) as unknown as StateCreator<T, [], []>;
		wrapped = d;
	}

	return create<T>()(wrapped);
}
