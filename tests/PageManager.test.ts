import { Collection } from 'discord.js';
import { PageManager } from '../src/PageManager';

const D_LIMIT = 25;

type Tuple = [number, string];

function getArray(startAt: number, length: number): Tuple[];
function getArray(
    placeAtTop: number[],
    startAt: number,
    length: number
): Tuple[];
function getArray(
    startOrTopRow: number | number[],
    startOrLength: number,
    length?: number
): Tuple[] {
    if (!Array.isArray(startOrTopRow))
        return new Array(startOrLength)
            .fill(0)
            .map((_, i) => [i + startOrTopRow, `${i + startOrTopRow}`]);

    const array = new Array(length)
        .fill(0)
        .map<Tuple>((_, i) => [i + startOrLength, `${i + startOrLength}`]);
    for (const n of startOrTopRow.reverse()) {
        const foundAt = array.findIndex((v) => v[0] === n);
        if (foundAt === -1) {
            array.pop();
        } else {
            array.splice(foundAt, 1);
        }

        array.unshift([n, `${n}`]);
    }
    return array;
}

function getUnchangedArray(pages: number, lastPageLength?: number): Tuple[][] {
    const array = new Array(pages)
        .fill(0)
        .map((_, i) => getArray(D_LIMIT * i, D_LIMIT));

    if (typeof lastPageLength === 'undefined') return array;

    const lastArray = array[pages - 1]!;
    while (lastArray.length > lastPageLength) {
        lastArray.pop();
    }
    return array;
}

function getPage<AsTuple extends boolean>(
    manager: PageManager<string>,
    verbose?: AsTuple
): AsTuple extends true ? Tuple[] : number[] {
    if (verbose === false) {
        return manager.getPage().map((v) => v[0]) as AsTuple extends true
            ? Tuple[]
            : number[];
    }
    return manager.getPage() as AsTuple extends true ? Tuple[] : number[];
}

function getManager(
    array: Tuple[] | string[],
    selected: number[],
    minChoices?: number,
    maxChoices?: number,
    currentPage?: number
): PageManager<string> {
    const collection = new Collection<number, string>();
    for (const n of selected) {
        collection.set(n, `${n}`);
    }

    const isTuple = (arr: typeof array): arr is Tuple[] => {
        return Array.isArray(arr[0]);
    };
    const newArray = isTuple(array) ? array.map((v) => v[1]) : array;
    return new PageManager(
        newArray,
        collection,
        minChoices ?? 0,
        maxChoices ?? selected.length + 1,
        currentPage
    );
}

test('WHEN PageManager is created with few items THEN only one page is generated.', () => {
    const manager = getManager(getArray(0, 10), []);

    expect(manager.max).toBe(0);
    expect(getPage(manager).length).toBe(10);
    expect(getPage(manager, false)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('WHEN carryselected is false THEN array remains unchanged', () => {
    const manager = getManager(getArray(0, D_LIMIT), [1, 4, 8]);

    expect(manager.max).toBe(0);
    expect(getPage(manager).length).toBe(D_LIMIT);
    expect(getPage(manager)).toEqual(getArray([], 0, D_LIMIT));
});

test('WHEN carryselected is true THEN array is changed', () => {
    const manager = getManager(getArray(0, D_LIMIT), [1, 4, 8], 3, 3);

    expect(manager.max).toBe(0);
    expect(getPage(manager).length).toBe(D_LIMIT);
    expect(getPage(manager)).toEqual(getArray([1, 4, 8], 0, D_LIMIT));
});

test('WHEN carryselected is true AND selected exists in array THEN array is changed', () => {
    const manager = getManager(getArray(0, D_LIMIT * 2), [30, 31, 32], 3, 3);

    const manuallyMadeOutput = [
        getArray([30, 31, 32], 0, D_LIMIT),
        getArray([30, 31, 32], D_LIMIT - 3, D_LIMIT),
        [30, 31, 32, 47, 48, 49].map((v) => [v, `${v}`])
    ];

    expect(manager.max).toBe(manuallyMadeOutput.length - 1);
    expect(getPage(manager)).toEqual(manuallyMadeOutput[0]);
    manager.last();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[2]);
    manager.previous();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[1]);
    manager.first();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[0]);
});

test('WHEN length exceeds discord limit AND carryselected is false THEN array remains unchanged', () => {
    const manager = getManager(getArray(0, D_LIMIT * 2), [1, 4, 8], 0, 5);

    const manuallyMadeOutput = [
        getArray(0, D_LIMIT),
        getArray(D_LIMIT, D_LIMIT)
    ];

    expect(manager.max).toBe(manuallyMadeOutput.length - 1);
    expect(getPage(manager)).toEqual(manuallyMadeOutput[0]);
    manager.next();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[1]);
});

