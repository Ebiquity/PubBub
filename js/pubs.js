// (c) 2012 Ben Bederson @ University of Maryland
// Human-Computer Interaction Lab
// http://www.cs.umd.edu/~bederson
// See BSD License: http://www.cs.umd.edu/~bederson/LICENSE.txt

// Data
var pubData = null;
var keywordData = [];
var authorData = [];
var showFullCitation = true;
var groupBy = GROUP_YEAR;
var queryText = "";
var keywordFilter = NO_KEYWORD_FILTER;
var authorFilter = null;
var authorTypeFilter = null;
var minYearFilter;
var maxYearFilter;
var onePubToDisplay = null;
var displayPubsCallback = null;
var displayCheck = true;
var limitNumPubs = 10000;
var min_year;
var max_year;

function clearFilters() {
	keywordFilter = NO_KEYWORD_FILTER;
	authorFilter = null;
	$("#search_box").val("");
	queryText = "";
	changeAuthorTypeFilter(null);
	$("#no_keyword_filter").click();
	resetYearButtons();
	onePubToDisplay = null;

	displayPubs();
	redisplayVis();
}

function initEventHandlers() {
	// Citation buttons
	$("#citation_link").click(function() {
		$("#citation_button").click();
	});
	$("#citation_button").click(function() {
		showFullCitation = !showFullCitation;
		displayPubs();
	});

	
	// Grouping buttons
	$(".group_link").click(function() {
		$(this).prev().click();
	});
	$("#year_button").click(function() {
		pubData.sort(function(pub1, pub2) {
			return pub2.pub_year - pub1.pub_year;
		});
		groupBy = GROUP_YEAR;
		displayPubs();
	});
	$("#venue_type_button").click(function() {
		pubData.sort(function(pub1, pub2) {
			if (PUB_TYPES[pub1.pub_type] < PUB_TYPES[pub2.pub_type]) {
				return -1;
			} else if (PUB_TYPES[pub1.pub_type] > PUB_TYPES[pub2.pub_type]) {
				return 1;
			} else {
				return pub2.pub_year - pub1.pub_year;
			}
		});
		groupBy = GROUP_VENUE_TYPE;
		displayPubs();
	});


	// Filter buttons
	$(".filter_link").click(function() {
		$(this).prev().click();
	});
	$(".filter_button").click(function() {
		keywordFilter = $(this).attr("keyword");
		displayPubs();
		changeKeywordFilter(keywordFilter, queryText);
	});

	// Search support
	$("#search_box").keyup(function() {
		queryText = $(this).val();
		displayPubs();
		changeKeywordFilter(keywordFilter, queryText);
		redisplayVis();
	});

	$(window).resize(function() {
		onresize();
	});
}

function changeAuthorFilter(authorObj) {
	authorFilter = authorObj;
	displayPubs();
	redisplayVis();
}

function keywordsLoaded(data) {
    var keywordObj;
    data = JSON.parse(data);
	// Index keyword array by keyword id
	for (var i in data) {
        if (data.hasOwnProperty(i)) {
            keywordObj = data[i];
            keywordObj.pubs = [];
            keywordObj.min_year = 9999;
            keywordObj.max_year = 0;
            keywordObj.toString = function () {
                return this.keyword;
            };
            keywordData[keywordObj.id] = keywordObj;
        }
	}
}

function processKeywordData() {
	for (var pi in pubData) {
        if (pubData.hasOwnProperty(pi)) {
            var pubObj = pubData[pi];
            var year = pubObj.pub_year;
            if (year < min_year) {
                min_year = year;
            }
            if (year > max_year) {
                max_year = year;
            }
            for (var ki in pubObj.keywords) {
                if(pubObj.keywords.hasOwnProperty(ki)) {
                    var keywordObj = pubObj.keywords[ki];
                    keywordObj.pubs.push(pubObj);
                    if (year < keywordObj.min_year) {
                        keywordObj.min_year = year;
                    }
                    if (year > keywordObj.max_year) {
                        keywordObj.max_year = year;
                    }
                }
            }
        }
	}
	
	minYearFilter = min_year;
	maxYearFilter = max_year;

    // Remove empty 0-index item
	keywordData.splice(0, 1);
    displayKeywords();
	
	// Sort keywords by min year for display
	keywordData.sort(function(k1, k2) {
		return k1.min_year - k2.min_year;
	});
}

// Generate HTML for keyword filters
function displayKeywords() {
    keywordData.sort();
	var checked;
	var keyword;
	var str = genKeywordEntry(" checked", 'no_keyword_filter', NO_KEYWORD_FILTER, 0);
	for (i in keywordData) {
        if (keywordData.hasOwnProperty(i)) {
            var keywordObj = keywordData[i];
            keyword = keywordObj.keyword;
            checked = "";
            str += genKeywordEntry(checked, keyword, keyword, keywordObj.pubs.length);
        }
    }
	
	$("#filter").html(str);	
}

