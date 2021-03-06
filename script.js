// https://footballplayershealth.harvard.edu/teamstudy-app-question-week/
// Public URL: https://s3.amazonaws.com/org-sagebridge-teamstudy/index.html

var questionHeader = document.querySelector("h1");
var legend = document.getElementById("legend");
var priorWeekLink = document.getElementById("priorWeek");
var COLORS = ['#14697D', '#AC4039', '#5B964C', '#795C1F', '#59988B', '#86A4B1', '#697885', 'salmon'];
var ONE_WEEK = 1000*60*60*24*7;
var ID = 'weekly-survey';
var weekQuery = [];
var EARLIEST_TIMESTAMP = 1458432000000;

// Generates the query strings to get each monday report going back either 5 weeks
// or to the date of release. Not yet sure how state will be maintained for this.
// Probably just won't unload the page, and smooth scroll it back to the top.
var date = new Date();
while(date.getTime() > EARLIEST_TIMESTAMP) {
    date = getLastMonday(date);
    weekQuery.push(date.toISOString().split("T")[0]);
    date.setHours(-24*2);
}
weekQuery = weekQuery.map(function(dateString) {
    return "?startDate="+getOffset(dateString, -24)+"&endDate="+getOffset(dateString, 24);
});
console.log(weekQuery);

function oneWeekAgoISOString() {
    return new Date(new Date().getTime()-ONE_WEEK).toISOString().split("T")[0];
}
function nowISOString() {
    return new Date().toISOString().split("T")[0];
}
function handleAbort(event) {
    alert(event.target.statusText);
    console.error(event);
}
function handleLoad(json) {
    var data = json.items[0].data;
    data.date = json.items[0].date;
    render(data);
}
function render(json) {
    questionHeader.textContent = json.question;
    json.control.forEach(pushZero);
    json.football_player.forEach(pushZero);
    legend.innerHTML = "";
    json.football_player.forEach(addLegendEntry);
    createPieChart('#player_pie_chart', processAnswers(json.football_player));
    createPieChart('#public_pie_chart', processAnswers(json.control));
    revealPage();
}
function createPieChart(target, dataset) {
    var cw = document.body.clientWidth;
    var offset = cw/12;
    var padding = cw*.1;
    var data = { labels: dataset[0], series: dataset[1] };
    new Chartist.Pie(target, data, {
        labelOffset: offset,
        ignoreEmptyValues: true
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
        labels.push(answer.percent+"%");
        values.push(answer.percent);
    }
    return [labels, values];
}
function pushZero(answer) {
    if (answer.percent === 0) {
        answer.percent = 0;
    }
}
function addLegendEntry(answer, index) {
    var tr = document.createElement("tr");

    var colorCell = document.createElement("td");
    colorCell.className = "legendColor";

    var textCell = document.createElement("td");
    textCell.className = "legendText";

    tr.appendChild(colorCell);
    tr.appendChild(textCell);
    legend.appendChild(tr);

    var spanColor = document.createElement("span");
    spanColor.style.backgroundColor = COLORS[index];
    spanColor.innerHTML = "&#160;";
    colorCell.appendChild(spanColor);

    textCell.textContent = answer.answer;
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
function priorWeek(event) {
    event.preventDefault();
    event.stopPropagation();
    if (weekQuery.length === 1) {
        display(weekQuery.sessionToken);
        priorWeekLink.style.display = 'none';
    } else if (weekQuery.length > 1) {
        display(weekQuery.sessionToken);
    }
    window.scrollTo(0,0);
}
document.getElementById("priorWeek").addEventListener('click', priorWeek, false);

window.display = function(sessionToken) {
    weekQuery.sessionToken = sessionToken;
    var url = 'https://webservices.sagebridge.org/v3/reports/' + ID + weekQuery.shift();

    console.log("requesting week", url);
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.setRequestHeader("Bridge-Session", sessionToken);
    request.setRequestHeader("Content-Type", "application/json");
    request.addEventListener("abort", handleAbort);
    request.addEventListener("load", locateFirstWeek);
    request.send();
}

function locateFirstWeek(response) {
    if (event.target.status !== 200) {
        handleAbort(event);
    }
    var json = JSON.parse(event.target.response);
    if (json.items && json.items.length > 0) {
        handleLoad(json);
    } else {
        console.log("skipping this week... no data");
        display(weekQuery.sessionToken);
    }
}
window.onorientationchange = adjustScale;
window.addEventListener("resize", debounce(adjustScale, 100, false), true);
adjustScale();
