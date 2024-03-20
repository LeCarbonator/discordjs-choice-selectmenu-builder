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
import { PageManager } from './PageManager';

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
        const collection = new Collection<number, ChoiceType>();
        this.options = choices;
        this.data = {
            selected: collection,
            labelFn: (value) => `${value}`,
            pages: new PageManager(choices, collection, 0),
            navigatorStyle: ButtonStyle.Primary,
            pageLabelStyle: ButtonStyle.Danger
        };

        if (typeof selected !== 'undefined') {
            this.addValues(selected);
        }
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
     * @param {string} customId - The custom ID to set
     */
    public setCustomId(customId: string): this {
        this.data.customId = customId;
        return this;
    }

    /**
     * Set the minimum amount of choices of this builder. Defaults to
     * 0 for every new instance.
     * @param {number} amount - The minimum amount of choices to select in this menu.
     */
    public setMinChoices(amount: number): this {
        if (amount > ChoiceSelectMenuBuilder.OPTIONS_LIMIT)
            throw new Error("MinChoices may not be above Discord's limit");
        if (amount < 0) throw new Error('MinChoices must not be negative.');
        if (amount > this.options.length)
            throw new Error(
                'MinChoices must not exceed the amount of available options.'
            );

        this.data.pages.minChoices = amount;
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
        this.data.pages.maxChoices = amount;
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
     * @param style The desired style for the navigator buttons.
     */
    public setNavigatorStyle(
        style: Exclude<ButtonStyle, ButtonStyle.Link>
    ): this {
        this.data.navigatorStyle = style;
        return this;
    }

    /**
     * Set the button styles for the center button displaying the current page.
     * @param style The desired style for the center button displaying the current page.
     */
    public setPageLabelStyle(
        style: Exclude<ButtonStyle, ButtonStyle.Link>
    ): this {
        this.data.pageLabelStyle = style;
        return this;
    }

    /**
     * Set the placeholder of this builder's select menu.
     * @param placeholder A static string to set as placeholder, or
     * a callback function to dynamically set the placeholder. Passes
     * the minimum and maximum choices of the current select menu.
     *
     * Note that the placeholder must be below discord's placeholder character limit.
     * @see {@link https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-menu-structure
     */
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

        const maxChoices = this.data.pages.maxChoices ?? this.options.length;

        if (maxChoices < this.data.selected.size)
            throw new Error(
                'Selected values exceed the configured maximum amount.'
            );
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
        const filtered = this.data.selected.filter(valueFn);
        this.data.selected = filtered;
        this.data.pages.selected = filtered;
        return this;
    }

    /**
     * Clears all selected values from this menu.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public clearValues(): this {
        this.data.selected.clear();
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
        return value;
    }

    /**
     * Returns a shallow copy of options that are visible on the current page.
     * If no page is specified, it will return the current page.
     * @param {number|undefined} page The page to fetch options from.
     */
    public optionsOnPage(page: number = this.data.pages.current): ChoiceType[] {
        return this.data.pages.getPage(page).map((v) => v[1]);
    }

    /**
     * Determines the selected values on the current page. If no
     * parameter is provided, it will take the current page.
     *
     * Note that if you have the same amount of minChoices as maxChoices,
     * the selected options will ALWAYS be present on the page.
     * @param page The page to review
     */
    public selectedOnPage(onPage = this.data.pages.current): ChoiceType[] {
        const page = this.data.pages.getPage(onPage);
        return page
            .filter((v) => this.data.selected.has(v[0]))
            .map((v) => v[1]);
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
        this.data.pages.first();
        return this;
    }

    /**
     * Changes the paginated menu to the previous page. If the maximum
     * amount of choices has been reached, only skips to pages with
     * selections on it.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public toPreviousPage(): this {
        this.data.pages.previous();
        return this;
    }

    /**
     * Changes the paginated menu to the next page. If the maximum
     * amount of choices has been reached, only skips to pages with
     * selections on it.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public toNextPage(): this {
        this.data.pages.next();
        return this;
    }

    /**
     * Changes the paginated menu to the last page. If the maximum
     * amount of choices has been reached, it only skips to pages with
     * selections on it.
     * @returns {ChoiceSelectMenuBuilder}
     */
    public toLastPage(): this {
        this.data.pages.last();
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

        const { customId, placeholder, selected, pages } = this.data;

        const currentMax = Math.min(
            // - maxChoices could be = this.options.length, so
            //      cap at this.optionsAtPage().length
            // - if there's only one page, then
            //      this.selected.length === this.selectedOnPage().length,
            //   so they cancel each other out. This is only for pagination
            //   purposes.
            (pages.maxChoices ?? this.options.length) -
                selected.size +
                this.selectedOnPage().length,
            this.optionsOnPage().length
        );

        const selectMenuData = {
            custom_id: customId,
            min_values: pages.minChoices,
            max_values: currentMax
        } as Partial<APIStringSelectComponent>;

        switch (typeof placeholder) {
            case 'function':
                selectMenuData.placeholder = placeholder(
                    pages.minChoices,
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

        selectMenu.addOptions(
            pages.getPage().map(this.toAPISelectMenuOption, this)
        );

        if (pages.max === 0) {
            return [
                new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [selectMenu]
                })
            ];
        }

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

        this.updateSelectedFromValues(interaction.values);
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
     * Parses an array of values (from a select menu)
     * into the selected values. This assumes that the StringSelectMenuInteraction
     * belongs to this ChoiceSelectMenuBuilder. If that assumption is not met or there
     * is some issue with the custom IDs, they will be filtered out.
     * @param values The values to transform into selected values.
     */
    private updateSelectedFromValues(values: string[]): void {
        const { pages } = this.data;
        if (!pages.carrySelected) {
            // remove keys on current page
            const currentPage = pages.getPage().map((v) => v[0]);
            const start = Math.min(...currentPage);
            const end = Math.max(...currentPage);
            this.filterValues((_, i) => i >= end || i < start);
        } else {
            this.data.selected.clear();
        }

        const idsOnPage = values
            .map((v) => Number(v.split('--')?.pop()))
            .filter((n) => !isNaN(n) && isFinite(n));

        for (const i of idsOnPage) {
            const selectedOption = this.options.at(i);
            if (typeof selectedOption === 'undefined') continue;
            this.data.selected.set(i, selectedOption);
        }
    }

    /**
     * Transforms the provided option into a usable API Select Menu Option.
     * @param i The index of the array to transform at.
     * @param value The value to transform.
     */
    private toAPISelectMenuOption(
        row: [index: number, element: ChoiceType]
    ): APISelectMenuOption {
        const [i, o] = row;
        return {
            label: this.data.labelFn(o, i),
            description: this.data.descriptionFn?.(o, i),
            default: this.data.selected.has(i),
            value: `${this.data.customId}--${i}`
        } as APISelectMenuOption;
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
        const { customId, selected, pages, navigatorStyle, pageLabelStyle } =
            this.data;
        const currentPage = pages.getPage().map((v) => v[0]);
        const start = Math.min(...currentPage);
        const end = Math.max(...currentPage);
        const max = pages.max;
        // ----------------------------------
        // Page buttons logic
        let isAtStart = pages.current === 0;
        let isAtEnd = pages.current === max;

        if (
            !pages.carrySelected &&
            selected.size >= (pages.maxChoices ?? this.options.length)
        ) {
            // EDGE CASE SCENARIO
            // There are 3 pages and 5 max choices:
            // Page 1 - 0
            // Page 2 - 3 - Current
            // Page 3 - 2
            //
            // you must not select page 1, as you cannot have a maxchoice set of 0.
            // therefore, we check what pages have selections on them.
            isAtStart ||= selected.every((_, n) => n >= start);
            isAtEnd ||= selected.every((_, n) => n <= end);
        }
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('⏮️')
                .setStyle(navigatorStyle)
                .setDisabled(isAtStart)
                .setCustomId(`${customId}--firstPage`),
            new ButtonBuilder()
                .setLabel('◀️')
                .setStyle(navigatorStyle)
                .setDisabled(isAtStart)
                .setCustomId(`${customId}--prevPage`),
            // The center button displays what page you're currently on.
            new ButtonBuilder()
                .setLabel(`Page ${pages.current + 1}/${max + 1}`)
                .setStyle(pageLabelStyle)
                .setDisabled(true)
                .setCustomId('btn-never'),
            new ButtonBuilder()
                .setLabel('▶️')
                .setStyle(navigatorStyle)
                .setDisabled(isAtEnd)
                .setCustomId(`${customId}--nextPage`),
            new ButtonBuilder()
                .setLabel('⏭️')
                .setStyle(navigatorStyle)
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
