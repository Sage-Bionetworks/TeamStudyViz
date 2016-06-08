// https://footballplayershealth.harvard.edu/teamstudy-app-question-week/
// Public URL: https://s3.amazonaws.com/org-sagebridge-teamstudy/index.html

var questionHeader = document.querySelector("h1");
var legend = document.getElementById("legend");
var COLORS = ['#14697D', '#AC4039', '#5B964C', '#795C1F', '#59988B', '#86A4B1', '#697885'];
var ONE_WEEK = 1000*60*60*24*7;
var ID = 'default';

function oneWeekAgoISOString() {
    return new Date(new Date().getTime()-ONE_WEEK).toISOString().split("T")[0];
}
function nowISOString() {
    return new Date().toISOString().split("T")[0];
}
function handleAbort(response) {
    console.error(response);
}
function handleLoad(response) {
    render(response.responseJSON);
}
function render(json) {
    questionHeader.textContent = json.question;
    json.football_player.forEach(addLegendEntry);
    createPieChart('#player_pie_chart', processAnswers(json.football_player));
    createPieChart('#public_pie_chart', processAnswers(json.test_user));
    revealPage();
}
function createPieChart(target, dataset) {
    var cw = document.body.clientWidth;
    var offset = cw/12;
    var padding = cw*.1;
    var data = { labels: dataset[0], series: dataset[1] };
    new Chartist.Pie(target, data, {
        labelOffset: offset
    });
}
function revealPage() {
    document.body.style.opacity = "1.0";
}
function processAnswers(answers) {
    var labels = [];
    var values = [];
    for (var i=0; i < answers.length; i++) {
        var answer = answers[i];
        if (answer.percent > 0) {
            labels.push(answer.percent+"%");
            values.push(answer.percent);
        }
    }
    return [labels, values];
}
function addLegendEntry(answer, index) {
    var spanColor = document.createElement("span");
    spanColor.className = "legendColor";
    spanColor.style.backgroundColor = COLORS[index];
    spanColor.innerHTML = "&#160;";

    var spanText = document.createElement("span");
    spanText.className = "legendText";
    spanText.textContent = answer.answer;

    var div = document.createElement("div");
    div.appendChild(spanColor);
    div.appendChild(spanText);
    legend.appendChild(div);
}
//https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
            func.apply(context, args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}
function adjustScale() {
    document.documentElement.style.fontSize = (document.body.clientWidth/28) + "px";
}
function getLastMonday(d) {
    var date = new Date(d);
    var day = date.getDay() || 7;  
    if( day !== 1 ) {
        date.setHours(-24 * (day - 1));
    }
    return date;
}
function getOffset(monString, hours) {
    var d = new Date(monString);
    d.setHours(d.getHours()+hours);
    return d.toISOString().split("T")[0];
}

window.display = function(sessionToken, userAgentHeader, languageHeader) {
    console.assert(sessionToken, "sessionToken required");
    console.assert(userAgentHeader, "userAgent header required");
    console.assert(languageHeader, "language header required");

    // TODO: work out date range code
    var startDate = oneWeekAgoISOString();
    var endDate = nowISOString();

    var url = 'https://webservices.sagebridge.org/v3/reports/' + ID +
            '?startDate='+startDate+'&endDate='+endDate;

    console.info("Querying for ", startDate, "-", endDate);
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.setRequestHeader("Bridge-Session", sessionToken);
    request.setRequestHeader("User-Agent", userAgentHeader);
    request.setRequestHeader("Accept-Language", languageHeader);
    request.addEventListener("abort", handleAbort);
    request.addEventListener("load", handleLoad);
    request.send();
}

window.onorientationchange = adjustScale;
window.addEventListener("resize", debounce(adjustScale, 100, false), true);
adjustScale();

// Generates the query strings to get each monday report going back either 5 weeks
// or to the date of release. Not yet sure how state will be maintained for this.
// Probably just won't unload the page, and smooth scroll it back to the top.

var dateOfRelease = new Date("2016-05-13");
var array = [];
var i = 0;
var date = new Date();

while(date.getTime() > dateOfRelease.getTime() && i < 5) {
    date = getLastMonday(date);
    array.push(date.toISOString().split("T")[0]);
    date.setHours(-24*2);
    i++
}
array = array.map(function(dateString) {
    return "?startDate="+getOffset(dateString, -24)+"&endDate="+getOffset(dateString, 24);
});

render(data);