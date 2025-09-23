import React from "react";
import { reportError } from "./errors";

export class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch(error: unknown, errorInfo: unknown) {
		reportError(error, { errorInfo });
	}
	render() {
		if (this.state.hasError) return <div>Something went wrong.</div>;
		return this.props.children;
	}
}
