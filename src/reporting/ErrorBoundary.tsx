import React from "react";
import { reportError } from "@/reporting/errors-lazy";

type ErrorBoundaryProps = {
	children: React.ReactNode;
};

type ErrorBoundaryState = {
	hasError: boolean;
};

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
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
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8 text-center">
					<h2 className="text-lg font-semibold">Something went wrong</h2>
					<p className="text-sm opacity-70">
						An unexpected error occurred. Please try again.
					</p>
					<button
						type="button"
						className="btn-primary"
						onClick={() => this.setState({ hasError: false })}
					>
						Try again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
