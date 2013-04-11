# Better WeBWorK
If you've used WeBWorK before, you'll know that it could use some cleaning up. Better WeBWorK aims to make your homework doing experience a bit easier by providing a few tools to make your life easier.

## Current features
Better WeBWorK is still under heavy development, so this list is far from complete. If you have any suggestions for what could make your life easier, feel free to open an issue/pull request!

 * Provides an overall score on set list
 * Color codes question scores on set list
 * Humanizes the due date ( *This webwork is due in 3 days* )
 * Helps you schedule your work ( *Complete 7 problems per day to finish on time* )

Here's an early screenshot of the set list (taken 2013-03-16):
[![Screenshot](http://i.imgur.com/Q3hqCSAl.jpg)](http://i.imgur.com/Q3hqCSA.jpg)

## Installation
Better Webwork will eventually be on the Chrome Web Store, but until then you'll have to install it by 

 * Checking out the repository:

```bash
    $ git checkout http://github.com/stevenleeg/better-webwork.git
```

 * Navigating to `chrome://extensions`
 * Enabling **Developer mode**
 * Clicking **Load unpacked extension...**
 * Selecting Better Webwork's folder

## Installation as proxy
Better WebworK can also be used as a proxy instead of as a Chrome extension.

 * Install [Node.js](http://nodejs.org/)

 * Start the proxy:

```bash
    $ node proxy.js
```

 * Connect to the [local server](http://localhost:8031/)
