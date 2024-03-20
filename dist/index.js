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

// src/ChoiceSelectMenuBuilder.ts
var ChoiceSelectMenuBuilder_exports = {};
__export(ChoiceSelectMenuBuilder_exports, {
  ChoiceSelectMenuBuilder: () => ChoiceSelectMenuBuilder
});
module.exports = __toCommonJS(ChoiceSelectMenuBuilder_exports);
var import_discord = require("discord.js");

// src/PageManager.ts
var PageManager = class {
  static {
    __name(this, "PageManager");
  }
  constructor(array, selected, minChoices, maxChoices, currentPage = 0) {
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
  array;
  /**
   * A reference to the selected elements.
   */
  selected;
  /**
   * The 0-indexed page the builder is currently on.
   * This is always in the range `0 <= current <= max`
   */
  current;
  /**
   * The minimum amount of choices that a user must make.
   * Note that it only prevents selecting less than this value, it
   * can still be visually shown without any selections.
   */
  minChoices;
  /**
   * The maximum amount of choices that a user may make.
   * This value defaults to `options.length`.
   */
  maxChoices;
  get carrySelected() {
    return this.minChoices > 0;
  }
  /**
   * The maximum 0-indexed page the builder can reach.
   * This property is derived from the page's length
   */
  get max() {
    if (!this.carrySelected)
      return Math.ceil(this.array.length / this.length) - 1;
    const notSelected = this.array.length - this.selected.size;
    const newPageSize = this.length - this.selected.size;
    return Math.ceil(notSelected / newPageSize) - 1;
  }
  getPage(pageNumber) {
    const page = Math.min(this.max, pageNumber ?? this.current);
    if (!this.carrySelected) {
      const start2 = page * this.length;
      const end2 = start2 + this.length;
      return this.getSlice(start2, end2, false);
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
    ];
    if (output.length > this.length)
      throw new Error(
        `Generated page exceeds set page length.
Expected: <Array>.length <= ${this.length}
Actual: ${output.length}`
      );
    return output;
  }
  /**
   * Returns a slice of the array, along with its actual index location.
   * @param start - The start of the slice.
   * @param end - The end of the slice.
   * @param removeSelected - Removes selected indeces from the sliced array.
   */
  getSlice(start, end, removeSelected) {
    const newSlice = this.array.slice(start, end).map((e, i) => [i + start, e]);
    if (!removeSelected)
      return newSlice;
    return newSlice.filter(([i, _]) => !this.selected.has(i)).slice(0, this.length - this.selected.size);
  }
  /**
   * Get the end index of the page starting from the start parameter.
   * Will include more elements if the keys exist on the page.
   * @param start - The offset to base the end index on.
   * @param selectedIndeces - The selected indeces
   */
  getEndIndex(start, selectedIndeces) {
    let end = start + this.length;
    const withinBounds = selectedIndeces.filter(
      (i) => i >= start && i < end
    ).length;
    return end - selectedIndeces.length + withinBounds;
  }
  first() {
    if (this.hasFreePageMovement()) {
      this.current = 0;
      return;
    }
    const minSelected = Math.min(...this.selected.keys());
    if (!isFinite(minSelected))
      return;
    this.current = Math.ceil(minSelected / this.length);
    if (minSelected % this.length !== 0) {
      this.current -= 1;
    }
  }
  previous() {
    if (this.hasFreePageMovement()) {
      this.current = Math.max(0, this.current - 1);
      return;
    }
    const currentPageStart = this.current * this.length;
    const maxPreviousIndex = Math.max(
      ...this.selected.filter((_, n) => n < currentPageStart).keys()
    );
    if (!isFinite(maxPreviousIndex))
      return;
    this.current = Math.ceil(maxPreviousIndex / this.length);
    if (maxPreviousIndex % this.length !== 0) {
      this.current -= 1;
    }
  }
  next() {
    const max = this.max;
    if (this.hasFreePageMovement()) {
      this.current = Math.min(max, this.current + 1);
      return;
    }
    const currentPageEnd = this.current * this.length + this.length;
    const minNextIndex = Math.min(
      ...this.selected.filter((_, n) => n >= currentPageEnd).keys()
    );
    if (!isFinite(minNextIndex))
      return;
    this.current = Math.ceil(minNextIndex / this.length);
    if (minNextIndex % this.length !== 0) {
      this.current -= 1;
    }
  }
  last() {
    const max = this.max;
    if (this.hasFreePageMovement()) {
      this.current = max;
      return;
    }
    const maxSelected = Math.max(...this.selected.keys());
    if (!isFinite(maxSelected))
      return;
    this.current = Math.ceil(maxSelected / this.length);
    if (maxSelected % this.length !== 0) {
      this.current -= 1;
    }
  }
  hasFreePageMovement() {
    return (
      // carrySelected follows the user no matter where
      this.carrySelected || // no pagination
      this.array.length <= this.length || // maxChoices has not yet been filled
      this.selected.size < (this.maxChoices ?? this.array.length)
    );
  }
};

// src/ChoiceSelectMenuBuilder.ts
var ChoiceSelectMenuBuilder = class _ChoiceSelectMenuBuilder {
  static {
    __name(this, "ChoiceSelectMenuBuilder");
  }
  constructor(choices, selected) {
    const collection = new import_discord.Collection();
    this.options = choices;
    this.data = {
      selected: collection,
      labelFn: (value) => `${value}`,
      pages: new PageManager(choices, collection, 0),
      navigatorStyle: import_discord.ButtonStyle.Primary,
      pageLabelStyle: import_discord.ButtonStyle.Danger
    };
    if (typeof selected !== "undefined") {
      this.addValues(selected);
    }
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
   * @param {string} customId - The custom ID to set
   */
  setCustomId(customId) {
    this.data.customId = customId;
    return this;
  }
  /**
   * Set the minimum amount of choices of this builder. Defaults to
   * 0 for every new instance.
   * @param {number} amount - The minimum amount of choices to select in this menu.
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
    this.data.pages.minChoices = amount;
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
   * @param style The desired style for the navigator buttons.
   */
  setNavigatorStyle(style) {
    this.data.navigatorStyle = style;
    return this;
  }
  /**
   * Set the button styles for the center button displaying the current page.
   * @param style The desired style for the center button displaying the current page.
   */
  setPageLabelStyle(style) {
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
    const maxChoices = this.data.pages.maxChoices ?? this.options.length;
    if (maxChoices < this.data.selected.size)
      throw new Error(
        "Selected values exceed the configured maximum amount."
      );
    return this;
  }
  /**
   * Filters the selected values based on the provided function.
   * @param valueFn The callback function to use as filter. If this function
   * resolves to false, the selected value is removed from this menu.
   * @returns {ChoiceSelectMenuBuilder}
   */
  filterValues(valueFn) {
    const filtered = this.data.selected.filter(valueFn);
    this.data.selected = filtered;
    this.data.pages.selected = filtered;
    return this;
  }
  /**
   * Clears all selected values from this menu.
   * @returns {ChoiceSelectMenuBuilder}
   */
  clearValues() {
    this.data.selected.clear();
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
    return value;
  }
  /**
   * Returns a shallow copy of options that are visible on the current page.
   * If no page is specified, it will return the current page.
   * @param {number|undefined} page The page to fetch options from.
   */
  optionsOnPage(page = this.data.pages.current) {
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
  selectedOnPage(onPage = this.data.pages.current) {
    const page = this.data.pages.getPage(onPage);
    return page.filter((v) => this.data.selected.has(v[0])).map((v) => v[1]);
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
    this.data.pages.first();
    return this;
  }
  /**
   * Changes the paginated menu to the previous page. If the maximum
   * amount of choices has been reached, only skips to pages with
   * selections on it.
   * @returns {ChoiceSelectMenuBuilder}
   */
  toPreviousPage() {
    this.data.pages.previous();
    return this;
  }
  /**
   * Changes the paginated menu to the next page. If the maximum
   * amount of choices has been reached, only skips to pages with
   * selections on it.
   * @returns {ChoiceSelectMenuBuilder}
   */
  toNextPage() {
    this.data.pages.next();
    return this;
  }
  /**
   * Changes the paginated menu to the last page. If the maximum
   * amount of choices has been reached, it only skips to pages with
   * selections on it.
   * @returns {ChoiceSelectMenuBuilder}
   */
  toLastPage() {
    this.data.pages.last();
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
    const { customId, placeholder, selected, pages } = this.data;
    const currentMax = Math.min(
      // - maxChoices could be = this.options.length, so
      //      cap at this.optionsAtPage().length
      // - if there's only one page, then
      //      this.selected.length === this.selectedOnPage().length,
      //   so they cancel each other out. This is only for pagination
      //   purposes.
      (pages.maxChoices ?? this.options.length) - selected.size + this.selectedOnPage().length,
      this.optionsOnPage().length
    );
    const selectMenuData = {
      custom_id: customId,
      min_values: pages.minChoices,
      max_values: currentMax
    };
    switch (typeof placeholder) {
      case "function":
        selectMenuData.placeholder = placeholder(
          pages.minChoices,
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
    selectMenu.addOptions(
      pages.getPage().map(this.toAPISelectMenuOption, this)
    );
    if (pages.max === 0) {
      return [
        new import_discord.ActionRowBuilder({
          components: [selectMenu]
        })
      ];
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
    this.updateSelectedFromValues(interaction.values);
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
   * Parses an array of values (from a select menu)
   * into the selected values. This assumes that the StringSelectMenuInteraction
   * belongs to this ChoiceSelectMenuBuilder. If that assumption is not met or there
   * is some issue with the custom IDs, they will be filtered out.
   * @param values The values to transform into selected values.
   */
  updateSelectedFromValues(values) {
    const { pages } = this.data;
    if (!pages.carrySelected) {
      const currentPage = pages.getPage().map((v) => v[0]);
      const start = Math.min(...currentPage);
      const end = Math.max(...currentPage);
      this.filterValues((_, i) => i >= end || i < start);
    } else {
      this.data.selected.clear();
    }
    const idsOnPage = values.map((v) => Number(v.split("--")?.pop())).filter((n) => !isNaN(n) && isFinite(n));
    for (const i of idsOnPage) {
      const selectedOption = this.options.at(i);
      if (typeof selectedOption === "undefined")
        continue;
      this.data.selected.set(i, selectedOption);
    }
  }
  /**
   * Transforms the provided option into a usable API Select Menu Option.
   * @param i The index of the array to transform at.
   * @param value The value to transform.
   */
  toAPISelectMenuOption(row) {
    const [i, o] = row;
    return {
      label: this.data.labelFn(o, i),
      description: this.data.descriptionFn?.(o, i),
      default: this.data.selected.has(i),
      value: `${this.data.customId}--${i}`
    };
  }
  /**
   * Generates the page buttons for the currently selected page.
   * Disables buttons dependent on what page the user is on and
   * how many choices are remaining.
   */
  get navigatorButtons() {
    const { customId, selected, pages, navigatorStyle, pageLabelStyle } = this.data;
    const currentPage = pages.getPage().map((v) => v[0]);
    const start = Math.min(...currentPage);
    const end = Math.max(...currentPage);
    const max = pages.max;
    let isAtStart = pages.current === 0;
    let isAtEnd = pages.current === max;
    if (!pages.carrySelected && selected.size >= (pages.maxChoices ?? this.options.length)) {
      isAtStart ||= selected.every((_, n) => n >= start);
      isAtEnd ||= selected.every((_, n) => n <= end);
    }
    return new import_discord.ActionRowBuilder().addComponents(
      new import_discord.ButtonBuilder().setLabel("\u23EE\uFE0F").setStyle(navigatorStyle).setDisabled(isAtStart).setCustomId(`${customId}--firstPage`),
      new import_discord.ButtonBuilder().setLabel("\u25C0\uFE0F").setStyle(navigatorStyle).setDisabled(isAtStart).setCustomId(`${customId}--prevPage`),
      // The center button displays what page you're currently on.
      new import_discord.ButtonBuilder().setLabel(`Page ${pages.current + 1}/${max + 1}`).setStyle(pageLabelStyle).setDisabled(true).setCustomId("btn-never"),
      new import_discord.ButtonBuilder().setLabel("\u25B6\uFE0F").setStyle(navigatorStyle).setDisabled(isAtEnd).setCustomId(`${customId}--nextPage`),
      new import_discord.ButtonBuilder().setLabel("\u23ED\uFE0F").setStyle(navigatorStyle).setDisabled(isAtEnd).setCustomId(`${customId}--lastPage`)
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChoiceSelectMenuBuilder
});
//# sourceMappingURL=index.js.map