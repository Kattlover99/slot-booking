function doGet() {
    const template = HtmlService.createTemplateFromFile("page");
    // const styles = HtmlService.createTemplateFromFile("styles").getRawContent();
    template.styles = "";
    template.enabledDays = getEnabledDays();
    return template
        .evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function getEnabledDays() {
    const ss = SpreadsheetApp.getActive();
    const calendar_config_sheet = ss.getSheetByName(SHEET_NAMES.CALENDAR_CONFIG);
    const calData = calendar_config_sheet
        .getRange(
            1,
            1,
            calendar_config_sheet.getLastRow(),
            calendar_config_sheet.getLastColumn()
        )
        .getValues();
    const calendarId = calData[1][0];
    const enabledDays = [];

    let dayNumber = -1;
    for (let i = 0; i < 14; i += 2) {
        const result = calData[4][i];
        dayNumber++;
        if (result != "on") continue;
        enabledDays.push(dayNumber);
    }
    return enabledDays;
}

function getAvailableTimeslots({ date }) {
    const selectedDate = new Date(date);
    const ss = SpreadsheetApp.getActive();
    const calendar_config_sheet = ss.getSheetByName(SHEET_NAMES.CALENDAR_CONFIG);
    const calData = calendar_config_sheet
        .getRange(
            1,
            1,
            calendar_config_sheet.getLastRow(),
            calendar_config_sheet.getLastColumn()
        )
        .getValues();
    const calendarId = calData[1][0];
    let slots = [];
    const possibleSlots = getPossibleTimeslots(selectedDate.getDay(), calData);
    if (!possibleSlots.length) return JSON.stringify({ slots });
    const calendar = CalendarApp.getCalendarById(calendarId);
    slots = getAvailableSlots(possibleSlots, calendar, date);
    return JSON.stringify({ slots });
}

function getAvailableSlots(
    possibleSlots: Array<object>,
    calendar: GoogleAppsScript.Calendar.Calendar,
    date
) {
    const slots = [];
    for (let i = 0; i < possibleSlots.length; i++) {
        const { startTime, endTime } = possibleSlots[i];

        const st = new Date(date);
        const et = new Date(date);
        const tempStart = new Date(startTime);
        const tempEnd = new Date(endTime);
        st.setHours(tempStart.getHours());
        st.setMinutes(tempStart.getMinutes());
        st.setSeconds(tempStart.getSeconds());
        et.setHours(tempEnd.getHours());
        et.setMinutes(tempEnd.getMinutes());
        et.setSeconds(tempEnd.getSeconds());

        const events = calendar.getEvents(st, et);
        if (events.length) continue;
        slots.push(possibleSlots[i]);
    }
    return slots;
}
