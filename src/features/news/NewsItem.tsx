import type { NewsItem as News } from "../../types/news";

type Props = {
	item: News;
	className?: string;
};

export default function NewsItem({ item, className }: Props) {
	return (
		<article className={className}>
			{item.image && (
				<img
					src={item.image}
					alt={item.title}
					loading="lazy"
					decoding="async"
					width={600}
					height={400}
					className="w-full h-40 object-cover"
				/>
			)}

			<div className="p-4">
				<h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
					{item.title}
				</h3>
				<p className="text-sm text-gray-600 dark:text-gray-300">
					{item.description}
				</p>
			</div>
		</article>
	);
}
