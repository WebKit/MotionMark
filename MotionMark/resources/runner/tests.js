var Headers = {
    testName: [
        {
            title: "<span onclick='benchmarkController.showDebugInfo()'>" + Strings.text.testName + "</span>",
            text: Strings.text.testName
        }
    ],
    score: [
        {
            title: Strings.text.score,
            text: Strings.json.score
        }
    ],
    details: [
        {
            title: "&nbsp;",
            text: function(data) {
                var bootstrap = data[Strings.json.complexity][Strings.json.bootstrap];
                return "<span>±" + (Statistics.largestDeviationPercentage(bootstrap.confidenceLow, bootstrap.median, bootstrap.confidenceHigh) * 100).toFixed(2) + "%</span>";
            }
        }
    ]
};

var Suite = function(name, tests) {
    this.name = name;
    this.tests = tests;
};

var Suites = [];

Suites.push(new Suite("MotionMark",
    [
        {
            url: "dev/stories/stories.html",
            name: "Stories"
        },
        {
            url: "dev/alice/alice.html",
            name: "Alice"
        },
        {
            url: "dev/chess/chess.html",
            name: "Chess"
        },
        {
            url: "dev/map-zoomer/map-zoomer.html",
            name: "Map Zoomer"
        },
        {
            url: "dev/sheets/sheets.html",
            name: "Sheets"
        },
        {
            url: "dev/departements/departements.html",
            name: "Départements"
        },
        {
            url: "dev/dashboard/dashboard.html",
            name: "Dashboard"
        },
        {
            url: "dev/filtering/filtering.html",
            name: "Filtering"
        },
    ]
));

function suiteFromName(name)
{
    return Suites.find(function(suite) { return suite.name == name; });
}

function testFromName(suite, name)
{
    return suite.tests.find(function(test) { return test.name == name; });
}
