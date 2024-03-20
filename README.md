# <samp>discordjs-choice-selectmenu-builder</samp>

A custom Discord.js builder to easily visualize an array of choices to a user.

![](https://i.imgur.com/IYVb9T9.gif)

## Features

-   Using latest [discord.js v14.x version](https://github.com/discordjs/discord.js/releases)
-   Supports all types of arrays
    -   Automatic pagination
    -   Easy response handling
    -   Quick access to selected elements of array
    -   Simple formatting using callback functions
-   Similar syntax to discord.js builders for ease of use
-   Safety with pages
    -   Respects minimum and maximum choices
    -   Allows selections on multiple pages

## Installation Node

```sh
npm install --save discordjs-choice-selectmenu-builder
```

```js
import { ChoiceSelectMenuBuilder } from 'discordjs-choice-selectmenu-builder';
```

## Most Common Usage

```js
const customChoices = ['Choice 1', 'Choice 2', 'Choice 3'];

// Create builder based on the provided array.
const selectMenu = new ChoiceSelectMenuBuilder(customChoices);

const actionRow = selectMenu.toActionRow(); // Transform into discord.js-compatible action rows
```

## Customization

```js
const options = [
    { id: 1, name: 'Choice 1', count: 50 },
    { id: 2, name: 'Choice 2', count: 29 },
    { id: 3, name: 'Choice 3', count: 5 },
    { id: 4, name: 'Choice 4', count: 15 }
];

const selectMenu = new ChoiceSelectMenuBuilder(options)
    // set custom Id of select menu
    .setCustomId('foo')
    // set minimum choices of select menu. Works with pagination!
    .setMinChoices(1)
    // set maximum choices of select menu. Works with pagination!
    .setMaxChoices(3);

selectMenu
    // format elements into readable labels
    .setLabel((value) => value.name)
    // format elements into readable descriptions
    .setDescription((value) => `${value.count} entries`)
    // format placeholder statically or dynamically
    .setPlaceholder('Custom placeholder')
    .setPlaceholder((min, max) => `Select up to ${max} values ...`)
    // set the selected values
    .setValues((value, i) => value.id === 1)
    // add selected values
    .addValues((value, i) => value.id === 2)
    // change the default styles of the navigator buttons
    .setNavigatorStyle(ButtonStyle.Primary)
    // change the default style of the center label button
    .setPageLabelStyle(ButtonStyle.Success);
```

## Response Handling

```js
const options = [
    { id: 1, name: 'Choice 1', count: 50 },
    { id: 2, name: 'Choice 2', count: 29 },
    { id: 3, name: 'Choice 3', count: 5 },
    { id: 4, name: 'Choice 4', count: 15 }
];

const selectMenu = new ChoiceSelectMenuBuilder(options)
    .setCustomId('foo')
    .setMinChoices(1)
    .setMaxChoices(3);

const message = await interaction.editReply({
    content: 'Select from the menu below!',
    components: selectMenu.toActionRow()
});

// collect ButtonInteraction or StringSelectMenuInteraction
const response = message.awaitMessageComponent(/* ... */);

if (selectMenu.isInteraction(response)) {
    // interaction response has already been handled

    const newValues = selectMenu.values;
    // newValues: { id: number, name: string, count: number }[]
    const firstValue = selectMenu.firstValue;
    // firstValue: { id: number, name: string, count: number } | undefined
    return;
}
// handle any other responses here
```

## Additional Functionality

```js
selectMenu
    .clearValues() // remove all selected values
    .toFirstPage() // change the current page of the menu
    .toPreviousPage()
    .toNextPage()
    .toLastPage();

// remove last selected value
const lastSelected = selectMenu.popValue();
// remove selected values based on filter
selectMenu.filterValues((value) => value.id < 3);

// get all currently visible selected choices
const onlyOnThisPage = selectMenu.selectedOnPage();
//... or on specific pages
const onlyOnOtherPage = selectMenu.selectedOnPage(3);

// get all visible objects from the array
const currentlyVisible = selectMenu.optionsOnPage();
```
