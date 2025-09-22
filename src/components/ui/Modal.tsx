import {
	Description,
	Dialog,
	DialogPanel,
	DialogTitle,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import { Fragment, type PropsWithChildren, useRef } from "react";

type Size = "sm" | "md" | "lg" | "xl" | "2xl";
const sizeMap: Record<Size, string> = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
};

export type ModalProps = PropsWithChildren<{
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	description?: React.ReactNode;
	initialFocusRef?: React.RefObject<HTMLElement | null>;
	size?: Size;
	panelClassName?: string;
	showHeader?: boolean;
}>;

export default function Modal({
	open,
	onClose,
	title,
	description,
	initialFocusRef,
	size = "2xl",
	panelClassName = "",
	showHeader = true,
	children,
}: ModalProps) {
	const closeBtnRef = useRef<HTMLButtonElement>(null);

	return (
		<Transition appear show={open} as={Fragment}>
			<Dialog
				as="div"
				className="relative z-50"
				onClose={onClose}
				initialFocus={initialFocusRef ?? closeBtnRef}
			>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-150"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-100"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/50" aria-hidden="true" />
				</TransitionChild>

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4">
						<TransitionChild
							as={Fragment}
							enter="ease-out duration-150"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-100"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<DialogPanel
								className={[
									"w-full",
									sizeMap[size],
									"rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden",
									panelClassName,
								].join(" ")}
							>
								{showHeader && (
									<div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
										<DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
											{title}
										</DialogTitle>
										<button
											type="button"
											ref={closeBtnRef}
											onClick={onClose}
											className="inline-flex items-center justify-center rounded-md
                                 border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100
                                 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                 focus:ring-offset-white dark:focus:ring-offset-gray-800"
											aria-label="Close dialog"
										>
											Close
										</button>
									</div>
								)}

								{description && (
									<Description className="px-5 pt-4 text-gray-700 dark:text-gray-300">
										{description}
									</Description>
								)}

								<div className="p-5">{children}</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