test('WHEN length exceeds discord limit AND minChoices === maxChoices THEN array is changed', () => {
    let manager = getManager(getArray(0, D_LIMIT * 2), [1, 4, 8], 3, 3);

    const manuallyMadeOutput = [
        getArray([1, 4, 8], 0, D_LIMIT),
        getArray([1, 4, 8], D_LIMIT, D_LIMIT),
        [1, 4, 8, 47, 48, 49].map((v) => [v, `${v}`])
    ];

    expect(manager.max).toBe(manuallyMadeOutput.length - 1);
    expect(getPage(manager)).toEqual(manuallyMadeOutput[0]);
    manager.last();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[2]);
    manager.previous();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[1]);
    manager.previous();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[0]);
});

test('WHEN length exceeds discord limit AND minChoices === selected.size THEN array is changed', () => {
    let manager = getManager(getArray(0, D_LIMIT * 2), [1, 4, 8], 3, 5);

    const manuallyMadeOutput = [
        getArray([1, 4, 8], 0, D_LIMIT),
        getArray([1, 4, 8], D_LIMIT, D_LIMIT),
        [1, 4, 8, 47, 48, 49].map((v) => [v, `${v}`])
    ];

    expect(manager.max).toBe(manuallyMadeOutput.length - 1);
    expect(getPage(manager)).toEqual(manuallyMadeOutput[0]);
    manager.last();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[2]);
    manager.previous();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[1]);
    manager.previous();
    expect(getPage(manager)).toEqual(manuallyMadeOutput[0]);
});

test('WHEN selected values are on separate pages AND maxChoices is reached THEN unselected pages are skipped', () => {
    let manager = getManager(getArray(0, D_LIMIT * 3), [1, 40, 70], 0, 3);

    const defaultDistribution = getUnchangedArray(3);

    expect(manager.max).toBe(defaultDistribution.length - 1);
    expect(getPage(manager)).toEqual(defaultDistribution[0]);
    manager.last();
    expect(getPage(manager)).toEqual(defaultDistribution[2]);
    manager.previous();
    expect(getPage(manager)).toEqual(defaultDistribution[1]);
    manager.previous();
    expect(getPage(manager)).toEqual(defaultDistribution[0]);

    manager = getManager(getArray(0, D_LIMIT * 3), [1, 70], 0, 2);

    expect(manager.max).toBe(defaultDistribution.length - 1);
    expect(getPage(manager)).toEqual(defaultDistribution[0]);
    manager.next();
    expect(getPage(manager)).toEqual(defaultDistribution[2]);
    manager.previous();
    expect(getPage(manager)).toEqual(defaultDistribution[0]);
    manager.selected.delete(1);
    manager.next();
    expect(getPage(manager)).toEqual(defaultDistribution[1]);
});

test('WHEN selected values change THEN pages change according to minChoices/maxChoices requirements', () => {
    let manager = getManager(getArray(0, D_LIMIT * 8), [], 0, 5);

    const defaultDistribution = getUnchangedArray(8);

    expect(manager.max).toBe(defaultDistribution.length - 1);
    for (let i = 0; i < 8; i++) {
        expect(getPage(manager)).toEqual(defaultDistribution[i]);
        manager.next();
    }

    const threeDistribution = [
        getArray([1, 80, 150], 0, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT - 2, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 2 - 5, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 3 - 8, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 4 - 10, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 5 - 13, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 6 - 16, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 7 - 18, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 8 - 21, D_LIMIT),
        getArray([1, 80, 150], D_LIMIT * 9 - 24, 20)
    ];

    manager = getManager(getArray(0, D_LIMIT * 8), [1, 80, 150], 3, 5);
    for (let i = 0; i < 8; i++) {
        expect(getPage(manager)).toEqual(threeDistribution[i]);
        manager.next();
    }

    manager = getManager(getArray(0, D_LIMIT * 8), [1, 80, 150], 3, 3);
    for (let i = 0; i < 8; i++) {
        expect(getPage(manager)).toEqual(threeDistribution[i]);
        manager.next();
    }

    manager = getManager(getArray(0, D_LIMIT * 8), [1, 80, 150], 0, 3);
    expect(getPage(manager)).toEqual(defaultDistribution[0]);
    manager.next();
    expect(getPage(manager)).toEqual(defaultDistribution[3]);
    manager.next();
    expect(getPage(manager)).toEqual(defaultDistribution[6]);
    manager.first();
    expect(getPage(manager)).toEqual(defaultDistribution[0]);
    manager.last();
    expect(getPage(manager)).toEqual(defaultDistribution[6]);
    manager.previous();
    expect(getPage(manager)).toEqual(defaultDistribution[3]);
    manager.previous();
    expect(getPage(manager)).toEqual(defaultDistribution[0]);
});
