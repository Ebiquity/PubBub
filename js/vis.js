// (c) 2012 Ben Bederson @ University of Maryland
// Human-Computer Interaction Lab
// http://www.cs.umd.edu/~bederson
// See BSD License: http://www.cs.umd.edu/~bederson/LICENSE.txt

var ME = "Finin";

var svg;
var svg_w;
var svg_h;
var bars_h = 300;
var xAxis;
var min_year = 9999;
var max_year = 0;
var fill = d3.scale.category20().domain(AUTHOR_TYPE_INDEXES);
var deselectedFill = "#eee";
var selectedFill = "#60afe9";
var deselectedText = "gray";
var selectedText = "black";
var unselectedBar = "#60aFe9";
var armedStroke = "orangered";
var textSize = "large";
var displayExtras = true;
var barxscale;
var barActiveYearButton = -1;
var barMinYearX;
var barMaxYearX;
var barDX;
var onePubToDisplay;

function createVis(height, requestedTextSize, shouldDisplayExtras) {
	displayExtras = shouldDisplayExtras;

	var vis = $("#vis");
	vis.html("");
	svg_w = vis.width();
	svg_h = height;
	textSize = requestedTextSize;

	svg = d3.select("#vis").append("svg:svg")
		.attr("id", "svg")
	    .attr("width", svg_w)
	    .attr("height", svg_h);

	svg.append("svg:rect")
		.attr("width", svg_w)
		.attr("height", svg_h)
		.style("fill", "white")
		.on("click", function() {
			changeAuthorFilter(null);
		});

    var svgParent = $("#svg").parent();
    if (displayExtras) {
		svgParent.prepend("<button style='position:absolute; left:10px' onclick='clearFilters()'>Reset</button>");

		xAxis = d3.svg.axis()
			.tickSize(20, 0, 4)
			.tickSubdivide(0)
			.tickFormat(d3.format("d"));
		svg.append("svg:g")
			.attr("id", "x_axis");

		svgParent.append("<button style='position:absolute; left:10px; top:" + (height-40) + "px;' onclick='window.open(\"http://hci-user-advocate.blogspot.com/2012/09/d3-visualization-of-all-my-publications.html\", \"_blank\")'>About</button>");
	} else {
		svgParent.prepend("<button onclick='clearFilters()'>Reset</button>");
  }

	displayBars();
	displayAuthors();
	displayLegend();
}

function redisplayVis() {
	svg_w = $("#vis").width();
	svg.attr("width", svg_w);
	displayBars();
	displayAuthors();
	displayLegend();
}

function changeKeywordFilter(keywordFilter, queryText) {
	redisplayVis();

	var keywords = d3.selectAll("g.keyword");
	// Reset display
	if ((keywordFilter === NO_KEYWORD_FILTER) && (queryText === "")) {
		keywords.selectAll("text")
			.transition()
			.style("fill", selectedText);
		keywords.selectAll("rect")
			.transition()
			.style("fill", unselectedBar);
		return;
	}

	// Update keyword display
	var filteredKeywords = keywords.filter(function(d) {
		return d.selected;
	});
	keywords.selectAll("rect")
		.transition()
		.style("fill", deselectedFill);
	keywords.selectAll("text")
		.transition()
		.style("fill", deselectedText);
	filteredKeywords.selectAll("rect")
		.transition()
		.style("fill", selectedFill);
	filteredKeywords.selectAll("text")
		.transition()
		.style("fill", selectedText);
}

function changePaperFilter(paperFilter) {
	redisplayVis();
}

function changeYearFilter(min, max) {
	if ((min !== minYearFilter) || (max !== maxYearFilter)) {
		minYearFilter = min;
		maxYearFilter = max;
		displayPubs();
		redisplayVis();
	}
}

