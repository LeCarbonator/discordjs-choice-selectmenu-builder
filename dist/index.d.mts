import { Collection, ButtonStyle, Interaction, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } from 'discord.js';

declare class PageManager<T> {
    constructor(array: T[], selected: Collection<number, T>, minChoices: number, maxChoices?: number, currentPage?: number);
    /**
     * The length that a single select menu page can have.
     */
    length: number;
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
    get carrySelected(): boolean;
    /**
     * The maximum 0-indexed page the builder can reach.
     * This property is derived from the page's length
     */
    get max(): number;
    getPage(pageNumber?: number): [index: number, element: T][];
    /**
     * Returns a slice of the array, along with its actual index location.
     * @param start - The start of the slice.
     * @param end - The end of the slice.
     * @param removeSelected - Removes selected indeces from the sliced array.
     */
    private getSlice;
    /**
     * Get the end index of the page starting from the start parameter.
     * Will include more elements if the keys exist on the page.
     * @param start - The offset to base the end index on.
     * @param selectedIndeces - The selected indeces
     */
    private getEndIndex;
    first(): void;
    previous(): void;
    next(): void;
    last(): void;
    private hasFreePageMovement;
}

/**
 * Represents a callback function that is passed to Array prototype methods such as
 * `.map()`, `.filter()` and `.forEach()` .
 */
type ArrayCallback<T, ReturnValue> = (element: T, index: number, array: T[]) => ReturnValue;
type PageSelectComponent<ChoiceType> = {
    /**
     * The custom ID that this select menu uses.
     */
    customId?: string;
    /**
     * A collection of selected values and the index they are found at.
     * The key is used to ensure pagination is applied correctly
     * The values represent the selected items of the array.
     */
    selected: Collection<number, ChoiceType>;
    /**
     * The placeholder to display on the select menu.
     */
    placeholder?: string | ((minChoices: number, maxChoices: number) => string);
    /**
     * The callback function to transform an array element into a readable
     * label string. Note that discord's character limit on labels apply.
     * @param option - An element from the `options` array.
     * @param index - The element's index in the `options` array.
     * @returns - A string that must be below Discord's character limit for
     * select menu option labels.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     */
    labelFn: (option: ChoiceType, index: number) => string;
    /**
     * The callback function to transform an array element into a readable
     * description string. Note that discord's character limit on descriptions apply.
     * Will not create a description by default.
     * @param option - An element from the `options` array.
     * @param index - The element's index in the `options` array.
     * @returns - A string that must be below Discord's character limit for
     * select menu option descriptions.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     */
    descriptionFn?: (option: ChoiceType, index: number) => string;
    /**
     * Contains data related to pages and methods to change them.
     */
    pages: PageManager<ChoiceType>;
    /**
     * The button style for the nagivator buttons, which include
     * ⏮️,◀️,▶️, and ⏭️.
     * Note that navigator buttons only show up if there are more
     * options than the defined page length of this builder.
     */
    navigatorStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
    /**
     * The button style for the center button displaying the available
     * pages.
     * Note that navigator buttons only show up if there are more
     * options than the defined page length of this builder.
     */
    pageLabelStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
};
/**
 * The three types of Tuples that are generated
 * by the UserChoiceComponent. It either includes
 * only the select menu, or it also includes
 * the page buttons. If there are no elements
 * present, it will return empty.
 */
type PageSelectMenuActionRow = [] | [menu: ActionRowBuilder<StringSelectMenuBuilder>] | [
    pageButtons: ActionRowBuilder<ButtonBuilder>,
    menu: ActionRowBuilder<StringSelectMenuBuilder>
];
/**
 * Represents the three main types of setting values as selected.
 * - If the passed type is a function, that function will be called to set the values.
 * - If the passed type is an array, it will default to `Array#includes()`.
 * - Otherwise, `Object.is()` equality is used.
 */
