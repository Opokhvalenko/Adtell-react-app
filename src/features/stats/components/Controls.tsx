export type ControlsProps = {
	from: string;
	to: string;
	groupBy: string;
	setFrom: (v: string) => void;
	setTo: (v: string) => void;
	setGroupBy: (v: string) => void;

	viewName: string;
	setViewName: (v: string) => void;
	names: string[];
	onSaveView: () => void;
	onLoadView: (name: string) => void;

	onOpenChart: () => void;
};

export function Controls(props: ControlsProps) {
	const {
		from,
		to,
		groupBy,
		setFrom,
		setTo,
		setGroupBy,
		viewName,
		setViewName,
		names,
		onSaveView,
		onLoadView,
		onOpenChart,
	} = props;

	return (
		<div className="flex flex-wrap items-end gap-3 p-3 rounded-xl border bg-white/60 dark:bg-white/5 shadow-sm backdrop-blur-sm">
			<label className="flex flex-col">
				<span className="text-xs text-gray-400">From</span>
				<input
					type="date"
					value={from}
					onChange={(e) => setFrom(e.target.value)}
					className="border rounded p-2"
				/>
			</label>

			<label className="flex flex-col">
				<span className="text-xs text-gray-400">To</span>
				<input
					type="date"
					value={to}
					onChange={(e) => setTo(e.target.value)}
					className="border rounded p-2"
				/>
			</label>

			<label className="flex flex-col w-[320px]">
				<span className="text-xs text-gray-400">Group by</span>
				<input
					value={groupBy}
					onChange={(e) => setGroupBy(e.target.value)}
					className="border rounded p-2"
					placeholder="day,event,adapter"
				/>
			</label>

			<div className="flex items-center gap-2 ml-auto">
				<input
					placeholder="view name"
					className="border rounded p-2 w-40"
					value={viewName}
					onChange={(e) => setViewName(e.target.value)}
				/>
				<button
					type="button"
					onClick={onSaveView}
					className="px-6 py-3 rounded-xl text-base font-semibold border shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none backdrop-blur-sm"
				>
					Save View
				</button>

				<select
					className="border rounded p-2"
					onChange={(e) => onLoadView(e.target.value)}
					value=""
				>
					<option value="" disabled>
						Select View
					</option>
					{names.map((n) => (
						<option key={n} value={n}>
							{n}
						</option>
					))}
				</select>

				<button
					type="button"
					onClick={onOpenChart}
					className="px-6 py-3 rounded-xl text-base font-semibold border shadow-sm transition-all duration-300 ease-in-out bg-white/95 text-gray-800 border-gray-300 hover:bg-white hover:shadow-md hover:scale-105 hover:-translate-y-0.5 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-600 dark:hover:shadow-lg cursor-pointer select-none backdrop-blur-sm"
				>
					Compare (Chart)
				</button>
			</div>
		</div>
	);
}
