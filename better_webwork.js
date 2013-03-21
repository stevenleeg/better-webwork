/*
 * Better WeBWorK
 * Making WeBWorK less shitty!
 * ---------------
 * (C) 2013 Steve Gattuso
 * <steve@stevegattuso.me>
 */
var Util = (function() {
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
    var _due_date;

    function getDueDate() {
        // Try to get the cached date
        if(_due_date != undefined)
            return _due_date;

        var date_container = $("#info-panel-right");
        var date_re = /([0-9]{2})\/([0-9]{2})\/([0-9]{4}) at ([0-9]{2})\:([0-9]{2})(am|pm) ([A-Z]{3})/;
        var results = date_re.exec(date_container.text());
        if (results) {
            results = results.map(Number);
        } else {
            // Unable to find a due date, so default to present
            _due_date = new Date();
            return _due_date;
        }
        if (results[6] == "pm") results[4] += 12;
        _due_date = new Date(results[3], results[1] - 1, results[2], results[4], results[5]);
        return _due_date;
    }

    function highlightScore() {
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
    }

    function relativeDueDate() {
        var date_container = $("#info-panel-right b");
        var date = getDueDate();
        var now = new Date();
        var is = (date < now) ? "was" : "is";
        var diff = date.getTime() - now.getTime();
        var days = Math.round(diff / (1000 * 60 * 60 * 24));
        var color_class = "";
        if(date < now)
            color_class += "bw_poor_text";
        else if(days == 0)
            color_class += "bw_poor_text";

        var date_display = $("<div id=\"bw_due\" class=\"bw_due\">This webwork " + is + " due <span id=\"bw_due_date\" class=\"" + color_class + "\">" + moment(date).fromNow() + "</span>.</div>");
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
    }

    function totalScore() {
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

    function workScheduler() {
        var blank = 0;
        $("table.problem_set_table tr:nth-child(n+2)").each(function() {
            var perc = parseInt($(this).children("td:nth-child(5)").text().replace("%", ""));
            if(perc == 0)
                blank++;
        });

        // Count how many days we have until the due date
        var date = getDueDate();
        var now = new Date();
        var diff = date.getTime() - now.getTime();
        var days = Math.round(diff / (1000 * 60 * 60 * 24));
        var per_day = 0;
        if(days == 0)
            per_day = blank;
        else
            per_day = Math.ceil(blank / days);

        $("#bw_due").append("<p>Complete <b>" + per_day + " problems</b> per day to finish on time.</p>");
    }

    function augmentQuestionList() {
        relativeDueDate();
        workScheduler();
        highlightScore();
        totalScore();
    }

    function loadBetterBox() {
        $("<div class=\"bw_box\"></div>").load(chrome.extension.getURL("box.html")).appendTo("body");
    }

    return {
        augmentQuestionList: augmentQuestionList
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
        Webwork.augmentQuestionList();
        var results = set_re.exec(status);
        Webwork.set = parseInt(results[1]);
    }
});