function displayBars() {
	if (!displayExtras) {
		return;
	}

	var x = d3.scale.linear()
		.domain([min_year, max_year+1])
		.rangeRound([270, svg_w-40]);
	var y = d3.scale.ordinal()
		.domain(keywordData)
		.rangeBands([40, bars_h], 0.1);
	var barHeight = y.rangeBand();
	barxscale = x;

	// Bar Selection
	bars = svg.selectAll("g.keyword")
		.data(keywordData);

	// Groups
	groups = bars.enter().append("svg:g")
		.attr("class", "keyword")
		.attr("transform", function(d) {
			var dy = y(d.keyword);
			return "translate(" + 0 + "," + dy + ")";
		});

	// Create bar background rectangles
	groups
		.append("svg:rect")
		.attr("class", "key_bgnd")
		.style("stroke-width", 3);
	// Update bar rectangles
	bars.selectAll(".key_bgnd")
		.attr("x", function(d) { return x(d.min_year - 0.1); })
		.attr("width", function (d) { return x(d.max_year + 1.2) - x(d.min_year); })
		.attr("height", barHeight);

	// Create bar labels
	groups.append("svg:text")
		.attr("class", "key_label")
		.attr("y", function(d) { return 0; })
		.attr("dx", 5)
		.attr("dy", 14)
		.attr("text-anchor", "start")
		.text(function(d) { return d.keyword + " (" + d.pubs.length + ")"; });

	// Update bar labels
	bars.selectAll(".key_label")
		.attr("x", function(d) { return x(d.min_year - 0.05); });

	// Create bar foreground rectangles
	groups
		.append("svg:rect")
		.attr("class", "key_fgnd");
	groups.append("svg:title")
		.attr("class", "key_title")
		.text(function(d) { return d.keyword + " (" + d.pubs.length + ")"; });
	// Update bar rectangles
	bars.selectAll(".key_fgnd")
		.attr("x", function(d) { return x(d.min_year - 0.1); })
		.attr("width", function (d) { return x(d.max_year + 1.2) - x(d.min_year); })
		.attr("height", barHeight)
		.style("opacity", 0)
		.on("mouseover", barMouseoverHandler)
		.on("mouseout", barMouseoutHandler)
		.on("click", barClickHandler);

	// Create bar dots
	dots = groups.selectAll("g.key_dot")
		.data(function(d) { return d.pubs; });
	dots.enter().append("svg:circle")
		.attr("class", "key_dot")
		.attr("r", 6)
		.attr("cy", function(d, i) { return Math.floor(barHeight / 2) + 1; })
		.on("mouseover", dotmouseover)
		.on("mouseout", dotmouseout)
		.on("click", dotclick);
	// Update bar dots
	bars.selectAll(".key_dot")
		.attr("display", function(d) { return d.display; })
		.attr("cx", function(d) {
			var month_offset = 0;
			if (d.pub_month != "") {
				month_offset = (d.pub_month - 1) / 12;
			}
			return x(d.pub_year + month_offset);
		});

	// Update the x-axis
	xAxis.scale(x);
	svg.select("#x_axis")
		.call(xAxis);

	// Year range slider
	svg.selectAll("#year_bar")
		.data([0])
		.enter()
		.append("svg:rect")
		.attr("id", "year_bar")
		.attr("x", 0)
		.attr("y", 4)
		.attr("width", 0)
		.attr("height", 10);
	svg.selectAll(".year_button")
		.data([minYearFilter, maxYearFilter+1])
		.enter()
		.append("svg:path")
		.attr("class", "year_button")
		.attr("d", "M-7,4L-7,15L0,22L7,15L7,4L-7,4")
		.attr("id", function(d, i) { return i == 0 ? "min_year" : "max_year"; })
		.attr("selected", "false")
		.attr("y", 4)
		.on("mouseover", yearMouseoverHandler)
		.on("mouseout", yearMouseoutHandler)
		.on("mousedown", yearMousedownHandler);
	yearSetX(0, x(minYearFilter));
	yearSetX(1, x(maxYearFilter+1));
}

function dotmouseover(d) {
	d3.select(this).attr("armed", true);
	var url = baseServerURL + "pubs/thumb/" + d.id + "/";
	d3.select("#svg").append("svg:rect")
		.attr("id", "pub-image-bgnd")
		.attr("x", "0")
		.attr("y", "0")
		.attr("width", "300")
		.attr("height", "350")
		.style("fill", "white");
	d3.select("#svg").append("svg:image")
		.attr("id", "pub-image")
		.attr("x", "0")
		.attr("y", "0")
		.attr("width", "300")
		.attr("height", "350")
		.attr("xlink:href", url);
}

function dotmouseout(d) {
	d3.select(this).attr("armed", null);
	d3.select("#pub-image-bgnd").remove();
	d3.select("#pub-image").remove();
}

function dotclick(d) {
	displayOnlyPub(d);
}

function resetYearButtons() {
	d3.select("#min_year")
		.attr("x", function() { return barxscale(minYearFilter); });
	d3.select("#max_year")
		.attr("x", function() { return barxscale(maxYearFilter+1); });
	changeYearFilter(min_year, max_year);
}

