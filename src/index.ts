import {
    APISelectMenuOption,
    APIStringSelectComponent,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Collection,
    MessageComponentInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from 'discord.js';

/**
 * Represents a callback function that is passed to Array prototype methods such as
 * `.map()`, `.filter()` and `.forEach()` .
 */
type ArrayCallback<T, ReturnValue> = (
    element: T,
    index: number,
    array: T[]
) => ReturnValue;

type PageSelectComponent<ChoiceType> = {
    /**
     * The custom ID that this select menu uses.
     */
    customId?: string;
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
    /**
     * A collection of selected values and the index they are found at.
     * The key is used to ensure pagination is applied correctly
     * The values represent the selected items of the array.
     */
    selected: Collection<number, ChoiceType>;
    /**
     * Whether or not the selected items are carried throughout each page.
     * This is an edge case where `minChoices === maxChoices`, which would
     * otherwise prevent changing pages and values.
     * @internal
     */
    carrySelected: boolean;
    /**
     * The placeholder to display on the select menu.
     */
    placeholder?: string | ((minChoices: number, maxChoices: number) => string);
    /**
     * The callback function to transform an array element into a readable
     * label string. Note that discord's character limit on labels apply.
     * @param option An element from the `options` array.
     * @param index The element's index in the `options` array.
     * @returns A string that must be below Discord's character limit for
     * select menu option labels.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     */
    labelFn: (option: ChoiceType, index: number) => string;
    /**
     * The callback function to transform an array element into a readable
     * description string. Note that discord's character limit on descriptions apply.
     * Will not create a description by default.
     * @param option An element from the `options` array.
     * @param index The element's index in the `options` array.
     * @returns A string that must be below Discord's character limit for
     * select menu option descriptions.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     */
    descriptionFn?: (option: ChoiceType, index: number) => string;
    /**
     * Stores the current page data of this builder.
     */
    page: {
        /**
         * The 0-indexed page the builder is currently on.
         * This is always in the range `0 <= current <= max`
         */
        current: number;
        /**
         * The maximum 0-indexed page the builder can reach.
         * This property is derived from the page's length
         */
        max: number;
        /**
         * The length that a single select menu page can have.
         * This property defaults to Discord's limit, although
         * it may be lower depending on the `carrySelected` edge case.
         */
        length: number;
    };
    /**
     * Stores the current button styles of this builder.
     */
    buttonStyles: {
        /**
         * The button style for the nagivator buttons, which include
         * ⏮️,◀️,▶️, and ⏭️.
         * Note that navigator buttons only show up if there are more
         * options than the defined page length of this builder.
         */
        navigator: Exclude<ButtonStyle, ButtonStyle.Link>;
        /**
         * The button style for the center button displaying the available
         * pages.
         * Note that navigator buttons only show up if there are more
         * options than the defined page length of this builder.
         */
        middle: Exclude<ButtonStyle, ButtonStyle.Link>;
    };
};

/**
 * The three types of Tuples that are generated
 * by the UserChoiceComponent. It either includes
 * only the select menu, or it also includes
 * the page buttons. If there are no elements
 * present, it will return empty.
 */
type PageSelectMenuActionRow =
    | []
    | [menu: ActionRowBuilder<StringSelectMenuBuilder>]
    | [
          pageButtons: ActionRowBuilder<ButtonBuilder>,
          menu: ActionRowBuilder<StringSelectMenuBuilder>
      ];

/**
 * Represents the three main types of setting values as selected.
 * If the passed type is not a function, it will resort to
 * Array.prototype.includes() and Object.is() to compare the passed
 * value instead.
 */
type SelectCallback<ChoiceType> =
    | ChoiceType
    | ChoiceType[]
    | ArrayCallback<ChoiceType, boolean>;

/**
 * Manages a select menu interface to select elements in an array.
 */
export class ChoiceSelectMenuBuilder<ChoiceType> {
    public constructor(
        choices: ChoiceType[],
        selected?: SelectCallback<ChoiceType>
    ) {
        const selectedFn = this.narrowSelectCallback(selected);
        this.data = {
            selected: new Collection(choices.filter(selectedFn).entries()),
            labelFn: (value) => `${value}`,
            minChoices: 0,
            carrySelected: false,
            page: {
                current: 0,
                length: ChoiceSelectMenuBuilder.OPTIONS_LIMIT,
                max: Math.floor(
                    choices.length / ChoiceSelectMenuBuilder.OPTIONS_LIMIT
                )
            },
            buttonStyles: {
                navigator: ButtonStyle.Primary,
                middle: ButtonStyle.Danger
            }
        };
        this.options = choices;
    }

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
     * A reference to the array this builder represents.
     */
    options: ChoiceType[];

    /**
     * Sets the custom ID of this builder.
     * @param {string} customId The custom ID to set
     * @returns {ChoiceSelectMenuBuilder}
     */
    public setCustomId(customId: string): this {
        this.data.customId = customId;
        return this;
    }

    /**
     * Set the minimum amount of choices of this builder. Defaults to
     * 0 for every new instance.
     * @param {number} amount The minimum amount of choices to select in this menu.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public setMinChoices(amount: number): this {
        if (amount > ChoiceSelectMenuBuilder.OPTIONS_LIMIT)
            throw new Error("MinChoices may not be above Discord's limit");
        if (amount < 0) throw new Error('MinChoices must not be negative.');
        if (amount > this.options.length)
            throw new Error(
                'MinChoices must not exceed the amount of available options.'
            );

        this.data.minChoices = amount;
        this.updatePageProps();
        return this;
    }

    /**
     * Set the maximum amount of choices of this select menu.
     * @param {number} amount The maximum amount of choices to select in this menu.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public setMaxChoices(amount: number): this {
        if (amount <= 0) throw new Error('MaxChoices may not be 0 or lower.');
        if (amount > this.options.length)
            throw new Error(
                'MaxChoices must not exceed the amount of available options.'
            );
        this.data.maxChoices = amount;
        this.updatePageProps();
        return this;
    }

    /**
     * Sets the callback function to transform an array element into a readable
     * label string. Note that discord's character limit on labels apply.
     * @param {visualizeCallback} labelFn - The callback function to transform the element.
     * @returns A string that must be below Discord's character limit for
     * select menu option labels.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     * @returns {ChoiceSelectMenuBuilder}
     */
    public setLabel(labelFn: PageSelectComponent<ChoiceType>['labelFn']): this {
        this.data.labelFn = labelFn;
        return this;
    }

    /**
     * Sets the callback function to transform an array element into a readable
     * description string. Note that discord's character limit on descriptions apply.
     * Will not create a description by default.
     * @param {visualizeCallback} descriptionFn - The callback function to transform the element.
     * @returns A string that must be below Discord's character limit for
     * select menu option descriptions.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure}
     */
    public setDescription(
        descriptionFn: NonNullable<
            PageSelectComponent<ChoiceType>['descriptionFn']
        > | null
    ): this {
        if (descriptionFn === null) {
            delete this.data.descriptionFn;
            return this;
        }
        this.data.descriptionFn = descriptionFn;
        return this;
    }

    /**
     * Set the button styles for the navigator buttons.
     * @param navigators The desired style for the navigator buttons.
     * @param centerButton The desired style for the center button displaying the current page.
     */
    public setButtonStyles(
        navigators: Exclude<ButtonStyle, ButtonStyle.Link>,
        centerButton: Exclude<ButtonStyle, ButtonStyle.Link>
    ): this {
        this.data.buttonStyles.navigator = navigators;
        this.data.buttonStyles.middle = centerButton ?? ButtonStyle.Danger;
        return this;
    }

    /**
     * Set the placeholder of this builder's select menu.
     * @param placeholder A static string to set as placeholder
     *
     * Note that the placeholder must be below discord's placeholder character limit.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-menu-structure}
     */
    public setPlaceholder(placeholder: string | null): this;
    /**
     * Set the placeholder of this builder's select menu.
     * @param placeholder A callback function to dynamically set the placeholder. Passes
     * the minimum and maximum choices of the current select menu.
     *
     * Note that the placeholder must be below discord's placeholder character limit.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-menu-structure
     */
    public setPlaceholder(
        placeholder: ((minChoices: number, maxChoices: number) => string) | null
    ): this;
    public setPlaceholder(
        placeholder:
            | string
            | ((minChoices: number, maxChoices: number) => string)
            | null
    ): this {
        if (placeholder === null) {
            delete this.data.placeholder;
            return this;
        }
        this.data.placeholder = placeholder;
        return this;
    }

    /**
     * Set the selected values of this builder.
     * @param selected The value, array of values, or callback function to
     * determine the selected elements. Note that an array of values defaults to
     * `Array.prototype.includes()`, which may fail for non-primitive types.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public setValues(selected: SelectCallback<ChoiceType>): this {
        this.data.selected.clear();
        this.addValues(selected);
        return this;
    }

    /**
     * Add the selected values of this builder.
     * @param selected The value, array of values, or callback function to
     * determine the additional selected elements. Note that an array of values defaults to
     * `Array.prototype.includes()`, which may fail for non-primitive types.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public addValues(selected: SelectCallback<ChoiceType>): this {
        const selectFn = this.narrowSelectCallback(selected);
        const collection = this.data.selected;
        this.options.forEach((option, index, arr) => {
            if (selectFn(option, index, arr)) {
                collection.set(index, option);
            }
        });

        const maxChoices = this.data.maxChoices ?? this.options.length;

        if (maxChoices < this.data.selected.size)
            throw new Error('MaxChoices in this menu ');

        this.updatePageProps();
        return this;
    }

    /**
     * Filters the selected values based on the provided function.
     * @param valueFn The callback function to use as filter. If this function
     * resolves to false, the selected value is removed from this menu.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public filterValues(
        valueFn: (value: ChoiceType, index: number) => boolean
    ): this {
        this.data.selected = this.data.selected.filter(valueFn);
        this.updatePageProps();
        return this;
    }

    /**
     * Clears all selected values from this menu.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public clearValues(): this {
        this.data.selected.clear();
        this.updatePageProps();
        return this;
    }

    /**
     * Removes the last selected value and returns it.
     * If there are no selected values, it will return undefined.
     *
     */
    public popValue(): ChoiceType | undefined {
        const lastKey = this.data.selected.lastKey();
        if (typeof lastKey === 'undefined') return undefined;

        const value = this.data.selected.get(lastKey);
        this.data.selected.delete(lastKey);
        this.updatePageProps();
        return value;
    }

    /**
     * Returns a shallow copy of options that are visible on the current page.
     * If no page is specified, it will return the current page.
     * @param {number|undefined} page The page to fetch options from.
     */
    public optionsOnPage(page: number = this.data.page.current): ChoiceType[] {
        if (this.options.length <= this.data.page.length) {
            return this.options;
        }
        const start = page * this.data.page.length;
        const end = start + this.data.page.length;
        if (this.data.carrySelected) {
            return [...this.values, ...this.options.slice(start, end)];
        }
        return this.options.slice(start, end);
    }

    /**
     * Determines the selected values on the current page. If no
     * parameter is provided, it will take the current page.
     *
     * Note that if you have the same amount of minChoices as maxChoices,
     * the selected options will ALWAYS be present on the page.
     * @param page The page to review
     */
    public selectedOnPage(onPage = this.data.page.current): ChoiceType[] {
        if (this.data.carrySelected) return [...this.data.selected.values()];
        const { selected, page } = this.data;

        const start = onPage * page.length;
        const end = start + page.length;

        return this.options
            .slice(start, end)
            .filter((_, i) => selected.has(start + i));
    }

    /**
     * The selected values of this select menu.
     * Returns a shallow copy of the provided choices.
     * If you only need the first property, consider using
     * {@link ChoiceSelectMenuBuilder#firstValue}
     */
    public get values(): ChoiceType[] {
        return [...this.data.selected.values()];
    }

    /**
     * The first selected value of this select menu.
     */
    public get firstValue(): ChoiceType | undefined {
        return this.data.selected.first();
    }

    /**
     * Provides default function behaviour for non-functions passed to
     * methods.
     * ```
     * const selected = [1, 2, 3];
     * selectMenu.narrowSelectCallback(selected) // this is now (v) => selected.includes(v)
     * ```
     * @param selected The provided value or function to narrow down into a select function.
     * @returns A function callback that can be used in `Array.prototype.filter()` and the like.
     */
    private narrowSelectCallback(
        selected: SelectCallback<ChoiceType> | undefined
    ): ArrayCallback<ChoiceType, boolean> {
        if (typeof selected === 'undefined') {
            return () => false;
        }
        if (Array.isArray(selected)) {
            return (v) => selected.includes(v);
        }
        if (typeof selected !== 'function') {
            return (v) => Object.is(v, selected);
        }
        return selected as ArrayCallback<ChoiceType, boolean>;
    }

    /**
     * Changes the paginated menu to the first page. If the maximum
     * amount of choices has been reached, it only skips to pages with
     * selections on it.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public toFirstPage(): this {
        const { page, selected } = this.data;
        const { maxChoices = this.options.length } = this.data;
        if (this.options.length <= page.length) return this;

        if (selected.size < maxChoices || this.data.carrySelected) {
            page.current = 0;
            return this;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go back the first
        // page that has selections on it.

        // maxChoices is always > 0, so selected.size cannot be 0 from if guard above
        page.current = Math.floor(selected.firstKey()! / page.length);
        return this;
    }

    /**
     * Changes the paginated menu to the previous page. If the maximum
     * amount of choices has been reached, only skips to pages with
     * selections on it.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public toPreviousPage(): this {
        const { page, selected } = this.data;
        const { maxChoices = this.options.length } = this.data;
        if (this.options.length <= page.length) return this;

        if (selected.size < maxChoices || this.data.carrySelected) {
            page.current = Math.max(page.current - 1, 0);
            return this;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go back to the closest
        // page that has selections on it.
        const currentPageStart = page.current * page.length;
        // maxChoices is always > 0, so selected.size cannot be 0 from if guard above
        const maxPreviousIndex = selected
            .filter((_, n) => n < currentPageStart)
            .lastKey();
        if (typeof maxPreviousIndex === 'undefined') return this;
        page.current = Math.floor(maxPreviousIndex / page.length);

        return this;
    }

    /**
     * Changes the paginated menu to the next page. If the maximum
     * amount of choices has been reached, only skips to pages with
     * selections on it.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public toNextPage(): this {
        const { page, selected } = this.data;
        const { maxChoices = this.options.length } = this.data;

        if (this.options.length <= page.length) return this;

        if (selected.size < maxChoices || this.data.carrySelected) {
            page.current = Math.min(page.current + 1, page.max);
            return this;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go forward to the closest
        // page that has selections on it.
        const currentPageEnd = page.current * page.length + page.length;
        const minNextIndex = selected
            .filter((_, n) => n >= currentPageEnd)
            .lastKey();
        if (typeof minNextIndex === 'undefined') return this;

        page.current = Math.floor(minNextIndex / page.length);
        return this;
    }

    /**
     * Changes the paginated menu to the last page. If the maximum
     * amount of choices has been reached, it only skips to pages with
     * selections on it.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public toLastPage(): this {
        const { page, selected } = this.data;
        const { maxChoices = this.options.length } = this.data;
        if (this.options.length <= page.length) return this;

        if (selected.size < maxChoices || this.data.carrySelected) {
            page.current = page.max;
            return this;
        }

        // we want to avoid exceeding our maxChoices. Therefore, if we have
        // already a full amount of choices, we only go forward to the last
        // page that has selections on it.

        // maxChoices is always > 0, so selected.size cannot be 0 from if guard above
        page.current = Math.floor(selected.lastKey()! / page.length);
        return this;
    }

    /**
     * Creates the action row based on this builder.
     * If the passed `options` array is empty, no select menu will be generated.
     * If the array exceeds discord's limit for select menus,
     * a second row of page buttons will be passed.
     */
    public toActionRow(): PageSelectMenuActionRow {
        // ----------------------------------
        // Below Select Menu Minimum
        if (this.options.length === 0) return [];
        if (typeof this.data.customId === 'undefined') {
            throw new Error(
                'ChoiceSelectMenuBuilder.customId: expected a string primitive'
            );
        }

        const {
            customId,
            minChoices,
            placeholder,
            selected,
            page,
            carrySelected,
            maxChoices = this.options.length
        } = this.data;

        const isPaginated = this.options.length > page.length;

        const currentMin = isPaginated ? 0 : minChoices;
        const currentMax = Math.min(
            // - maxChoices could be = this.options.length, so
            //      cap at this.optionsAtPage().length
            // - if there's only one page, then
            //      this.selected.length === this.selectedOnPage().length,
            //   so they cancel each other out. This is only for pagination
            //   purposes.
            maxChoices - selected.size + this.selectedOnPage().length,
            this.optionsOnPage().length
        );

        const selectMenuData = {
            custom_id: customId,
            min_values: currentMin,
            max_values: currentMax
        } as Partial<APIStringSelectComponent>;

        switch (typeof placeholder) {
            case 'function':
                selectMenuData.placeholder = placeholder(
                    currentMin,
                    currentMax
                );
                break;
            case 'string':
                selectMenuData.placeholder = placeholder;
                break;
            default:
                break;
        }

        const selectMenu = new StringSelectMenuBuilder(selectMenuData);

        // ----------------------------------
        // No Pagination
        if (!isPaginated) {
            const apiOptions = this.visualizeOptions();
            selectMenu.addOptions(apiOptions);

            return [
                new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [selectMenu]
                })
            ];
        }

        // ----------------------------------
        // Pagination
        const start = page.current * page.length;
        const end = start + page.length;
        const rawOptions = this.options.slice(start, end);

        const selectedOptions = carrySelected
            ? [...selected.values()]
            : this.options
                  .slice(start, end)
                  .filter((_, i) => selected.has(i + start));

        selectMenu.addOptions([
            ...selectedOptions.map(this.toAPISelectMenuOption, this),
            ...rawOptions.map(this.toAPISelectMenuOption, this)
        ]);

        return [
            this.navigatorButtons,
            new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [selectMenu]
            })
        ];
    }

    /**
     * Determines whether or not the interaction belongs to this builder.
     * If the interaction belongs to this builder, it handles the received
     * interaction response.
     * @param interaction The component interaction response to check
     */
    public isInteraction(interaction: MessageComponentInteraction): boolean {
        if (!this.hasComponent(interaction)) return false;

        if (interaction.isButton()) {
            const getPageButtonId = interaction.customId.split('--')?.pop();
            switch (getPageButtonId) {
                case 'firstPage':
                    this.toFirstPage();
                    break;
                case 'prevPage':
                    this.toPreviousPage();
                    break;
                case 'nextPage':
                    this.toNextPage();
                    break;
                case 'lastPage':
                    this.toLastPage();
                    break;
                default:
                    break;
            }
            return true;
        }

        // remove keys on current page
        const start = this.data.page.current * this.data.page.length;
        const end = start + this.data.page.length;
        this.filterValues((_, i) => i >= end || i < start);

        const idsOnPage = this.getIndecesFromValues(interaction.values);
        for (const i of idsOnPage) {
            const selectedOption = this.options.at(i);
            if (typeof selectedOption === 'undefined') continue;
            this.data.selected.set(i, selectedOption);
        }
        return true;
    }

    /**
     * Determines whether or not the interaction belongs to this builder.
     * @param interaction The interaction to narrow
     * @returns {boolean}
     */
    private hasComponent(
        interaction: MessageComponentInteraction
    ): interaction is ButtonInteraction | StringSelectMenuInteraction {
        return (
            typeof this.data.customId !== 'undefined' &&
            interaction.customId.startsWith(this.data.customId)
        );
    }

    /**
     * Transform an array of values (from a select menu)
     * into the ending digits. This assumes that the StringSelectMenuInteraction
     * belongs to this ChoiceSelectMenuBuilder. If that assumption is not met or there
     * is some issue with the custom IDs, they will be filtered out.
     * @param values The values to transform into digits.
     */
    private getIndecesFromValues(values: string[]): number[] {
        const isNumeric = (n: number) => !isNaN(n) && isFinite(n);

        return values
            .map((v) => Number(v.split('--')?.pop()))
            .filter(isNumeric);
    }

    /**
     * Update the carrySelected, pageLength and maxPage properties
     * to the new values.
     */
    private updatePageProps(): void {
        this.data.carrySelected = this.data.minChoices === this.data.maxChoices;

        this.data.page.length = ChoiceSelectMenuBuilder.OPTIONS_LIMIT;
        if (this.data.carrySelected) {
            this.data.page.length -= this.data.selected.size;
        }

        this.data.page.max = Math.floor(
            this.options.length / this.data.page.length
        );
    }

    /**
     * Transforms the provided option into a usable API Select Menu Option.
     * @param value The value to transform.
     * @param i The index of the array to transform at.
     */
    private toAPISelectMenuOption(
        value: ChoiceType,
        i: number
    ): APISelectMenuOption {
        const offset = this.data.page.current * this.data.page.length;
        return {
            label: this.data.labelFn(value, i),
            description: this.data.descriptionFn?.(value, i),
            default: this.data.selected.has(i + offset),
            value: `${this.data.customId}--${i + offset}`
        } as APISelectMenuOption;
    }
    /**
     * Transforms the options into a usable API Select Menu Option.
     * @param start The start of the slice to map. Leave undefined to
     * directly access the options array.
     * @param end The end of the slice to map. Defaults to the end
     * of the options array.
     */
    private visualizeOptions(
        start?: number,
        end?: number
    ): APISelectMenuOption[] {
        if (typeof start === 'undefined') {
            return this.options.map(this.toAPISelectMenuOption, this);
        }

        return this.options
            .slice(start, end)
            .map(this.toAPISelectMenuOption, this);
    }

    /**
     * Generates the page buttons for the currently selected page.
     * Disables buttons dependent on what page the user is on and
     * how many choices are remaining.
     */
    private get navigatorButtons(): ActionRowBuilder<ButtonBuilder> {
        //
        // Basic Button Template
        //
        const {
            buttonStyles,
            customId,
            selected,
            page,
            maxChoices = this.options.length
        } = this.data;

        // ----------------------------------
        // Page buttons logic
        let isAtStart = page.current === 0;
        let isAtEnd = page.current === page.max;

        if (selected.size >= maxChoices) {
            // EDGE CASE SCENARIO
            // There are 3 pages and 5 max choices:
            // Page 1 - 0
            // Page 2 - 3 - Current
            // Page 3 - 2
            //
            // you must not select page 1, as you cannot have a maxchoice set of 0.
            // therefore, we check what pages have selections on them.
            const indexStart = page.current * page.length;
            const indexEnd = indexStart + page.length;
            isAtStart ||= selected.every((_, n) => n >= indexStart);
            isAtEnd ||= selected.every((_, n) => n <= indexEnd);
        }
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('⏮️')
                .setStyle(buttonStyles.navigator)
                .setDisabled(isAtStart)
                .setCustomId(`${customId}--firstPage`),
            new ButtonBuilder()
                .setLabel('◀️')
                .setStyle(buttonStyles.navigator)
                .setDisabled(isAtStart)
                .setCustomId(`${customId}--prevPage`),
            // The center button displays what page you're currently on.
            new ButtonBuilder()
                .setLabel(`Page ${page.current + 1}/${page.max + 1}`)
                .setStyle(buttonStyles.middle)
                .setDisabled(true)
                .setCustomId('btn-never'),
            new ButtonBuilder()
                .setLabel('▶️')
                .setStyle(buttonStyles.navigator)
                .setDisabled(isAtEnd)
                .setCustomId(`${customId}--nextPage`),
            new ButtonBuilder()
                .setLabel('⏭️')
                .setStyle(buttonStyles.navigator)
                .setDisabled(isAtEnd)
                .setCustomId(`${customId}--lastPage`)
        );
    }
}

/**
 * @callback visualizeCallback
 * @template ChoiceType
 * @param {ChoiceType} option An element from the `options` array.
 * @param {number} index The element's index in the `options` array.
 */