function genKeywordEntry(checked, id, keyword, length) {
	var re = new RegExp(" ", "g");
	var entry = "<input id='" + id.replace(re, "_") + "' class='filter_button' keyword='" + keyword + "' type='radio' name='filter'" + checked + "> ";
	entry += "<a class='filter_link' href='javascript:;'>" + keyword;
	if (length > 0) {
		entry += " <font size='1'>(" + length + ")</font>";
	}
	entry += "</a></input><br>";
	return entry;
}


function authorsLoaded(data) {
    data = JSON.parse(data);
	for (var x in data) {
        if(data.hasOwnProperty(x)) {
            var author = data[x];
            author.name = author.last_name;
            authorData[author.id] = author;
        }
	}
}

function pubsLoaded(data) {
	pubData = JSON.parse(data);
    var y;
	for (var x in pubData) {
        if(pubData.hasOwnProperty(x)) {
            var pub = pubData[x];

            // Process authors
            var authorURLs = pub.authors;
            var newAuthors = [];
            for (y in authorURLs) {
                if(authorURLs.hasOwnProperty(y)) {
                    var authorID = authorURLs[y];
                    newAuthors.push(authorData[authorID]);
                }
            }
            pub.authors = newAuthors;

            // Process keywords
            var keywordURLs = pub.keywords;
            var newKeywords = [];
            for (y in keywordURLs) {
                if(keywordURLs.hasOwnProperty(y)) {
                    var keywordID = keywordURLs[y];
                    newKeywords.push(keywordData[keywordID]);
                }
            }
            pub.keywords = newKeywords;

            // Process year
            pub.pub_year = parseInt(pub.pub_year);
        }
	}
	
	processKeywordData();
	//displayKeywords();
}

function mark_pub_for_display(pub) {
    pub.display = pub.publish
        && pub.satisfiesSearch
        && pub.satisfiesKeywordFilter
        && pub.satisfiesAuthorFilter
        && pub.satisfiesAuthorTypeFilter
        && pub.satisfiesYearFilter;
}


function clearNumPubs(dataset) {
    var x;
    for (x in  dataset) {
        if(dataset.hasOwnProperty(x)) {
            dataset[x].numPubs = 0;
        }
    }
}

function clearSelected(dataset) {
    var x;
    for (x in  dataset) {
        if(dataset.hasOwnProperty(x)) {
            dataset[x].selected = false;
        }
    }
}


function selectPubToDisplay(dataset, selectedPub) {

    for (var x in dataset) {
        if(dataset.hasOwnProperty(x)) {
            var pub = dataset[x];
            if (pub === selectedPub) {
                pub.display = true;
                for (var z in pub.authors) {
                    if(pub.authors.hasOwnProperty(z)) {
                        var authorObj = pub.authors[z];
                        authorObj.selected = true;
                        authorObj.numPubs++;
                    }
                }
            } else {
                pub.display = false;
            }
        }
    }
}


function isSatisfiesSearch(pub, query, use_citation) {
    var textToSearch;
    var lowerCaseQuery = query.toLowerCase();

    if (use_citation) {
        textToSearch = pub.citation;
    } else {
        textToSearch = pub.title;
    }

    return (lowerCaseQuery === "") ||
           (textToSearch.toLowerCase().indexOf(lowerCaseQuery) !== -1);
}


function selectMatchingKeywords(pub, kwFilterMatcher, filter) {
    for (var y in pub.keywords) {
        if (pub.keywords.hasOwnProperty(y)) {
            var keywordObj = pub.keywords[y];
            if (kwFilterMatcher(keywordObj, filter)) {
                keywordObj.selected = true;
            }
        }
    }
}


function selectMatchingAuthors(pub, authType) {
    for (var z in pub.authors) {
        if(pub.authors.hasOwnProperty(z)) {
            var authorObj = pub.authors[z];
            if (authorObj !== undefined &&
                ((authType === null) || (authType === authorObj.author_type))) {
                pub.satisfiesAuthorTypeFilter = true;
                authorObj.selected = true;
                authorObj.numPubs++;
            }
        }
    }
}


