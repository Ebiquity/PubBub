// (c) 2012 Ben Bederson @ University of Maryland
// Human-Computer Interaction Lab
// http://www.cs.umd.edu/~bederson
// See BSD License: http://www.cs.umd.edu/~bederson/LICENSE.txt


var baseURL = "http://bubbles.test/";
var baseServerURL = baseURL;


var GROUP_YEAR = "year";
var GROUP_VENUE_TYPE = "venue_type";
var GROUP_VENUE = "venue";
var NO_KEYWORD_FILTER = "None (show all)";

var PUB_TYPES = {};
PUB_TYPES.AR = 'Article';
PUB_TYPES.BO = 'Book';
PUB_TYPES.BC = 'Book Chapter';
PUB_TYPES.CP = 'Conference Full Paper';
PUB_TYPES.CS = 'Conference Short Paper';
PUB_TYPES.CA = 'Conference Panel';
PUB_TYPES.CD = 'Conference Refereed Demo';
PUB_TYPES.EC = 'Edited Collection';
PUB_TYPES.JO = 'Journal Paper';
PUB_TYPES.ME = 'Media (news, radio, etc.)';
PUB_TYPES.OT = 'Other';
PUB_TYPES.PO = 'Conference Poster';
PUB_TYPES.TH = 'Thesis';
PUB_TYPES.TR = 'Tech Report';
PUB_TYPES.VI = 'Video';
PUB_TYPES.WO = 'Workshop';

var AUTHOR_TYPES = {};
var AUTHOR_TYPE_INDEXES = [];
AUTHOR_TYPES.FA = "Faculty";
AUTHOR_TYPES.ST = "Student";
AUTHOR_TYPES.IN = "Industry";
AUTHOR_TYPES.RE = "Researcher";
for (var at in AUTHOR_TYPES) {
	AUTHOR_TYPE_INDEXES.push(at);
}