type SelectCallback<ChoiceType> = ChoiceType | ChoiceType[] | ArrayCallback<ChoiceType, boolean>;
declare class ChoiceSelectMenuBuilder<ChoiceType> {
    /**
     * Manages a select menu interface to select elements in an array.
     * @param choices - The array of choices to represent.
     * @param selected - A callback function that defines what values are chosen.
     */
    constructor(choices: ChoiceType[], selected?: SelectCallback<ChoiceType>);
    /**
     * The maximum amount of select menu options that
     * discord accepts. As of Mar 6 2024, it is 25.
     */
    static readonly OPTIONS_LIMIT = 25;
    /**
     * Contains all data related to this builder instance.
     */
    data: PageSelectComponent<ChoiceType>;
    /**
     * The reference to the array this builder represents.
     */
    options: ChoiceType[];
    /**
     * Sets the custom ID of this builder.
     * @param {string} customId - The custom ID to set
     */
    setCustomId(customId: string): this;
    /**
     * Set the minimum amount of choices of this builder. Defaults to
     * 0 for every new instance.
     * @param amount - The minimum amount of choices to select in this menu.
     */
    setMinChoices(amount: number): this;
    /**
     * Set the maximum amount of choices of this select menu.
     * @param amount - The maximum amount of choices to select in this menu.
     */
    setMaxChoices(amount: number): this;
    /**
     * Sets the callback function to transform an array element into a readable
     * label string. Discord's label character limit applies.
     * @param labelFn - The callback function to transform the element.
     * The returned string must be below Discord's label character limit.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     */
    setLabel(labelFn: PageSelectComponent<ChoiceType>['labelFn']): this;
    /**
     * Sets the callback function to transform an array element into a readable
     * description string. Discord's description character limit applies.
     * Will not create a description by default.
     * @param descriptionFn - The callback function to transform the element.
     * The returned string must be below Discord's description character limit.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     */
    setDescription(descriptionFn: NonNullable<PageSelectComponent<ChoiceType>['descriptionFn']> | null): this;
    /**
     * Set the button styles for the navigator buttons.
     * @param style - The style to apply on the navigator buttons.
     */
    setNavigatorStyle(style: Exclude<ButtonStyle, ButtonStyle.Link>): this;
    /**
     * Set the button styles for the center button displaying the current page.
     * @param style - The style to apply on the center button displaying the current page.
     */
    setPageLabelStyle(style: Exclude<ButtonStyle, ButtonStyle.Link>): this;
    /**
     * Set the placeholder of this builder's select menu.
     * @param placeholder - A static string to set as placeholder, or
     * a callback function to dynamically set the placeholder. Passes
     * the minimum and maximum choices of the current select menu.
     *
     * The placeholder must be below Discord's placeholder character limit.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-menu-structure
     */
    setPlaceholder(placeholder: string | ((minChoices: number, maxChoices: number) => string) | null): this;
    /**
     * Set the selected values of this builder.
     * @param selected - A callback function or an object / array of objects to use.
     * - If the passed type is a function, that function will be called to set the values.
     * - If the passed type is an array, it will default to `Array#includes()`.
     * - Otherwise, `Object.is()` equality is used.
     */
    setValues(selected: SelectCallback<ChoiceType>): this;
    /**
     * Add the selected values of this builder.
     * @param selected - A callback function or an object / array of objects to use.
     * - If the passed type is a function, that function will be called to set the values.
     * - If the passed type is an array, it will default to `Array#includes()`.
     * - Otherwise, `Object.is()` equality is used.
     */
    addValues(selected: SelectCallback<ChoiceType>): this;
    /**
     * Filters the selected values based on the provided function.
     * @param valueFn - The callback function to use as filter. If this function
     * returns false, the selected value is removed from this menu.
     */
    filterValues(valueFn: (value: ChoiceType, index: number) => boolean): this;
    /**
     * Clears all selected values from this menu.
     */
    clearValues(): this;
    /**
     * Removes the last selected value and returns it.
     * If there are no selected values, it will return undefined.
     *
     * This value may be undefined even if `minChoices > 0`.
     */
    popValue(): ChoiceType | undefined;
    /**
     * Returns a shallow copy of options that are visible on the current page.
     * If no page is specified, it will return the current page.
     * @param page - The page to fetch options from.
     */
    optionsOnPage(page?: number): ChoiceType[];
    /**
     * Determines the selected values on the current page. If no
     * parameter is provided, it will take the current page.
     *
     * Note that if `minChoices > 0`, selected values will always exist on the page.
     * @param page - The page to fetch the selected options from.
     */
    selectedOnPage(onPage?: number): ChoiceType[];
    /**
     * The selected values of this select menu.
     * Returns a shallow copy of the provided choices.
     * If you only need the first property, consider using
     * {@link ChoiceSelectMenuBuilder#firstValue}
     *
     * This array may be empty even if `minChoices > 0`.
     */
    get values(): ChoiceType[];
    /**
     * The first selected value of this select menu.
     *
     * This value may be undefined even if `minChoices > 0`.
     */
    get firstValue(): ChoiceType | undefined;
    /**
     * Provides default function behaviour for non-functions passed to
     * methods.
     * ```
     * const selected = [1, 2, 3];
     * selectMenu.narrowSelectCallback(selected) // this is now (v) => selected.includes(v)
     * ```
     * @param selected - The provided value or function to narrow down into a select function.
     * @returns - A function callback that can be used in `Array.prototype.filter()` and the like.
     */
    private narrowSelectCallback;
    /**
     * Changes the paginated menu to the first page. If the maximum
     * amount of choices has been reached, it only skips to pages with
     * selections on it.
     */
    toFirstPage(): this;
    /**
     * Changes the paginated menu to the previous page. If the maximum
     * amount of choices has been reached, only skips to pages with
     * selections on it.
     */
    toPreviousPage(): this;
    /**
     * Changes the paginated menu to the next page. If the maximum
     * amount of choices has been reached, only skips to pages with
     * selections on it.
     */
    toNextPage(): this;
    /**
     * Changes the paginated menu to the last page. If the maximum
     * amount of choices has been reached, it only skips to pages with
     * selections on it.
     */
    toLastPage(): this;
    /**
     * Creates the action row based on this builder.
     * If the `choices` array is empty, no select menu will be generated.
     * If the array exceeds discord's limit for select menus,
     * a second row of page buttons will be passed.
     */
    toActionRow(): PageSelectMenuActionRow;
    /**
     * Determines whether or not the interaction belongs to this builder.
     * If the interaction belongs to this builder, it handles the received
     * interaction response.
     * @param interaction - The component interaction response to check
     */
    isInteraction(interaction: Interaction): boolean;
    /**
     * Determines whether or not the interaction belongs to this builder.
     * @param interaction - The interaction to narrow
     */
    private hasComponent;
    /**
     * Parses an array of values (from a select menu)
     * into the selected values. This assumes that the StringSelectMenuInteraction
     * belongs to this ChoiceSelectMenuBuilder. If that assumption is not met or there
     * is some issue with the custom IDs, they will be filtered out.
     * @param values - The values to transform into selected values.
     */
    private updateSelectedFromValues;
    /**
     * Transforms the provided option into a usable API Select Menu Option.
     * @param row - The row to transform, including its index and element.
     */
    private toAPISelectMenuOption;
    /**
     * Generates the page buttons for the currently selected page.
     * Disables buttons dependent on what page the user is on and
     * how many choices are remaining.
     */
    private get navigatorButtons();
}

export { ChoiceSelectMenuBuilder };
