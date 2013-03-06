// Taken from http://stackoverflow.com/a/3000784/29291
var Util = (function() {
    // Let's get a database
    var request = window.indexedDB.open("better_webwork", 1);
    var result;

    request.onerror = function(e) {
        alert("Better WebWorK cannot function without a database!");
    }

    request.onsuccess = function(e) {
        db = request.result;
    }

    // Set up the database
    request.onupgradeneeded = function(e) {

    }

    function trim(str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }

    return {
        trim: trim
    }
})();

var Webwork = (function() {
    var MONTHS = ["January", "Februrary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var set = undefined;
    var problem = undefined;

    function parseQuestionList() {
        /*
         * Score highlighting
         */
        $("table.problem_set_table tr td:nth-child(5)").each(function() {
            var re = /([0-9]*)\%/
            var text = $(this).text();
            var complete = parseInt(re.exec(text)[1]);

            // Highlight the scores
            if(complete < 25)
                $(this).addClass("bw_poor");
            else if(complete < 25)
                $(this).addClass("bw_okay");
            else
                $(this).addClass("bw_great");
        });
            
        /*
         * Relative due date
         */
        var date_re = /([0-9]{2})\/([0-9]{2})\/([0-9]{4}) at ([0-9]{2})\:([0-9]{2})(am|pm) ([A-Z]{3})/;
        var date_container = $("#info-panel-right b");
        var date_text = date_container.text();
        var results = date_re.exec(date_text);
        for(var i = 1; i <=5; i++) {
            results[i] = parseInt(results[i]);
        }

        // Convert hours to 24hr
        results[4] = (results[6] == "pm") ? results[4] + 12 : results[4];

        var date = new Date(results[3], results[1] - 1, results[2], results[4], results[5]);
        var now = new Date();
        var is = (date < now) ? "was" : "is";

        var date_display = $("<div class=\"bw_due\">This webwork " + is + " due <span id=\"bw_due_date\">" + moment(date).fromNow() + "</span>.</div>");
        date_container.after(date_display).text("");

        $("#bw_due_date").on("mouseover", function() {
            // Correct the minutes/hours
            var hours = (date.getHours() > 12) ? (date.getHours() - 12) : date.getHours();
            var ampm = (date.getHours() > 12) ? "pm" : "am";
            var minutes = (date.getMinutes() < 10) ? date.getMinutes() + "0" : date.getMinutes();

            $(this).text(MONTHS[date.getMonth()] + " " + date.getDate() + " at " + hours + ":" + minutes + ampm);
        });

        $("#bw_due_date").on("mouseout", function() {
            $(this).text(moment(date).fromNow());
        });

        if(date < now) {
            $("#bw_due_date").addClass("error");
        }

        /*
         * Total score
         */
        var score = 0;
        var total = 0;
        var problems = 0;
        $("table.problem_set_table tr:nth-child(n+2)").each(function() {
            var perc = parseInt($(this).children("td:nth-child(5)").text().replace("%", ""));
            var worth = parseInt($(this).children("td:nth-child(4)").text());
            
            score += perc * worth;
            total += 100 * worth;
            problems++;
        });

        var average = parseInt(score / total * 100);
        $("table.problem_set_table").append("<tr class=\"bw_average\" id=\"bw_average\"><td colspan=4>Overall:</td><td>" + average + "%</td></tr>");

        // Highlight the average
        var td = $("#bw_average td:nth-child(2)");
        if(average > 85)
            td.addClass("bw_great");
        else if(average > 65)
            td.addClass("bw_okay");
        else
            td.addClass("bw_poor");
    }

    function loadBetterBox() {
        $("<div class=\"bw_box\"></div>").load(chrome.extension.getURL("box.html")).appendTo("body");
    }

    return {
        set: set,
        problem: problem,
        parseQuestionList: parseQuestionList,
        loadBetterBox: loadBetterBox
    }
})();

$(document).ready(function() {
    // We only need to run on a question page for now
    var problem_re = /([0-9]*)\: Problem ([0-9]*)/;
    var set_re = /([0-9]*)/;
    var status = Util.trim($("#content").children("span:first-child").text());

    if(status.match(problem_re)) { 
        var results = problem_re.exec(status);
        Webwork.problem = parseInt(results[2]);
        Webwork.set = parseInt(results[1]);
        Webwork.loadBetterBox();
    }
    else if(status.match(set_re)) {
        Webwork.parseQuestionList();
        var results = set_re.exec(status);
        Webwork.set = parseInt(results[1]);
    }
});