function yearSetX(i, x) {
    var btn;
	if (i === 0) {
		barMinYearX = x;
		btn = d3.select("#min_year");
	} else {
		barMaxYearX = x;
		btn = d3.select("#max_year");
	}
	btn.attr("transform", function(d) {
        return "translate(" + x + ",0)";
    });

	if ((barMinYearX !== undefined) && (barMaxYearX !== undefined)) {
		d3.select("#year_bar")
			.attr("x", barMinYearX+7)
			.attr("width", (barMaxYearX - barMinYearX - 13));
	}
}

function yearGetX(i) {
    var x;
	if (i === 0) {
		x = barMinYearX;
	} else {
		x = barMaxYearX;
	}
	return x;
}

function yearMouseoverHandler() {
	if (barActiveYearButton === -1) {
		d3.select(this).style("stroke", armedStroke);
	}
}

function yearMouseoutHandler() {
	var selected = d3.select(this).attr("selected");
	if (selected === "false") {
		d3.select(this).style("stroke", null);
	}
}

function yearMousedownHandler(d, i) {
	onePubToDisplay = null;
	d3.select(this).attr("selected", "true");
	var mousex = d3.mouse($("#svg")[0])[0];
	barDX = mousex - yearGetX(i);
	barActiveYearButton = i;
	d3.select("#svg").on("mousemove", yearMousemoveHandler);
	d3.select("#svg").on("mouseup", yearMouseupHandler);
}

function yearMousemoveHandler() {
	var mousex = d3.mouse($("#svg")[0])[0];
	var newx = mousex - barDX;

	var new_min_year = minYearFilter;
	var new_max_year = maxYearFilter;
	if (barActiveYearButton === 0) {
		// Dragging min year button
		if (newx > (barMaxYearX - 16)) {
			newx = barMaxYearX - 16;
		}
        new_min_year = Math.floor(barxscale.invert(newx));
	} else {
		// Dragging max year button
		if (newx < (barMinYearX + 16)) {
			newx = barMinYearX + 16;
		}
        new_max_year = Math.ceil(barxscale.invert(newx));
	}

	yearSetX(barActiveYearButton, newx);
	changeYearFilter(new_min_year, new_max_year);
}

function yearMouseupHandler() {
	var btn;
	if (barActiveYearButton == 0) {
		btn = d3.select("#min_year");
	} else {
		btn = d3.select("#max_year");
	}
	barActiveYearButton = -1;
	btn.attr("selected", "false");
	d3.select("#svg").on("mousemove", null);
	d3.select("#svg").on("mouseup", null);
}

function barMouseoverHandler() {
	var bgnd = this.parentNode.firstChild;
	d3.select(bgnd).style("stroke", armedStroke);
}

function barMouseoutHandler() {
	var bgnd = this.parentNode.firstChild;
	d3.select(bgnd).style("stroke", null);
}

function barClickHandler(d) {
	onePubToDisplay = null;
	var re = new RegExp(" ", "g");
	$("#" + d.keyword.replace(re, "_")).click();
}

function displayLegend() {
	if (!displayExtras) {
		return;
	}

	var data = AUTHOR_TYPE_INDEXES;
	var barX = svg_h;
    var barWidth, barHeight, textOffset;
	if (textSize === "small") {
		barWidth = 77;
		barHeight = 18;
		textOffset = 4;
	} else {
		barWidth = 93;
		barHeight = 20;
		textOffset = 4;
	}
	var numTypes = data.length;
	var groups = svg.selectAll(".legend_group")
		.data(data)
		.enter()
			.append("svg:g")
			.attr("class", "legend_group")
			.attr("transform", function(d, i) { return "translate("+barX+","+(svg_h - (numTypes * barHeight) + (barHeight * i))+")"; });
	groups.append("svg:rect")
		.attr("class", "legend_bgnd")
		.attr("width", barWidth)
		.attr("height", barHeight-1)
		.style("fill", function(d) {return fill(d);})
		.style("stroke-width", 3);
	groups.append("svg:text")
		.attr("class", "legend_text")
		.attr("x", 5)
		.attr("y", barHeight - textOffset)
		.text(function(d) { return AUTHOR_TYPES[d]; });
	groups.append("svg:rect")
		.attr("class", "legend_fgnd")
		.attr("width", barWidth)
		.attr("height", barHeight)
		.style("fill", function(d) { return fill(d); })
		.style("opacity", "0")
		.on("mouseover", legendMouseoverHandler)
		.on("mouseout", legendMouseoutHandler)
		.on("click", legendClickHandler);
}

