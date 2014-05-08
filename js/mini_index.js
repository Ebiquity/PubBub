// (c) 2012 Ben Bederson @ University of Maryland
// Human-Computer Interaction Lab
// http://www.cs.umd.edu/~bederson
// See BSD License: http://www.cs.umd.edu/~bederson/LICENSE.txt

// Initial # pub items
var initNumPubs = 1000;
var displayPubHeaders = false;
var rawAuthorData;
var rawKeywordData;
var rawPubData;

function initEventHandlers() {
	$(window).resize(function() {
		onresize();
	});
}

function onresize() {
	updateFillerHeight();
}


function updateFillerHeight() {
	var content = $("#content");
	var bottom = content.position().top + content.height();
	var filler = $("#vertical_filler");
	var h = bottom - filler.position().top;
	filler.height(h);
}

function loadPubs(limit) {
	displayPubsCallback = function(authorFilter, numPubs) {
		if (authorFilter === null) {
			$("#pubs_title").html(numPubs + " publications");
		} else {
			$("#pubs_title").html(numPubs + " publications with " + authorFilter.last_name);
		}
	};

	var url = baseServerURL + "/vizdata/pubs.txt" ;
	loadUrl(url, homePubsLoaded);
}

function homePubsLoaded(data) {
	pubData = JSON.parse(data);
	displayCheck = false;
	displayPubs();
	$("#full-pub-list").html("<a href='papers/index.html'>Full publication list ...</a>");


	var authorURL = baseServerURL + "/vizdata/authors.txt";
	var keywordURL = baseServerURL + "/vizdata/keywords.txt";
	var pubURL = baseServerURL + "/vizdata/pubs.txt";
    // Number of items that need to complete loading before displaying vis
    var itemsToLoad = 3;

    loadUrl(authorURL, function(data) {
        rawAuthorData = data;
        itemsToLoad--;
        onVisDataLoaded(itemsToLoad);
    });
    loadUrl(keywordURL, function(data) {
        rawKeywordData = data;
        itemsToLoad--;
        onVisDataLoaded(itemsToLoad);
    });
    loadUrl(pubURL, function(data) {
        rawPubData = data;
        itemsToLoad--;
        onVisDataLoaded(itemsToLoad);
    });
}

function onVisDataLoaded(itemsToLoad) {
    // Don't display vis until all data loaded
    if (itemsToLoad === 0) {
	papersDisplayVis();
    }
}

function papersDisplayVis() {
    keywordsLoaded(rawKeywordData);
    authorsLoaded(rawAuthorData);
    pubsLoaded(rawPubData);
	displayCheck = true;
	updatePubs();
	createVis(300, "small", false);
	initEventHandlers();
	updateFillerHeight();		
}

$(document).ready(function() {
	limitNumPubs = initNumPubs;
	loadPubs(initNumPubs);
});
