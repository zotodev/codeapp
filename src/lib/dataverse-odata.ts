import type { IGetAllOptions } from "@/generated/models/CommonModels";
import { getValidFilters } from "@/lib/data-table";
import type {
	ExtendedColumnFilter,
	JoinOperator,
} from "@/types/data-table";

function escapeODataString(value: string): string {
	return value.replace(/'/g, "''");
}

function formatValue(value: string, variant: string): string {
	switch (variant) {
		case "number":
		case "range":
			return value;
		case "boolean":
			return value === "true" || value === "1" ? "true" : "false";
		case "date":
		case "dateRange":
			return value;
		default:
			return `'${escapeODataString(value)}'`;
	}
}

function buildRelativeToTodayExpression(col: string, value: string): string {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const lower = value.toLowerCase();

	if (lower === "today") {
		const end = new Date(today);
		end.setHours(23, 59, 59, 999);
		return `(${col} ge ${today.toISOString()} and ${col} le ${end.toISOString()})`;
	}

	const pastMatch = lower.match(/^past[_\s](\d+)[_\s]days?$/);
	if (pastMatch) {
		const n = parseInt(pastMatch[1], 10);
		const from = new Date(today);
		from.setDate(from.getDate() - n);
		return `(${col} ge ${from.toISOString()} and ${col} le ${new Date().toISOString()})`;
	}

	const nextMatch = lower.match(/^next[_\s](\d+)[_\s]days?$/);
	if (nextMatch) {
		const n = parseInt(nextMatch[1], 10);
		const to = new Date(today);
		to.setDate(to.getDate() + n);
		to.setHours(23, 59, 59, 999);
		return `(${col} ge ${new Date().toISOString()} and ${col} le ${to.toISOString()})`;
	}

	// Fallback: treat as "today"
	const end = new Date(today);
	end.setHours(23, 59, 59, 999);
	return `(${col} ge ${today.toISOString()} and ${col} le ${end.toISOString()})`;
}

function buildFilterExpression<TData>(
	filter: ExtendedColumnFilter<TData>,
): string | null {
	const col = filter.id as string;
	const { operator, variant } = filter;
	const value = filter.value;

	switch (operator) {
		case "isEmpty":
			return `${col} eq null`;
		case "isNotEmpty":
			return `${col} ne null`;
		default:
			break;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) return null;

		if (operator === "isBetween") {
			const [a, b] = value;
			if (!a || !b) return null;
			const fa = formatValue(a, variant);
			const fb = formatValue(b, variant);
			return `(${col} ge ${fa} and ${col} le ${fb})`;
		}

		if (operator === "inArray") {
			const clauses = value
				.filter(Boolean)
				.map((v) => `${col} eq ${formatValue(v, variant)}`);
			if (clauses.length === 0) return null;
			return `(${clauses.join(" or ")})`;
		}

		if (operator === "notInArray") {
			const clauses = value
				.filter(Boolean)
				.map((v) => `${col} eq ${formatValue(v, variant)}`);
			if (clauses.length === 0) return null;
			return `not (${clauses.join(" or ")})`;
		}

		// For other operators, use first value
		const singleValue = value[0];
		if (!singleValue) return null;
		return buildSingleValueExpression(col, operator, variant, singleValue);
	}

	if (typeof value !== "string" || value === "") return null;
	return buildSingleValueExpression(col, operator, variant, value);
}

function buildSingleValueExpression(
	col: string,
	operator: string,
	variant: string,
	value: string,
): string | null {
	const fv = formatValue(value, variant);

	switch (operator) {
		case "iLike":
			return `contains(${col}, ${fv})`;
		case "notILike":
			return `not contains(${col}, ${fv})`;
		case "eq":
			return `${col} eq ${fv}`;
		case "ne":
			return `${col} ne ${fv}`;
		case "lt":
			return `${col} lt ${fv}`;
		case "lte":
			return `${col} le ${fv}`;
		case "gt":
			return `${col} gt ${fv}`;
		case "gte":
			return `${col} ge ${fv}`;
		case "isRelativeToToday":
			return buildRelativeToTodayExpression(col, value);
		default:
			return null;
	}
}

export function buildDataverseFilter<TData>(
	filters: ExtendedColumnFilter<TData>[],
	joinOperator: JoinOperator = "and",
): string | undefined {
	const expressions = filters
		.map((f) => buildFilterExpression(f))
		.filter((e): e is string => e !== null);

	if (expressions.length === 0) return undefined;
	if (expressions.length === 1) return expressions[0];

	const joiner = joinOperator === "or" ? " or " : " and ";
	return `(${expressions.join(joiner)})`;
}

export function buildDataverseOrderBy(
	sorting: { id: string; desc: boolean }[],
): string[] | undefined {
	if (sorting.length === 0) return undefined;
	return sorting.map((s) => `${s.id} ${s.desc ? "desc" : "asc"}`);
}

export function buildDataverseQuery<TData>({
	filters,
	joinOperator,
	sorting,
}: {
	filters: ExtendedColumnFilter<TData>[];
	joinOperator: JoinOperator;
	sorting: { id: string; desc: boolean }[];
}): Pick<IGetAllOptions, "filter" | "orderBy"> {
	const validFilters = getValidFilters(filters);
	return {
		filter: buildDataverseFilter(validFilters, joinOperator),
		orderBy: buildDataverseOrderBy(sorting),
	};
}
