# Noongar Seasons and Country Explorer

This app helps you explore plant species by Noongar season, ILUA area, and category. Species lists include plant photos and information, and you can mark species you find.

## Start the app

Download from github
navigate to Project folder in terminal before running server
add line about hard refresh Ctrl + F5 blah blah blah - "troubleshoot"
Add references


The app loads its CSV data with browser requests, so open it through a local web server rather than opening `index.html` directly.

1. Open PowerShell or a terminal in the project folder.
2. Start the server:

   ```powershell
   py -m http.server 8000
   ```

   If `py` is unavailable but Python is installed, use `python -m http.server 8000` instead.
3. In your browser, go to <http://localhost:8000>.
4. Leave the terminal window open while using the app. Press Ctrl+C in that window when you are finished.

If port 8000 is already in use, start the server on another port, such as 8001, and open the matching address, for example <http://localhost:8001>.

## Explore plants

1. Select one of the six season sections in the wheel.
2. Select an ILUA area using its label on the map. The area information boxes appear above the map.
3. Select Bush Food, Bush Medicine, or Wildflowers.
4. Browse the species that match your selected season, area, and category. The list is alphabetized by species name.
5. Select a species photo to view it enlarged. Close the image with the Close button, by pressing Escape, or by selecting the dimmed area outside it.
6. Use the Found checkbox to mark a species you have found. The checkbox states are saved in your browser on that device, and remain after reloading the app.

Use **Back** to return one step and change the previous selection. Use **Home** to return to the season wheel and clear the current season, area, and category selections. Your saved Found checkboxes are not cleared by Home.

Use **Back to top of list** at the bottom of the species view to return to the start of a long list.

## Offline use

Keep the project files together, including the CSV files, `category_photos/`, and `species_photos/`. When those files are available on the device, the app and its photos do not require an internet connection. A local web server is still required to load the CSV data in the browser. Found checkbox states are stored separately in that browser's local storage.