function updatePubs() {
    var x;
    var pub, satisfiesKeywordFilter;

    var kwFilterMatcher = function(kwObj,filt){
        var rv = kwObj.keyword === filt;
        if (rv) {
            satisfiesKeywordFilter = true;
        }
        return rv;
    };

    var defaultMatcher = function(kwObj,filt){
        return true;
    };

	// Manage selection for visualization
    clearNumPubs(authorData);
    clearSelected(authorData);
    clearSelected(keywordData);

	if (onePubToDisplay !== null) {
		selectPubToDisplay(pubData, onePubToDisplay);
		return;
	}


	
	for (x in pubData) {
        if(pubData.hasOwnProperty(x)) {
            pub = pubData[x];

            var satisfiesSearch = isSatisfiesSearch(pub, queryText, showFullCitation);


            if (keywordFilter === NO_KEYWORD_FILTER) {
                satisfiesKeywordFilter = true;
                if (satisfiesSearch) {
                    selectMatchingKeywords(pub, defaultMatcher, keywordFilter);
                }
            } else {
                satisfiesKeywordFilter = false;
                selectMatchingKeywords(pub, kwFilterMatcher, keywordFilter);
            }

            pub.satisfiesYearFilter = (pub.pub_year >= minYearFilter) && (pub.pub_year <= maxYearFilter);

            // Side effect for visualization
            pub.satisfiesAuthorTypeFilter = false;
            if (authorFilter === null || pub.authors.indexOf(authorFilter) !== -1) {
                pub.satisfiesAuthorFilter = true;
                if (satisfiesSearch && satisfiesKeywordFilter && pub.satisfiesYearFilter) {
                    selectMatchingAuthors(pub, authorTypeFilter);
                }
            } else {
                pub.satisfiesAuthorFilter = false;
            }

            pub.satisfiesSearch = satisfiesSearch;
            pub.satisfiesKeywordFilter = satisfiesKeywordFilter;

            mark_pub_for_display(pub);
        }
    }
}

function displayOnlyPub(onePub) {
	onePubToDisplay = onePub;
	displayPubs();
	redisplayVis();
}

function getGrouping(pub, pub_grouping, pub_list, grouping) {
    var this_grouping = "<span class='pub_heading'>";
    if (grouping === GROUP_YEAR) {
        this_grouping += pub.pub_year;
    } else if (grouping === GROUP_VENUE_TYPE) {
        this_grouping += PUB_TYPES[pub.pub_type];
    }

    this_grouping += "</span>";
    if (pub_grouping !== this_grouping) {
        // First year
        if (pub_grouping === "") {
            pub_list += this_grouping + "<ol>";
        } else {
            pub_list += "</ol>" + this_grouping + "<ol>";
        }
        pub_grouping = this_grouping;
    }
    return {pub_grouping: pub_grouping, str: pub_list};
}

function getPubLink(pub, full_citation, query) {
    var html;
    if (full_citation) {
        html = hiliteSearchTerms(pub.citation, query);
    } else {
        html = "<b><a href='" + pub.url + "' target='_blank'>" + hiliteSearchTerms(pub.title, query) + "</a></b>";
    }
    return html;
}

function addPubToList(prev, html, pub) {
    prev += "<li>" + html;
    if (pub.award ) {
        prev += " <span class='pub_award'>" + pub.award + ".</span>";
    }
    if ( pub.pdf ) {
        prev += " [<a href='" + pub.pdf + "' target='_blank'>pdf</a>]";
    }
    return prev;
}


function gen_pub_header(num_papers, with_author) {
    var pubHeader = num_papers + " Publications";
    if (with_author !== null) {
        pubHeader += " with " + with_author.last_name;
    }
    pubHeader += "<br><br>";
    return pubHeader;
}

function displayPubs() {
	var str = "<div id='num_papers' class='pub_heading'></div>";
	var pub_grouping = "";
	var num_papers = 0;
    updatePubs();
	for (var x in pubData) {
        if(pubData.hasOwnProperty(x)) {
            var pub = pubData[x];
            // Generate HTML for display
            if (!displayCheck || pub.display) {
                num_papers++;
                if (displayPubHeaders) {
                    var grouping = getGrouping(pub, pub_grouping, str, groupBy);
                    pub_grouping = grouping.pub_grouping;
                    str = grouping.str;
                } else {
                    if (num_papers === 1) {
                        str += "<ul>";
                    }
                }
                str = addPubToList(str, getPubLink(pub, showFullCitation, queryText), pub);
            }
            if (num_papers >= limitNumPubs) {
                break;
            }
        }
	}
	if (displayPubHeaders) {
		str += "</ol>";
	} else {
		str += "</ul>";
	}
	
	var pubs = $("#pubs");
	pubs.html(str);
	if (displayPubHeaders) {
        var pubHeader = gen_pub_header(num_papers, authorFilter);
        $("#num_papers").html(pubHeader);
	}

	updateFillerHeight();
	if (displayPubsCallback !== null) {
		displayPubsCallback(authorFilter, num_papers);
	}
}

function updateFillerHeight() {
	var content = $("#content");
	var bottom = content.position().top + content.height();
	var filler = $("#vertical_filler");
	var h = bottom - filler.position().top;
	filler.height(h);	
}

function hiliteSearchTerms(str, queryText) {
    var hStr;
	if (queryText.length > 0) {
		var re = new RegExp(queryText, "g");
		hStr = str.replace(re, "<span class='query_hilite'>" + queryText + "</span>");
	} else {
        hStr = str;
    }
	
	return hStr;
}

function onresize() {
	$("#content").width($("#pagecell").width() - (250 + 20));
	updateFillerHeight();
	redisplayVis();
}
