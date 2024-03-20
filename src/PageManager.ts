import { Collection } from 'discord.js';

export class PageManager<T> {
    constructor(
        array: T[],
        selected: Collection<number, T>,
        minChoices: number,
        maxChoices?: number,
        currentPage = 0
    ) {
        this.current = currentPage;
        this.array = array;
        this.selected = selected;
        this.minChoices = minChoices;
        if (maxChoices) {
            this.maxChoices = maxChoices;
        }
    }

    /**
     * The length that a single select menu page can have.
     */
    length = 25;

    /**
     * A reference to the array to paginate.
     */
    array: T[];
    /**
     * A reference to the selected elements.
     */
    selected: Collection<number, T>;

    /**
     * The 0-indexed page the builder is currently on.
     * This is always in the range `0 <= current <= max`
     */
    current: number;
    /**
     * The minimum amount of choices that a user must make.
     * Note that it only prevents selecting less than this value, it
     * can still be visually shown without any selections.
     */
    minChoices: number;
    /**
     * The maximum amount of choices that a user may make.
     * This value defaults to `options.length`.
     */
    maxChoices?: number;

    get carrySelected(): boolean {
        return this.minChoices > 0;
    }

    /**
     * The maximum 0-indexed page the builder can reach.
     * This property is derived from the page's length
     */
    get max(): number {
        if (!this.carrySelected)
            return Math.ceil(this.array.length / this.length) - 1;

        /*
        Intuition:
            The selected values must exist on every page, so the page size
            will be reduced. However, spread across all pages, all the selected
            values exist. Therefore, we do not need to always remove the same
            amount per page.
        */
        const notSelected = this.array.length - this.selected.size;
        const newPageSize = this.length - this.selected.size;

        return Math.ceil(notSelected / newPageSize) - 1;
    }

    getPage(pageNumber?: number): [index: number, element: T][] {
        const page = Math.min(this.max, pageNumber ?? this.current);

        if (!this.carrySelected) {
            const start = page * this.length;
            const end = start + this.length;
            return this.getSlice(start, end, false);
        }

        const keys = [...this.selected.keys()];

        let currentPage = 0;
        let start = 0;

        while (currentPage < page) {
            start = this.getEndIndex(start, keys);
            currentPage++;
        }

        const end = this.getEndIndex(start, keys);

        const output = [
            ...this.selected.entries(),
            ...this.getSlice(start, end, true)
        ] as [number, T][];

        if (output.length > this.length)
            throw new Error(
                `Generated page exceeds set page length.\nExpected: <Array>.length <= ${this.length}\nActual: ${output.length}`
            );
        return output;
    }

    /**
     * Returns a slice of the array, along with its actual index location.
     * @param start - The start of the slice.
     * @param end - The end of the slice.
     * @param removeSelected - Removes selected indeces from the sliced array.
     */
    private getSlice(
        start: number,
        end: number,
        removeSelected: boolean
    ): [index: number, element: T][] {
        const newSlice: [number, T][] = this.array
            .slice(start, end)
            .map((e, i) => [i + start, e]);

        if (!removeSelected) return newSlice;
        return newSlice
            .filter(([i, _]) => !this.selected.has(i))
            .slice(0, this.length - this.selected.size);
    }

    /**
     * Get the end index of the page starting from the start parameter.
     * Will include more elements if the keys exist on the page.
     * @param start - The offset to base the end index on.
     * @param selectedIndeces - The selected indeces
     */
    private getEndIndex(start: number, selectedIndeces: number[]): number {
        let end = start + this.length;
        const withinBounds = selectedIndeces.filter(
            (i) => i >= start && i < end
        ).length;
        return end - selectedIndeces.length + withinBounds;
    }

    public first(): void {
        if (this.hasFreePageMovement()) {
            this.current = 0;
            return;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go back the first
        // page that has selections on it.

        // maxChoices is always > 0, so selected.size cannot be 0 from if guard above
        const minSelected = Math.min(...this.selected.keys());
        if (!isFinite(minSelected)) return;

        this.current = Math.ceil(minSelected / this.length);

        if (minSelected % this.length !== 0) {
            this.current -= 1;
        }
    }

    public previous(): void {
        if (this.hasFreePageMovement()) {
            this.current = Math.max(0, this.current - 1);
            return;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go back to the closest
        // page that has selections on it.
        const currentPageStart = this.current * this.length;
        // maxChoices is always > 0, so selected.size cannot be 0 from if guard above
        const maxPreviousIndex = Math.max(
            ...this.selected.filter((_, n) => n < currentPageStart).keys()
        );
        if (!isFinite(maxPreviousIndex)) return;

        this.current = Math.ceil(maxPreviousIndex / this.length);

        if (maxPreviousIndex % this.length !== 0) {
            this.current -= 1;
        }
    }

    public next(): void {
        const max = this.max;
        if (this.hasFreePageMovement()) {
            this.current = Math.min(max, this.current + 1);
            return;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go forward to the closest
        // page that has selections on it.
        const currentPageEnd = this.current * this.length + this.length;
        const minNextIndex = Math.min(
            ...this.selected.filter((_, n) => n >= currentPageEnd).keys()
        );
        if (!isFinite(minNextIndex)) return;

        this.current = Math.ceil(minNextIndex / this.length);

        if (minNextIndex % this.length !== 0) {
            this.current -= 1;
        }
    }

    public last(): void {
        const max = this.max;
        if (this.hasFreePageMovement()) {
            this.current = max;
            return;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go forward to the last
        // page that has selections on it.
        const maxSelected = Math.max(...this.selected.keys());
        if (!isFinite(maxSelected)) return;
        // maxChoices is always > 0, so selected.size cannot be 0 from if guard above
        this.current = Math.ceil(maxSelected / this.length);

        if (maxSelected % this.length !== 0) {
            this.current -= 1;
        }
    }

    private hasFreePageMovement(): boolean {
        return (
            // carrySelected follows the user no matter where
            this.carrySelected ||
            // no pagination
            this.array.length <= this.length ||
            // maxChoices has not yet been filled
            this.selected.size < (this.maxChoices ?? this.array.length)
        );
    }
}
