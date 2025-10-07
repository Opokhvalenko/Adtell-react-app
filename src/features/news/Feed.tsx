import { Link } from "react-router-dom";
import type { FeedItem } from "@/types/feed";
import { useFeed } from "./useFeed";
export default function Feed() {
	const { items, isLoading, isError } = useFeed();

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="loading-spinner mb-4"></div>
				<p className="text-gray-600 dark:text-gray-400">Loading news...</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="text-center py-12">
				<div className="text-6xl mb-4">😞</div>
				<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
					Failed to load feed
				</h3>
				<p className="text-gray-600 dark:text-gray-400">
					Please try again later
				</p>
			</div>
		);
	}

	return (
		<section className="space-y-8">
			{/* Header with improved styling */}
			<div className="text-center py-8 relative">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-3xl"></div>
				<div className="relative z-10">
					<div className="inline-flex items-center gap-4 mb-4">
						<div className="w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
							<span className="text-white text-3xl">📰</span>
						</div>
						<div className="text-left">
							<h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
								Latest News
							</h1>
							<p className="text-xl text-gray-800 dark:text-gray-200 mt-2">
								Stay updated with the latest stories from around the world
							</p>
						</div>
					</div>
				</div>

				{/* Stats bar */}
				<div className="flex items-center justify-center gap-6 text-sm text-gray-700 dark:text-gray-300">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 bg-green-500 rounded-full"></span>
						<span className="font-semibold">{items.length} articles</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 bg-blue-500 rounded-full"></span>
						<span className="font-semibold">Updated just now</span>
					</div>
				</div>
			</div>

			{items.length === 0 ? (
				<div className="text-center py-16">
					<div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
						<span className="text-4xl">📭</span>
					</div>
					<h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
						Nothing here yet
					</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						Check back later for new stories
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none backdrop-blur-sm"
					>
						<span className="text-lg">🔄</span>
						Refresh
					</button>
				</div>
			) : (
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((it: FeedItem, index: number) => (
						<article
							key={it.id}
							className="border border-white/20 dark:border-gray-600/40 rounded-3xl shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-700/95 cursor-pointer overflow-hidden slide-up group transition-[transform,box-shadow] duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<Link
								to={`/news/${it.id}`}
								state={{ url: it.link, title: it.title }}
								aria-label={`Open "${it.title}"`}
								className="block h-full"
							>
								{/* Article header with gradient */}
								<div className="relative overflow-hidden rounded-t-3xl">
									<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
									<div className="relative p-8">
										<div className="flex items-start gap-6">
											<div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl group-hover:scale-110 transition-transform duration-300">
												<span className="text-white text-2xl">📄</span>
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
													{it.title}
												</h3>
											</div>
										</div>
									</div>
								</div>

								{/* Article footer */}
								<div className="p-8 pt-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
											<span className="flex items-center gap-3">
												<span className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center">
													<span className="text-sm">📅</span>
												</span>
												<span className="font-semibold text-sm">{it.date}</span>
											</span>
										</div>
										<div className="flex items-center gap-3 text-blue-700 dark:text-blue-900 font-semibold bg-blue-100 dark:bg-blue-100 px-4 py-2 rounded-xl group-hover:gap-4 transition-all duration-300">
											<span>Read more</span>
											<span className="text-xl group-hover:translate-x-1 transition-transform duration-300">
												→
											</span>
										</div>
									</div>
								</div>
							</Link>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
