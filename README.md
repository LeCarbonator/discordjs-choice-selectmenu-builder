# <samp>discordjs-choice-selectmenu-builder</samp>

A custom Discord.js builder to easily visualize an array of choices to a user.

![](https://i.imgur.com/IYVb9T9.gif)

## Features
- Using latest [discord.js v14.x version](https://github.com/discordjs/discord.js/releases)
- Supports all types of arrays
    - Automatic pagination
    - Easy response handling
    - Quick access to selected values
- Similar syntax to discord.js builders for ease of use
- Safety with pages
  	- Respects minimum and maximum choices
  	- Allows selections on multiple pages

## Installation Node
```sh
npm install discordjs-choice-selectmenu-builder
```
```js
import { ChoiceSelectMenuBuilder } from 'discordjs-choice-selectmenu-builder';
```

## Most Common Usage

```js
const customChoices = [ "Choice 1", "Choice 2", "Choice 3" ];

// Create builder based on the provided array.
const selectMenu = new ChoiceSelectMenuBuilder(customChoices);

const actionRow = selectMenu.toActionRow(); // Transform into discord.js-compatible action rows
```

## Customization
```js
const options = [
    { id: 1, name: 'Choice 1', count: 50 },
    { id: 2, name: 'Choice 2', count: 29 },
    { id: 3, name: 'Choice 3', count: 5  },
    { id: 4, name: 'Choice 4', count: 15 }
];

const selectMenu = new ChoiceSelectMenuBuilder(options)
    .setCustomId('foo') // set custom Id of select menu
    .setMinChoices(1)   // set minChoices of select menu. Works with pagination!
    .setMaxChoices(3)   // set maxChoices of select menu. Works with pagination!
    .setLabel(          // format elements into readable labels
        (value) => value.name
    )                     
    .setDescription(   // format elements into readable descriptions
        (value) => `${value.count} entries`
    )
    .setValues(        // set default values
        (value, i) => value.id === 1
    )
    .setButtonStyles(  // change the default styles of the navigator buttons
        ButtonStyle.Primary,
        ButtonStyle.Success
    )

const selected = selectMenu.values;
// [{ id: 1, name: 'Choice 1', count: 50 }]

const firstSelected = selectMenu.firstValue;
// { id: 1, name: 'Choice 1', count: 50 }
```

## Additional Functionality
```js
selectMenu
    .clearValues() // remove all selected values
	.toFirstPage()
	.toPreviousPage()
	.toNextPage()
	.toLastPage()  // change the current page of the menu

const lastSelected = selectMenu.popValue() // remove last selected value

selectMenu.filterValues((value) => value.id < 3) // remove selected values based on filter

const onlyOnThisPage = selectMenu.selectedOnPage();   // get all currently visible selected choices
const onlyOnOtherPage = selectMenu.selectedOnPage(3); //... or on specific pages

const currentlyVisible = selectMenu.optionsOnPage(); // get all visible objects from the array
```

## Response Handling

```js
const message = await interaction.editReply({
	content: 'Select from the menu below!',
	components: selectMenu.toActionRow(),
});

// collect ButtonInteraction or StringSelectMenuInteraction
const response = message.awaitMessageComponent( /* ... */ );

if (selectMenu.isInteraction(response)) {
    // interaction response has already been handled
    const newValues = selectMenu.values;
    return;
}
// handle any other responses here
```
