import {
    APISelectMenuOption,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} from 'discord.js';
import { ChoiceSelectMenuBuilder } from '../src';

interface TestOption {
    foo: string;
    bar: string;
}

test('File can be initiated', () => {
    const selectMenu = new ChoiceSelectMenuBuilder(getOptions(3))
        .setCustomId('testingId')
        .setMinChoices(1)
        .setMaxChoices(3);
    expect(selectMenu.data.customId).toBe('testingId');
    expect(selectMenu.data.minChoices).toBe(1);
    expect(selectMenu.data.maxChoices).toBe(3);
    expect(selectMenu.options.length).toBe(3);
    expect(selectMenu.data.selected.size).toBe(0);
    expect(selectMenu.values.length).toBe(0);
    expect(selectMenu.firstValue).toBeUndefined();

    selectMenu.setValues(() => true);
    expect(selectMenu.data.selected.size).toBe(3);
    expect(selectMenu.values.length).toBe(3);
    expect(selectMenu.firstValue).toBeDefined();
});

test('Component can generate actionRow for <= 25', () => {
    const selectMenu = new ChoiceSelectMenuBuilder(getOptions(3))
        .setCustomId('testingId')
        .setMinChoices(1)
        .setMaxChoices(3)
        .setLabel((v) => v.foo);

    const actionRow = selectMenu.toActionRow();
    expect(actionRow.length).toBe(1);
    // expect(actionRow[0]).toBeInstanceOf(
    //     ActionRowBuilder<StringSelectMenuBuilder>
    // );
});

test('Component can generate actionRows for > 25', () => {
    const selectMenu = new ChoiceSelectMenuBuilder(getOptions(26))
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

test('Component can generate labels and descriptions', () => {
    const selectMenu = new ChoiceSelectMenuBuilder(getOptions(26))
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

test('Component can paginate', () => {
    const selectMenu = new ChoiceSelectMenuBuilder(getOptions(51))
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
    const newPageOne = selectMenu.optionsOnPage();
    expect(newPageOne).toEqual(pageOne);
});

test('Component resepects maxChoices for pagination', () => {
    const selectMenu = new ChoiceSelectMenuBuilder(getOptions(60))
        .setLabel((v) => v.foo)
        .setCustomId('testingId')
        .setMaxChoices(3)
        .setValues((v) => ['foo0', 'foo55', 'foo56'].includes(v.foo));
    // since max was reached, we should not have page 2 now
    const selectedOne = selectMenu.selectedOnPage();
    selectMenu.toNextPage();
    const selectedThree = selectMenu.selectedOnPage();
    const pageThree = selectMenu.optionsOnPage();

    expect(selectedOne.length).toBe(1);
    selectMenu.toNextPage();
    expect(selectedThree.length).toBe(2);
    expect(pageThree.length).toBe(10);
    selectMenu.popValue();
    selectMenu.toPreviousPage();
    const selectedTwo = selectMenu.selectedOnPage();
    expect(selectedTwo.length).toBe(0);
});

test('Component validates input data', () => {
    expect(() =>
        new ChoiceSelectMenuBuilder(getOptions(2)).setMinChoices(3)
    ).toThrow(Error);

    expect(() => {
        new ChoiceSelectMenuBuilder(getOptions(2)).setMaxChoices(0);
    }).toThrow(Error);

    expect(() => {
        new ChoiceSelectMenuBuilder(getOptions(2)).setMaxChoices(-5);
    }).toThrow(Error);

    expect(() =>
        new ChoiceSelectMenuBuilder(getOptions(2)).setMaxChoices(3)
    ).toThrow(Error);

    expect(() =>
        new ChoiceSelectMenuBuilder(getOptions(2))
            .setMinChoices(2)
            .setMaxChoices(2)
    ).not.toThrow(Error);

    const testRequiredProps = new ChoiceSelectMenuBuilder(getOptions(2));
    expect(() => testRequiredProps.toActionRow()).toThrow(Error);
    testRequiredProps.setCustomId('testingId');
    expect(() => testRequiredProps.toActionRow()).not.toThrow(Error);
});

test('Pages can be changed even if minChoices and maxChoices are equal', () => {
    const selectMenu = new ChoiceSelectMenuBuilder(getOptions(55))
        .setCustomId('testingId')
        .setMinChoices(1)
        .setMaxChoices(1)
        .setLabel((v) => v.foo)
        .setValues((v) => v.foo === 'foo0');

    expect(selectMenu.selectedOnPage().length).toBe(1);
    expect(selectMenu.data.page.current).toBe(0);
    selectMenu.toNextPage();
    expect(selectMenu.selectedOnPage().length).toBe(1);
    expect(selectMenu.data.page.current).toBe(1);

    selectMenu
        .setMaxChoices(5)
        .setMinChoices(5)
        .setValues((v) =>
            ['foo0', 'foo1', 'foo2', 'foo3', 'foo4'].includes(v.foo)
        );

    expect(selectMenu.selectedOnPage().length).toBe(5);
    expect(selectMenu.data.page.current).toBe(1);
    selectMenu.toPreviousPage();
    expect(selectMenu.selectedOnPage().length).toBe(5);
    expect(selectMenu.data.page.current).toBe(0);
    selectMenu.toLastPage();
    expect(selectMenu.selectedOnPage().length).toBe(5);
    expect(selectMenu.data.page.current).toBe(selectMenu.data.page.max);
});

test('Setters change the data', () => {
    const menu = new ChoiceSelectMenuBuilder(getOptions(50))
        .setCustomId('testingId')
        .setButtonStyles(ButtonStyle.Danger, ButtonStyle.Success)
        .setPlaceholder('Static string')
        .setMinChoices(1)
        .setMaxChoices(3)
        .setLabel((v) => v.foo)
        .setDescription((v) => v.bar);

    expect(menu.data.customId).toBe('testingId');
    expect(menu.data.buttonStyles.navigator).toBe(ButtonStyle.Danger);
    expect(menu.data.buttonStyles.middle).toBe(ButtonStyle.Success);
    expect(menu.data.placeholder).toBe('Static string');
    expect(menu.data.minChoices).toBe(1);
    expect(menu.data.maxChoices).toBe(3);

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
