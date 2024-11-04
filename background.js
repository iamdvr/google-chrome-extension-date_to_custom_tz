function padStringToFixedLength(inputString, fixedLength) {
  const str = String(inputString); // Convert input to a string
  const paddingLength = fixedLength - str.length; // Calculate required padding

  // Ensure padding length is not negative (in case input is longer than fixed length)
  return paddingLength > 0 ? str.padEnd(fixedLength, '\u00A0') : str;
}

function trimToMaxLength(inputString, maxLength = 50) {
  return inputString.length > maxLength 
    ? inputString.substring(0, maxLength) 
    : inputString;
}

// Helper function to create a date object from extracted parts
function createDateTime(year, month, day, hours, minutes, seconds) {
  const now = new Date();
  return new Date(
    year ?? now.getFullYear(),
    month ?? now.getMonth(),
    day ?? now.getDate(),
    hours ?? now.getHours(),
    minutes ?? now.getMinutes(),
    seconds ?? now.getSeconds()
  );
}

// Helper function to check if text is in time-only format
function parseDateTime(input) {
  const now = new Date(); // Get the current date and time
  let date, time, hours, minutes, seconds;

  // Define regular expressions for different date and time formats
  const timeOnlyRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*([APap][mM])?$/; // Time formats (HH:mm or HH:mm AM/PM)
  const timeWithSecondsRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9])\s*([APap][mM])?$/; // Time with seconds (HH:mm:ss AM/PM)
  const timeWithUnicodeAMPMRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*[\u202F\s]?(AM|PM|am|pm)$/; // Time with non-breaking space and AM/PM (6:07 AM)
  const fullDateTimeRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{1,2}),\s(\d{4})\s(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9])\s*([APap][mM])?$/; // Full datetime (Nov 04, 2024 02:34:57 pm)
  const dayDateRegex = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s([A-Za-z]+)\s(\d{1,2}),\s(\d{4})$/; // Day and date (Monday, Nov 4, 2024)
  const monthYearRegex = /^([A-Za-z]+),\s(\d{4})$/; // Month and year only (November, 2024)
  
  try {
    // Check the input format and parse accordingly
    if (!isNaN(new Date(input))) {
      date = new Date(input);
  
    } else if (fullDateTimeRegex.test(input)) {
      const match = input.match(fullDateTimeRegex);
      const month = new Date(`${match[1]} 1, 2000`).getMonth();
      date = createDateTime(
        parseInt(match[3]), month, parseInt(match[2]),
        match[4] % 12 + (match[7] && match[7].toLowerCase() === 'pm' ? 12 : 0),
        parseInt(match[5]), parseInt(match[6])
      );
  
    } else if (dayDateRegex.test(input)) {
      const match = input.match(dayDateRegex);
      const month = new Date(`${match[2]} 1, 2000`).getMonth();
      date = createDateTime(parseInt(match[4]), month, parseInt(match[3]));
  
    } else if (monthYearRegex.test(input)) {
      const match = input.match(monthYearRegex);
      const month = new Date(`${match[1]} 1, 2000`).getMonth();
      date = createDateTime(parseInt(match[2]), month, 1);
  
    } else if (timeWithSecondsRegex.test(input)) {
      const match = input.match(timeWithSecondsRegex);
      hours = parseInt(match[1]) % 12 + (match[4] && match[4].toLowerCase() === 'pm' ? 12 : 0);
      minutes = parseInt(match[2]);
      seconds = parseInt(match[3]);
      if (!match[4] && match[1] === "12") hours = 12; // Default 12:xx:xx to PM
      date = createDateTime(null, null, null, hours, minutes, seconds);
  
    } else if (timeWithUnicodeAMPMRegex.test(input)) {
      const match = input.match(timeWithUnicodeAMPMRegex);
      hours = parseInt(match[1]) % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0);
      minutes = parseInt(match[2]);
      date = createDateTime(null, null, null, hours, minutes);
  
    } else if (timeOnlyRegex.test(input)) {
      const match = input.match(timeOnlyRegex);
      hours = parseInt(match[1]) % 12 + (match[3] && match[3].toLowerCase() === 'pm' ? 12 : 0);
      minutes = parseInt(match[2]);
      if (!match[3] && match[1] === "12") hours = 12; // Default 12:xx to PM if no AM/PM
      date = createDateTime(null, null, null, hours, minutes);
  
    } else {
      // If no format matches, return the current date and time
      date = NaN;
    }

    return date;

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
    const selectedText = trimToMaxLength(info.selectionText.trim(), 50);
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
        args: [selectedText, utcString, istString, nyString, centralString]
      });
    } else {
      //alert("Selected text is not a valid date format.");
      message = "Selected text is not a valid date format => " + selectedText;
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
function showConversionResults(selectedText, utcString, istString, nyString, centralString) {
  // console.log(`${istString}\n\n${utcString}\n\n${nyString}\n\n${centralString}\n`);

  // Copy the UTC date to clipboard in the page context
  const input = document.createElement("textarea");
  input.value = `${istString}\n${utcString}\n${nyString}\n${centralString}`;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);

  alert(`Input ${selectedText}\n\n${istString}\n${utcString}\n${nyString}\n${centralString}`);
}


