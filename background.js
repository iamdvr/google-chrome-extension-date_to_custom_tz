function padStringToFixedLength(inputString, fixedLength) {
  const str = String(inputString); // Convert input to a string
  const paddingLength = fixedLength - str.length; // Calculate required padding

  // Ensure padding length is not negative (in case input is longer than fixed length)
  return paddingLength > 0 ? str.padEnd(fixedLength, '\u00A0') : str;
}

// Helper function to check if text is in time-only format
function parseDateTime(input) {
  const now = new Date(); // Get the current date and time
  let date, time;

  // Define regular expressions for different formats
  const timeOnlyRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*([APap][mM])?$/; // Time formats (with or without AM/PM)
  const timeWithSecondsRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) ?([APap][mM])?$/; // Time with seconds
  const dateRegex = /^(Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/; // Full date formats
  const shortDateRegex = /^(Sat|Sun|Mon|Tue|Wed|Thu|Fri),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{1,2}:\d{2}\s?([APap][mM])?$/; // Short date formats

  try {
    // Check the input format and parse accordingly
    if (!isNaN(new Date(input))) {
      date = new Date(input);
    } else if (timeOnlyRegex.test(input)) {
      // Time only (HH:mm or HH:mm AM/PM)
      time = input.match(timeOnlyRegex);
      const hours = time[1] ? (time[3] ? (time[1] % 12) + 12 : time[1] % 12) : 0; // Convert to 24-hour format
      const minutes = time[2] || 0;
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    } else if (timeWithSecondsRegex.test(input)) {
      // Time with seconds
      time = input.match(timeWithSecondsRegex);
      const hours = time[1] ? (time[4] ? (time[1] % 12) + 12 : time[1] % 12) : 0; // Convert to 24-hour format
      const minutes = time[2] || 0;
      const seconds = time[3] || 0;
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);
    } else if (dateRegex.test(input)) {
      // Full date
      date = new Date(input); // Directly parse the full date
      date.setHours(0, 0, 0, 0); // Set time to midnight
    } else if (shortDateRegex.test(input)) {
      // Short date
      const [day, month, dayNum, timePart] = input.match(shortDateRegex);
      const monthMap = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4,
        Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9,
        Nov: 10, Dec: 11
      };
      const hours = timePart ? (timePart.includes('PM') ? 12 : 0) : 0; // Default to midnight
      const minutes = timePart ? timePart.split(':')[1] : 0;
      date = new Date(now.getFullYear(), monthMap[month], parseInt(dayNum), hours, minutes, 0);
    } else {
      date = NaN; // Return NaN for invalid formats
      // throw new Error("Invalid date/time format");
    }

  } catch (error) {
    message = "Date parsing error:" + error.message;
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png", // Provide an icon image
      title: "Date Conversion Error",
      message: message,
      priority: 1
    });
    return NaN; // Return NaN for any parsing errors
  }
  return date;
}

// Create a context menu item that only shows up for text selections
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convertDate",
    title: "Convert Date",
    contexts: ["selection"]
  });
});

// Listen for context menu click event
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convertDate" && info.selectionText) {
    const selectedText = info.selectionText.trim();
    date = parseDateTime(selectedText);
    message = "Date parsed:" + date;
    // chrome.notifications.create({
    //         type: "basic",
    //         iconUrl: "icon.png", // Provide an icon image
    //         title: "Date Conversion In process",
    //         message: message,
    //         priority: 1
    //     });
    if (!isNaN(date)) {
      // Convert to UTC
      // const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
      const utcDate = date.toLocaleDateString("en-CA", { timeZone: "UTC" }) + ' ' + date.toLocaleTimeString("fr-FR", { timeZone: "UTC" });

      // Convert to IST (IST)
      // const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const istDate = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + ' ' + date.toLocaleTimeString("fr-FR", { timeZone: "Asia/Kolkata" });

      // Convert to New York time (America/New_York)
      // const nyDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const nyDate = date.toLocaleDateString("en-CA", { timeZone: "America/New_York" }) + ' ' + date.toLocaleTimeString("fr-FR", { timeZone: "America/New_York" });

      // Convert to CST Central timezone time (America/Chicago)
      // const centralDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));
      const centralDate = date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }) + ' ' + date.toLocaleTimeString("fr-FR", { timeZone: "America/Chicago" });

      // Format the dates
      const utcString = `${padStringToFixedLength('UTC', 20)}: ${utcDate}`;
      const istString = `${padStringToFixedLength('IST', 20)}: ${istDate}`;
      const nyString = `${padStringToFixedLength('New York (US)', 20)}: ${nyDate}`;
      const centralString = `${padStringToFixedLength('Central (US)', 20)}: ${centralDate}`;

      // Display the results
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showConversionResults,
        args: [utcString, istString, nyString, centralString]
      });
    } else {
      //alert("Selected text is not a valid date format.");
      message = "Selected text is not a valid date format.";
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png", // Provide an icon image
        title: "Date Conversion Error",
        message: message,
        priority: 1
      });
    }
  }
});


// Function to show conversion results as an alert on the page
function showConversionResults(utcString, istString, nyString, centralString) {
  // console.log(`${istString}\n\n${utcString}\n\n${nyString}\n\n${centralString}\n`);
  
  // Copy the UTC date to clipboard in the page context
  const input = document.createElement("textarea");
  input.value = `${istString}\n${utcString}\n${nyString}\n${centralString}`;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);

  alert(`${istString}\n${utcString}\n${nyString}\n${centralString}`);
}


