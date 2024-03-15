"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ChoiceSelectMenuBuilder: () => ChoiceSelectMenuBuilder
});
module.exports = __toCommonJS(src_exports);
var import_discord = require("discord.js");
var ChoiceSelectMenuBuilder = class _ChoiceSelectMenuBuilder {
  static {
    __name(this, "ChoiceSelectMenuBuilder");
  }
  constructor(choices, selected) {
    const selectedFn = this.narrowSelectCallback(selected);
    this.data = {
      selected: new import_discord.Collection(),
      labelFn: (value) => `${value}`,
      minChoices: 0,
      carrySelected: false,
      page: {
        current: 0,
        length: _ChoiceSelectMenuBuilder.OPTIONS_LIMIT,
        max: Math.floor(
          choices.length / _ChoiceSelectMenuBuilder.OPTIONS_LIMIT
        )
      },
      buttonStyles: {
        navigator: import_discord.ButtonStyle.Primary,
        middle: import_discord.ButtonStyle.Danger
      }
    };
    this.options = choices;
    this.addValues(selectedFn);
  }
  /**
   * The maximum amount of select menu options that
   * discord accepts. As of Mar 6 2024, it is 25.
   */
  static OPTIONS_LIMIT = 25;
  /**
   * Contains all data related to this builder instance.
   */
  data;
  /**
   * A reference to the array this builder represents.
   */
  options;
  /**
   * Sets the custom ID of this builder.
   * @param {string} customId The custom ID to set
   * @returns {ChoiceSelectMenuBuilder}
   */
  setCustomId(customId) {
    this.data.customId = customId;
    return this;
  }
  /**
   * Set the minimum amount of choices of this builder. Defaults to
   * 0 for every new instance.
   * @param {number} amount The minimum amount of choices to select in this menu.
   * @returns {ChoiceSelectMenuBuilder}
   */
  setMinChoices(amount) {
    if (amount > _ChoiceSelectMenuBuilder.OPTIONS_LIMIT)
      throw new Error("MinChoices may not be above Discord's limit");
    if (amount < 0)
      throw new Error("MinChoices must not be negative.");
    if (amount > this.options.length)
      throw new Error(
        "MinChoices must not exceed the amount of available options."
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
  setMaxChoices(amount) {
    if (amount <= 0)
      throw new Error("MaxChoices may not be 0 or lower.");
    if (amount > this.options.length)
      throw new Error(
        "MaxChoices must not exceed the amount of available options."
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
  setLabel(labelFn) {
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
  setDescription(descriptionFn) {
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
  setButtonStyles(navigators, centerButton) {
    this.data.buttonStyles.navigator = navigators;
    this.data.buttonStyles.middle = centerButton ?? import_discord.ButtonStyle.Danger;
    return this;
  }
  setPlaceholder(placeholder) {
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
  setValues(selected) {
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
  addValues(selected) {
    const selectFn = this.narrowSelectCallback(selected);
    const collection = this.data.selected;
    this.options.forEach((option, index, arr) => {
      if (selectFn(option, index, arr)) {
        collection.set(index, option);
      }
    });
    const maxChoices = this.data.maxChoices ?? this.options.length;
    if (maxChoices < this.data.selected.size)
      throw new Error("MaxChoices in this menu ");
    this.updatePageProps();
    return this;
  }
  /**
   * Filters the selected values based on the provided function.
   * @param valueFn The callback function to use as filter. If this function
   * resolves to false, the selected value is removed from this menu.
   * @returns {ChoiceSelectMenuBuilder}
   */
  filterValues(valueFn) {
    this.data.selected = this.data.selected.filter(valueFn);
    this.updatePageProps();
    return this;
  }
  /**
   * Clears all selected values from this menu.
   * @returns {ChoiceSelectMenuBuilder}
   */
  clearValues() {
    this.data.selected.clear();
    this.updatePageProps();
    return this;
  }
  /**
   * Removes the last selected value and returns it.
   * If there are no selected values, it will return undefined.
   *
   */
  popValue() {
    const lastKey = this.data.selected.lastKey();
    if (typeof lastKey === "undefined")
      return void 0;
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
  optionsOnPage(page = this.data.page.current) {
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
  selectedOnPage(onPage = this.data.page.current) {
    if (this.data.carrySelected)
      return [...this.data.selected.values()];
    const { selected, page } = this.data;
    const start = onPage * page.length;
    const end = start + page.length;
    return this.options.slice(start, end).filter((_, i) => selected.has(start + i));
  }
  /**
   * The selected values of this select menu.
   * Returns a shallow copy of the provided choices.
   * If you only need the first property, consider using
   * {@link ChoiceSelectMenuBuilder#firstValue}
   */
  get values() {
    return [...this.data.selected.values()];
  }
  /**
   * The first selected value of this select menu.
   */
  get firstValue() {
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
  narrowSelectCallback(selected) {
    if (typeof selected === "undefined") {
      return () => false;
    }
    if (Array.isArray(selected)) {
      return (v) => selected.includes(v);
    }
    if (typeof selected !== "function") {
      return (v) => Object.is(v, selected);
    }
    return selected;
  }
  /**
   * Changes the paginated menu to the first page. If the maximum
   * amount of choices has been reached, it only skips to pages with
   * selections on it.
   * @returns {ChoiceSelectMenuBuilder}
   */
  toFirstPage() {
    const { page, selected } = this.data;
    const { maxChoices = this.options.length } = this.data;
    if (this.options.length <= page.length)
      return this;
    if (selected.size < maxChoices || this.data.carrySelected) {
      page.current = 0;
      return this;
    }
    page.current = Math.floor(selected.firstKey() / page.length);
    return this;
  }
  /**
   * Changes the paginated menu to the previous page. If the maximum
   * amount of choices has been reached, only skips to pages with
   * selections on it.
   * @returns {ChoiceSelectMenuBuilder}
   */
  toPreviousPage() {
    const { page, selected } = this.data;
    const { maxChoices = this.options.length } = this.data;
    if (this.options.length <= page.length)
      return this;
    if (selected.size < maxChoices || this.data.carrySelected) {
      page.current = Math.max(page.current - 1, 0);
      return this;
    }
    const currentPageStart = page.current * page.length;
    const maxPreviousIndex = selected.filter((_, n) => n < currentPageStart).lastKey();
    if (typeof maxPreviousIndex === "undefined")
      return this;
    page.current = Math.floor(maxPreviousIndex / page.length);
    return this;
  }
  /**
   * Changes the paginated menu to the next page. If the maximum
   * amount of choices has been reached, only skips to pages with
   * selections on it.
   * @returns {ChoiceSelectMenuBuilder}
   */
  toNextPage() {
    const { page, selected } = this.data;
    const { maxChoices = this.options.length } = this.data;
    if (this.options.length <= page.length)
      return this;
    if (selected.size < maxChoices || this.data.carrySelected) {
      page.current = Math.min(page.current + 1, page.max);
      return this;
    }
    const currentPageEnd = page.current * page.length + page.length;
    const minNextIndex = selected.filter((_, n) => n >= currentPageEnd).lastKey();
    if (typeof minNextIndex === "undefined")
      return this;
    page.current = Math.floor(minNextIndex / page.length);
    return this;
  }
  /**
   * Changes the paginated menu to the last page. If the maximum
   * amount of choices has been reached, it only skips to pages with
   * selections on it.
   * @returns {ChoiceSelectMenuBuilder}
   */
  toLastPage() {
    const { page, selected } = this.data;
    const { maxChoices = this.options.length } = this.data;
    if (this.options.length <= page.length)
      return this;
    if (selected.size < maxChoices || this.data.carrySelected) {
      page.current = page.max;
      return this;
    }
    page.current = Math.floor(selected.lastKey() / page.length);
    return this;
  }
  /**
   * Creates the action row based on this builder.
   * If the passed `options` array is empty, no select menu will be generated.
   * If the array exceeds discord's limit for select menus,
   * a second row of page buttons will be passed.
   */
  toActionRow() {
    if (this.options.length === 0)
      return [];
    if (typeof this.data.customId === "undefined") {
      throw new Error(
        "ChoiceSelectMenuBuilder.customId: expected a string primitive"
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
    };
    switch (typeof placeholder) {
      case "function":
        selectMenuData.placeholder = placeholder(
          currentMin,
          currentMax
        );
        break;
      case "string":
        selectMenuData.placeholder = placeholder;
        break;
      default:
        break;
    }
    const selectMenu = new import_discord.StringSelectMenuBuilder(selectMenuData);
    if (!isPaginated) {
      const apiOptions = this.visualizeOptions();
      selectMenu.addOptions(apiOptions);
      return [
        new import_discord.ActionRowBuilder({
          components: [selectMenu]
        })
      ];
    }
    const start = page.current * page.length;
    const end = start + page.length;
    if (carrySelected) {
      const rawOptions = this.options.slice(start, end + this.data.selected.size).map((option, i) => [i + start, option]);
      const currentOptions = [
        ...this.data.selected.entries(),
        ...rawOptions.filter((v) => !this.data.selected.has(v[0]))
      ];
      selectMenu.addOptions(
        currentOptions.map((v) => this.toAPISelectMenuOption(...v))
      );
    } else {
      selectMenu.addOptions(
        this.options.slice(start, end).map(
          (option, i) => this.toAPISelectMenuOption(i + start, option)
        )
      );
    }
    return [
      this.navigatorButtons,
      new import_discord.ActionRowBuilder({
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
  isInteraction(interaction) {
    if (!this.hasComponent(interaction))
      return false;
    if (interaction.isButton()) {
      const getPageButtonId = interaction.customId.split("--")?.pop();
      switch (getPageButtonId) {
        case "firstPage":
          this.toFirstPage();
          break;
        case "prevPage":
          this.toPreviousPage();
          break;
        case "nextPage":
          this.toNextPage();
          break;
        case "lastPage":
          this.toLastPage();
          break;
        default:
          break;
      }
      return true;
    }
    const start = this.data.page.current * this.data.page.length;
    const end = start + this.data.page.length;
    this.filterValues((_, i) => i >= end || i < start);
    const idsOnPage = this.getIndecesFromValues(interaction.values);
    for (const i of idsOnPage) {
      const selectedOption = this.options.at(i);
      if (typeof selectedOption === "undefined")
        continue;
      this.data.selected.set(i, selectedOption);
    }
    return true;
  }
  /**
   * Determines whether or not the interaction belongs to this builder.
   * @param interaction The interaction to narrow
   * @returns {boolean}
   */
  hasComponent(interaction) {
    return typeof this.data.customId !== "undefined" && interaction.customId.startsWith(this.data.customId);
  }
  /**
   * Transform an array of values (from a select menu)
   * into the ending digits. This assumes that the StringSelectMenuInteraction
   * belongs to this ChoiceSelectMenuBuilder. If that assumption is not met or there
   * is some issue with the custom IDs, they will be filtered out.
   * @param values The values to transform into digits.
   */
  getIndecesFromValues(values) {
    const isNumeric = /* @__PURE__ */ __name((n) => !isNaN(n) && isFinite(n), "isNumeric");
    return values.map((v) => Number(v.split("--")?.pop())).filter(isNumeric);
  }
  /**
   * Update the carrySelected, pageLength and maxPage properties
   * to the new values.
   */
  updatePageProps() {
    this.data.carrySelected = this.data.minChoices === this.data.maxChoices;
    this.data.page.length = _ChoiceSelectMenuBuilder.OPTIONS_LIMIT;
    if (this.data.carrySelected) {
      this.data.page.length -= this.data.selected.size;
    }
    this.data.page.max = Math.floor(
      this.options.length / this.data.page.length
    );
  }
  /**
   * Transforms the provided option into a usable API Select Menu Option.
   * @param i The index of the array to transform at.
   * @param value The value to transform.
   */
  toAPISelectMenuOption(i, value) {
    const offset = this.data.page.current * this.data.page.length;
    return {
      label: this.data.labelFn(value, i),
      description: this.data.descriptionFn?.(value, i),
      default: this.data.selected.has(i + offset),
      value: `${this.data.customId}--${i + offset}`
    };
  }
  /**
   * Transforms the options into a usable API Select Menu Option.
   * @param start The start of the slice to map. Leave undefined to
   * directly access the options array.
   * @param end The end of the slice to map. Defaults to the end
   * of the options array.
   */
  visualizeOptions(start, end) {
    if (typeof start === "undefined") {
      return this.options.map((v, i) => this.toAPISelectMenuOption(i, v));
    }
    return this.options.slice(start, end).map((v, i) => this.toAPISelectMenuOption(i + start, v));
  }
  /**
   * Generates the page buttons for the currently selected page.
   * Disables buttons dependent on what page the user is on and
   * how many choices are remaining.
   */
  get navigatorButtons() {
    const {
      buttonStyles,
      customId,
      selected,
      page,
      maxChoices = this.options.length
    } = this.data;
    let isAtStart = page.current === 0;
    let isAtEnd = page.current === page.max;
    if (selected.size >= maxChoices) {
      const indexStart = page.current * page.length;
      const indexEnd = indexStart + page.length;
      isAtStart ||= selected.every((_, n) => n >= indexStart);
      isAtEnd ||= selected.every((_, n) => n <= indexEnd);
    }
    return new import_discord.ActionRowBuilder().addComponents(
      new import_discord.ButtonBuilder().setLabel("\u23EE\uFE0F").setStyle(buttonStyles.navigator).setDisabled(isAtStart).setCustomId(`${customId}--firstPage`),
      new import_discord.ButtonBuilder().setLabel("\u25C0\uFE0F").setStyle(buttonStyles.navigator).setDisabled(isAtStart).setCustomId(`${customId}--prevPage`),
      // The center button displays what page you're currently on.
      new import_discord.ButtonBuilder().setLabel(`Page ${page.current + 1}/${page.max + 1}`).setStyle(buttonStyles.middle).setDisabled(true).setCustomId("btn-never"),
      new import_discord.ButtonBuilder().setLabel("\u25B6\uFE0F").setStyle(buttonStyles.navigator).setDisabled(isAtEnd).setCustomId(`${customId}--nextPage`),
      new import_discord.ButtonBuilder().setLabel("\u23ED\uFE0F").setStyle(buttonStyles.navigator).setDisabled(isAtEnd).setCustomId(`${customId}--lastPage`)
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChoiceSelectMenuBuilder
});
//# sourceMappingURL=index.js.map