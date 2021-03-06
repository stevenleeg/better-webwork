/*
 * Better WeBWorK
 * Making WeBWorK less shitty!
 * ---------------
 * (C) 2013 Steve Gattuso and all contributors
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
    var page = undefined;
    var _due_date;

    /*
     * Handles storing/getting localStorage data
     */
    function setDataGet(key) {
        return localStorage.getItem("s" + set + "." + key);
    }

    function setDataSet(key, val) {
        return localStorage.setItem("s" + set + "." + key, val);
    }

    /*
     * Calculates the number of problems you'll need to do today
     * in order to stay on schedule.
     */
    function calculateScheduler(blank) {
        // Count how many days we have until the due date
        var per_day = parseInt(setDataGet("per_day"));
        var date = getDueDate();
        var now = new Date();
        var last = new Date(setDataGet("last_update"));

        if(now.getMonth() != last.getMonth() || now.getDate() != last.getDate()) {
            var due = new Date(setDataGet("due"));
            var diff = due.getTime() - now.getTime();
            var days = Math.round(diff / (1000 * 60 * 60 * 24));
            var per_day = 0;
            if(days == 0)
                per_day = blank;
            else
                per_day = Math.ceil(blank / days);

            setDataSet("last_update", new Date());
            setDataSet("per_day", per_day);
        }

        return per_day;
    }

    function getDueDate() {
        // Try to get the cached date
        if(_due_date != undefined)
            return _due_date;

        if(page != "set")
            return setDataGet("due");

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

        // Store it
        setDataSet("due", _due_date);

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

        var per_day = calculateScheduler(blank);

        $("#bw_due").append("<p>Complete <b>" + per_day + " problems</b> per day to finish on time.</p>");
    }

    /*
     * Grabs data from the set list so we can show some of it
     * on the question page as well
     */
    function storeQuestionData() {
        var total = -1;
        var blank = 0;
        var scores = {};
        $("table.problem_set_table tr:nth-child(n+2)").each(function() {
            var perc = parseInt($(this).children("td:nth-child(5)").text().replace("%", ""));
            if(perc == 0)
                blank++;

            // Get the current problem number
            var problem = $(this).children("td:nth-child(1)").text().match(/Problem ([0-9]*)/);
            if(problem != null)
                scores[problem[1]] = perc;
            total++;
        });
        
        // Count how many days we have until the due date
        var date = getDueDate();
        var now = new Date();
        var last = new Date(setDataGet("last_update"));

        setDataSet("total", total);
        setDataSet("blank", blank);
        setDataSet("scores", JSON.stringify(scores));
        setDataSet("due", getDueDate());
    }

    function augmentQuestionList() {
        // Assign the set number 
        set = parseInt($("#content span:nth-child(1)").text().match(/\s*([0-9]*)(.*)/)[1]);
        page = "set";

        relativeDueDate();
        workScheduler();
        highlightScore();
        totalScore();
        storeQuestionData();
    }

    function loadBetterBox() {
        var total = setDataGet("total");
        var blank = parseInt(setDataGet("blank"));
        var scores = JSON.parse(setDataGet("scores"));

        // Was a problem just completed?
        var score_summary = $("div.scoreSummary").text();
        var score_text = score_summary.match(/Your overall recorded score is ([0-9]{1,3})\%/);
        var score = 0;
        if(score_text != null)
            score = parseInt(score_text[1]);
        console.log("Your score: " + score);
        if(score == 100 && scores[problem] != 100) {
            blank--;
            console.log("Let's DO ITTTT");
            scores[problem] = score;

            setDataSet("scores", JSON.stringify(scores));
            setDataSet("blank", blank);
            setDataSet("per_day", per_day);
        }
        
        var per_day = calculateScheduler(blank);

        $("<div class=\"bw_box\"></div>").appendTo("body").load(chrome.extension.getURL("box.html"), function() {
            $("#remaining").text(per_day);
        });
    }

    function augmentQuestionPage() {
        // Assign set and problem data
        set = parseInt($("#content span:nth-child(1)").text().match(/\s*([0-9]*)(.*)/)[1]);
        problem = parseInt($("#content span:nth-child(1)").text().match(/Problem ([0-9]*)/)[1]);
        page = "question";

        loadBetterBox();
    }

    return {
        augmentQuestionList: augmentQuestionList,
        augmentQuestionPage: augmentQuestionPage
    }
})();

$(document).ready(function() {
    // We only need to run on a question page for now
    var problem_re = /([0-9]*)\: Problem ([0-9]*)/;
    var set_re = /^([0-9]*)\s*Up$/;
    var status = Util.trim($("#content").children("span:first-child").text());

    if(status.match(problem_re)) { 
        var results = problem_re.exec(status);
        Webwork.problem = parseInt(results[2]);
        Webwork.set = parseInt(results[1]);
        Webwork.augmentQuestionPage();
    }
    else if(status.match(set_re)) {
        Webwork.augmentQuestionList();
        var results = set_re.exec(status);
        Webwork.set = parseInt(results[1]);
    }
});
