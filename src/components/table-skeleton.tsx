import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

const ROWS = ["sk-r0", "sk-r1", "sk-r2", "sk-r3", "sk-r4"];
const COLS = ["sk-c0", "sk-c1", "sk-c2", "sk-c3", "sk-c4"];

export function TableSkeleton() {
	return (
		<TableBody>
			{ROWS.map((row) => (
				<TableRow key={row}>
					{COLS.map((col) => (
						<TableCell key={col}>
							<Skeleton className="h-4 w-full" />
						</TableCell>
					))}
				</TableRow>
			))}
		</TableBody>
	);
}
