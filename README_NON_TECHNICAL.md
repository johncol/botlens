# BotLens — Setup Guide

This guide helps you install and run BotLens on your Mac. Follow the steps in order.

You need:

- A GitHub account
- Google Chrome installed on your Mac

---

## Step 1: Open Terminal

Terminal is an app on your Mac. It lets you run text commands.

1. Press **Command (⌘) + Space** to open Spotlight.
2. Type `Terminal`.
3. Press **Enter**.

A window opens with a blinking cursor. You type commands here and press **Enter** to run them.

---

## Step 2: Install Node.js

Node.js is the software that runs BotLens. You install it once.

1. Go to [nodejs.org](https://nodejs.org).
2. Click **Get Node.js**.
3. Click on "Copy to clipboard"
4. Paste it on the terminal and press enter

To check that the installation worked, type this in Terminal and press **Enter**:

```
node --version
```

The output should start with `v24`.

---

## Step 3: Get the code

In Terminal, run these two commands one at a time:

> If a popup appears asking to install developer tools, click **Install** and wait for it to finish. Then run the command again.

```
git clone https://github.com/johncol/botlens
```

```
cd botlens
```

Then install the app's dependencies:

```
npm install
```

This takes about a minute.

---

## Step 4: Configure the app

Copy the example settings file:

```
cp .env.example .env.local
```

Open the file in TextEdit:

```
open -e .env.local
```

Find the line that starts with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=` and add the Chrome path after the `=` sign:

```
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

Save the file and close TextEdit.

---

## Step 5: Start the app

```
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser. BotLens is running.

To stop the app, click on the Terminal window and press **Control (^) + C**.

> Each time you want to use the app, open Terminal, run `cd botlens`, then run `npm run dev`.

---

## Optional: Save credentials to avoid typing them each time

BotLens asks you to enter credentials for protected environments (staging, development, UAT) each time you use the Human vs Bot tool and the Env vs Env tool. To skip that, you can save credentials in `.env.local`.

Open the file:

```
open -e .env.local
```

Fill in the values for the environments you use:

```
STAGING_USER=username
STAGING_PASSWORD=password

DEVELOPMENT_USER=username
DEVELOPMENT_PASSWORD=password

UAT_USER=username
UAT_PASSWORD=password
```

Save and close the file. The next time you start the app, the form fills in automatically.

---

## Optional: Update the app to get the latest changes

When a new version of BotLens is available, run these two commands in Terminal:

```
cd botlens
```

```
git pull origin main
```

That is all. The next time you start the app with `npm run dev`, it will run the latest version.