function changeAuthorTypeFilter(authorType) {
	onePubToDisplay = null;
	if (authorType === null) {
		d3.selectAll(".legend_fgnd")
			.style("opacity", 0);
	}
	authorTypeFilter = authorType;
	displayPubs();
	redisplayVis();
}

function legendMouseoverHandler(d) {
	var bgnd = this.parentNode.firstChild;
	d3.select(bgnd).style("stroke", armedStroke);
}

function legendMouseoutHandler(d) {
	var bgnd = this.parentNode.firstChild;
	d3.select(bgnd).style("stroke", null);
}

function legendClickHandler(d) {
	onePubToDisplay = null;
	d3.selectAll(".legend_fgnd")
		.style("opacity", 0.7);
	d3.select(this)
		.style("opacity", 0);

	changeAuthorTypeFilter(d);
}

function displayAuthors() {
	if (textSize === "small") {
		textSub1 = 4;
		textSub2 = 3;
		textSub3 = 3;
	} else {
		textSub1 = 5;
		textSub2 = 4;
		textSub3 = 3;
	}
	authors = {children: authorData.filter(function(d) {
		// Since I am a co-author on every paper, don't include me
		if (d.selected) {
			d.value = d.numPubs;
		} else {
			d.value = 0;
		}
		return (d.last_name !== ME);
	})};
	bubble = d3.layout.pack()
		.sort(function(a, b) {return b.value - a.value;})
		.size([svg_h, svg_h]);

	var node = svg.selectAll("g.author")
		.data(bubble.nodes(authors)
			.filter(function(d) { return !d.children; }));
	var groups = node.enter()
			.append("svg:g")
			.attr("class", "author");
	node.exit()
			.remove();

	groups.append("svg:circle")
		.attr("class", "auth_bgnd")
		.style("fill", function(d) { return fill(d.author_type); })
		.style("stroke-width", 3);
	groups.append("svg:title")
		.attr("class", "auth_title")
		.text(function(d) { return d.first_names + " " + d.last_name + " (" + d.value + ")";});
	groups.append("svg:text")
		.attr("class", "auth_text")
		.attr("text-anchor", "middle")
		.attr("dy", ".3em");
	groups.append("svg:circle")
		.attr("class", "auth_fgnd")
		.style("fill", function(d) { return fill(d.author_type); })
		.style("opacity", "0")
		.on("mouseover", authorMouseoverHandler)
		.on("mouseout", authorMouseoutHandler)
		.on("click", authorClickHandler);

	node
		.transition()
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	node.selectAll(".auth_title")
		.text(function(d) { return d.first_names + " " + d.last_name + " (" + d.value + ")"; });
	node.selectAll(".auth_bgnd")
		.attr("r", function(d) { return d.r; });
	node.selectAll(".auth_fgnd")
		.attr("r", function(d) { return d.r; });
	node.selectAll(".auth_text")
		.style("font-size", function(d) {
			if (d.r > 20) {
				return "1.0em";
			} else if (d.r > 15) {
				return "0.8em";
			} else {
				return "0.6em";
			}
		})
		.text(function(d) {
			var str = d.last_name;
			if (d.r > 20) {
				return str.substring(0, d.r / textSub1);
			} else if (d.r > 15) {
				return str.substring(0, d.r / textSub2);
			} else {
				return str.substring(0, d.r / textSub3);
			}
		});
}

function authorMouseoverHandler(d) {
	var bgnd = this.parentNode.firstChild;
	d3.select(bgnd).style("stroke", armedStroke);
}

function authorMouseoutHandler(d) {
	var bgnd = this.parentNode.firstChild;
	d3.select(bgnd).style("stroke", null);
}

function authorClickHandler(d) {
	onePubToDisplay = null;
	changeAuthorFilter(d);
}

function classes(root) {
	var classes = [];

	function recurse(name, node) {
		if (node.children) {
            node.children.forEach(function (child) {
                recurse(node.name, child);
            });
        }
		else {
            classes.push({packageName: name, className: node.name, value: node.size});
        }
	}
	recurse(null, root);
	return {children: classes};
}

function debugPrt(d) {
	var str = "";
	for (attr in d) {
		str += attr + ": " + d[attr] + "; ";
	}
	return str;
}
