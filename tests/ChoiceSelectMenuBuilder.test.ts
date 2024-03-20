import {
    APISelectMenuOption,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js';
import { ChoiceSelectMenuBuilder } from '../src/ChoiceSelectMenuBuilder';

interface TestOption {
    foo: string;
    bar: string;
}

const D_LIMIT = 25;

function getBuilder(length: number): ChoiceSelectMenuBuilder<TestOption> {
    return new ChoiceSelectMenuBuilder(getOptions(length));
}

/**
 * Generates a list of options that fits the UserChoiceComponent for testing purposes.
 * @param n The number of elements in the array
 * @returns
 */
function getOptions(n: number): TestOption[] {
    const output: TestOption[] = [];
    for (let i = 0; i < n; i++) {
        output.push({
            foo: `foo${i}`,
            bar: `bar${i}`
        });
    }

    return output;
}

function getFirstOption(
    menu: ChoiceSelectMenuBuilder<any>
): Partial<APISelectMenuOption> {
    const menuComponent = menu.toActionRow().at(-1)?.components[0];
    if (!(menuComponent instanceof StringSelectMenuBuilder)) return {};

    return menuComponent.options.at(0)?.data ?? {};
}

function getOptionBuilders(
    menu: ChoiceSelectMenuBuilder<any>
): StringSelectMenuOptionBuilder[] {
    return (
        (
            menu.toActionRow().at(-1)?.components[0] as
                | StringSelectMenuBuilder
                | undefined
        )?.options ?? []
    );
}

function hasDuplicates(array: any[]) {
    return new Set(array).size !== array.length;
}

test('WHEN ChoiceSelectMenuBuilder is initiated THEN no error is thrown.', () => {
    const selectMenu = getBuilder(3)
        .setCustomId('testingId')
        .setMinChoices(1)
        .setMaxChoices(3);
    expect(selectMenu.data.customId).toBe('testingId');
    expect(selectMenu.data.pages.minChoices).toBe(1);
    expect(selectMenu.data.pages.maxChoices).toBe(3);
    expect(selectMenu.options.length).toBe(3);
    expect(selectMenu.data.selected.size).toBe(0);
    expect(selectMenu.values.length).toBe(0);
    expect(selectMenu.firstValue).toBeUndefined();

    selectMenu.setValues(() => true);
    expect(selectMenu.data.selected.size).toBe(3);
    expect(selectMenu.values.length).toBe(3);
    expect(selectMenu.firstValue).toBeDefined();

    const newSelectMenu = new ChoiceSelectMenuBuilder(
        getOptions(60),
        () => true
    );
    expect(newSelectMenu.values.length).toBe(60);
});

test('WHEN array is <= Discord Limit THEN no navigators are created', () => {
    let selectMenu = getBuilder(3)
        .setCustomId('testingId')
        .setMinChoices(1)
        .setMaxChoices(3)
        .setLabel((v) => v.foo);

    const actionRow = selectMenu.toActionRow();
    expect(actionRow.length).toBe(1);
    expect(actionRow[0]).toBeInstanceOf(
        ActionRowBuilder<StringSelectMenuBuilder>
    );
    const empty: TestOption[] = [];
    selectMenu = new ChoiceSelectMenuBuilder(empty)
        .setCustomId('testingId')
        .setLabel((v) => v.foo);

    expect(selectMenu.toActionRow()).toEqual([]);
});

test('WHEN array is > Discord Limit THEN navigators are created.', () => {
    const selectMenu = getBuilder(D_LIMIT + 1)
        .setMinChoices(1)
        .setMaxChoices(3)
        .setLabel((v) => v.foo)
        .setCustomId('testingId');

    const actionRow = selectMenu.toActionRow();
    expect(actionRow.length).toBe(2);
    expect(actionRow[0]).toBeInstanceOf(ActionRowBuilder<ButtonBuilder>);
    expect(actionRow[1]).toBeInstanceOf(
        ActionRowBuilder<StringSelectMenuBuilder>
    );
});

test('WHEN array is > Discord Limit THEN pages can be changed', () => {
    const selectMenu = getBuilder(D_LIMIT * 2 + 1)
        .setLabel((v) => v.foo)
        .setCustomId('testingId');

    const pageOne = selectMenu.optionsOnPage();
    selectMenu.toLastPage();
    const pageThree = selectMenu.optionsOnPage();
    selectMenu.toPreviousPage();
    const pageTwo = selectMenu.optionsOnPage();

    expect(pageOne.length).toBe(25);
    expect(pageTwo.length).toBe(25);
    expect(pageThree.length).toBe(1);

    selectMenu.toFirstPage();
    expect(selectMenu.optionsOnPage()).toEqual(pageOne);

    expect(selectMenu.optionsOnPage(0)).toEqual(pageOne);
    expect(selectMenu.optionsOnPage(1)).toEqual(pageTwo);
    expect(selectMenu.optionsOnPage(2)).toEqual(pageThree);
});

test('WHEN array is > Discord Limit AND maxChoices is filled THEN only pages with selections are showed', () => {
    const selectMenu = getBuilder(D_LIMIT * 2 + 10)
        .setLabel((v) => v.foo)
        .setCustomId('testingId')
        .setMaxChoices(3)
        .setValues((v) => ['foo3', 'foo55', 'foo56'].includes(v.foo));

    expect(selectMenu.selectedOnPage().length).toBe(1);
    expect(selectMenu.optionsOnPage().length).toBe(D_LIMIT);

    selectMenu.toNextPage();
    expect(selectMenu.selectedOnPage().length).toBe(2);
    expect(selectMenu.optionsOnPage().length).toBe(10);

    selectMenu.popValue();
    selectMenu.toPreviousPage();
    expect(selectMenu.selectedOnPage().length).toBe(0);
    expect(selectMenu.optionsOnPage().length).toBe(D_LIMIT);

    selectMenu.toFirstPage();
    selectMenu.setValues((v) => ['foo1', 'foo2', 'foo3'].includes(v.foo));

    expect(selectMenu.selectedOnPage()).toEqual(selectMenu.values);
    expect(selectMenu.data.pages.current).toBe(0);
    selectMenu.toNextPage();
    expect(selectMenu.selectedOnPage()).toEqual(selectMenu.values);
    expect(selectMenu.data.pages.current).toBe(0);
    selectMenu.toLastPage();
    expect(selectMenu.selectedOnPage()).toEqual(selectMenu.values);
    expect(selectMenu.data.pages.current).toBe(0);
});

test('WHEN label and description are set THEN labels and description change', () => {
    const selectMenu = getBuilder(D_LIMIT + 1)
        .setMinChoices(1)
        .setMaxChoices(3)
        .setLabel((v) => v.foo)
        .setCustomId('testingId');

    let firstOption = getFirstOption(selectMenu);
    expect(firstOption).toBeDefined();
    expect(firstOption?.label).toBe('foo0');
    expect(firstOption?.description).toBeUndefined();

    selectMenu.setLabel((v) => v.bar);

    firstOption = getFirstOption(selectMenu);
    expect(firstOption).toBeDefined();
    expect(firstOption?.label).toBe('bar0');
    expect(firstOption?.description).toBeUndefined();

    selectMenu.setDescription((v) => v.foo);

    firstOption = getFirstOption(selectMenu);
    expect(firstOption).toBeDefined();
    expect(firstOption?.label).toBe('bar0');
    expect(firstOption?.description).toBe('foo0');
});

test('WHEN input data is invalid THEN throw error', () => {
    expect(() => getBuilder(2).setMinChoices(3)).toThrow(Error);

    expect(() => {
        getBuilder(2).setMaxChoices(0);
    }).toThrow(Error);

    expect(() => {
        getBuilder(2).setMaxChoices(-5);
    }).toThrow(Error);

    expect(() => getBuilder(2).setMaxChoices(3)).toThrow(Error);

    expect(() => getBuilder(2).setMinChoices(2).setMaxChoices(2)).not.toThrow(
        Error
    );

    const testProps = getBuilder(2);
    expect(() => testProps.toActionRow()).toThrow(Error);
    testProps.setCustomId('testingId');
    expect(() => testProps.toActionRow()).not.toThrow(Error);
});

test('WHEN minChoices is > 0 THEN selections are carried over', () => {
    const selectMenu = getBuilder(D_LIMIT * 2 + 5)
        .setCustomId('testingId')
        .setMinChoices(1)
        .setLabel((v) => v.foo)
        .setValues((v) => v.foo === 'foo0');

    expect(selectMenu.selectedOnPage(0).length).toBe(1);
    expect(selectMenu.selectedOnPage(1).length).toBe(1);

    selectMenu
        .setMinChoices(3)
        .setMaxChoices(5)
        .setValues((v) =>
            ['foo0', 'foo1', 'foo2', 'foo3', 'foo4'].includes(v.foo)
        );

    expect(selectMenu.selectedOnPage(0).length).toBe(5);
    expect(selectMenu.selectedOnPage(1).length).toBe(5);
    expect(selectMenu.selectedOnPage(2).length).toBe(5);

    selectMenu.popValue();

    expect(selectMenu.selectedOnPage(0).length).toBe(4);
    expect(selectMenu.selectedOnPage(1).length).toBe(4);
    expect(selectMenu.selectedOnPage(2).length).toBe(4);

    selectMenu.setValues((v) =>
        ['foo45', 'foo46', 'foo2', 'foo18', 'foo4'].includes(v.foo)
    );

    expect(selectMenu.selectedOnPage(0).length).toBe(5);
    expect(selectMenu.selectedOnPage(1).length).toBe(5);
    expect(selectMenu.selectedOnPage(2).length).toBe(5);
});

test('WHEN actionRow is generated THEN properties align with Discord requirements', () => {
    const selectMenu = getBuilder(D_LIMIT * 2 + 10)
        .setCustomId('testingId')
        .setLabel((v) => v.foo);

    for (let i = 0, max = selectMenu.data.pages.max; i <= max; i++) {
        const labels = getOptionBuilders(selectMenu).map((v) => v.data.label);
        const values = getOptionBuilders(selectMenu).map((v) => v.data.value);
        const defaults = getOptionBuilders(selectMenu)
            .map((v) => v.data.default)
            .filter(Boolean);

        expect(labels.some((v) => typeof v === 'undefined')).toBe(false);
        expect(hasDuplicates(values)).toBe(false);
        expect(defaults.length).toBe(0);
    }

    selectMenu
        .setMinChoices(1)
        .setMaxChoices(1)
        .setValues((v) => v.foo === 'foo5');

    for (let i = 0, max = selectMenu.data.pages.max; i <= max; i++) {
        const labels = getOptionBuilders(selectMenu).map((v) => v.data.label);
        const values = getOptionBuilders(selectMenu).map((v) => v.data.value);
        const defaults = getOptionBuilders(selectMenu)
            .map((v) => v.data.default)
            .filter(Boolean);

        expect(labels.some((v) => typeof v === 'undefined')).toBe(false);
        expect(hasDuplicates(values)).toBe(false);
        expect(defaults.length).toBe(1);
    }
});

test('WHEN setters are called THEN data changes', () => {
    const menu = getBuilder(D_LIMIT * 2)
        .setCustomId('testingId')
        .setNavigatorStyle(ButtonStyle.Danger)
        .setPageLabelStyle(ButtonStyle.Success)
        .setPlaceholder('Static string')
        .setMinChoices(1)
        .setMaxChoices(3)
        .setLabel((v) => v.foo)
        .setDescription((v) => v.bar);

    expect(menu.data.customId).toBe('testingId');
    expect(menu.data.navigatorStyle).toBe(ButtonStyle.Danger);
    expect(menu.data.pageLabelStyle).toBe(ButtonStyle.Success);
    expect(menu.data.placeholder).toBe('Static string');
    expect(menu.data.pages.minChoices).toBe(1);
    expect(menu.data.pages.maxChoices).toBe(3);

    const labelFn = menu.data.labelFn;
    const descriptionFn = menu.data.descriptionFn;

    expect(labelFn({ foo: 'test', bar: '' }, 0)).toBe('test');
    expect(descriptionFn?.({ foo: 'test', bar: 'barTest' }, 5)).toBe('barTest');

    menu.setPlaceholder((min, max) => `Select ${min}-${max}`);

    expect(typeof menu.data.placeholder).toBe('function');
    expect(
        typeof menu.data.placeholder === 'function'
            ? menu.data.placeholder(8, 15)
            : 'N/A'
    ).toBe('Select 8-15');

    menu.setPlaceholder((_, max) => `Select up to ${max}`);
    const actionRows = menu.toActionRow();

    const apiSelectMenu = actionRows
        .at(1)
        ?.components.at(0) as StringSelectMenuBuilder;

    const apiButton = actionRows.at(0)?.components.at(0) as ButtonBuilder;

    expect(apiSelectMenu.data.custom_id).toBe('testingId');
    expect(apiSelectMenu.data.placeholder).toBe('Select up to 3');
    expect(apiButton.data.style).toBe(ButtonStyle.Danger);
});
