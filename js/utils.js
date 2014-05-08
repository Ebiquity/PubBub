// (c) 2012 Ben Bederson @ University of Maryland
// Human-Computer Interaction Lab
// http://www.cs.umd.edu/~bederson
// See BSD License: http://www.cs.umd.edu/~bederson/LICENSE.txt

function loadUrl(url, callback) {
    if (jQuery.browser.msie && window.XDomainRequest) {
	// For IE 8 and IE 9, need to use XDomainRequest object for cross domain access
        var xdr = new XDomainRequest();
	      xdr.timeout = 30000;
        xdr.onerror = function () {
            console.log('xdr onerror: ' + url);
        };
        xdr.ontimeout = function () {
            console.log('xdr ontimeout: ' + url);
        };
        xdr.onload = function() {
            callback(xdr.responseText);
        };
        xdr.open("get", url);
        xdr.send();
    } else {
        $.ajax({
            url: url
        }).done(function(data) {
            callback(data);
        });
    }
}
