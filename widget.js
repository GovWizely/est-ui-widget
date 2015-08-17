/**
 * @license jQuery paging plugin v1.2.0 23/06/2014
 * http://www.xarg.org/2011/09/jquery-pagination-revised/
 *
 * Copyright (c) 2011, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

(function($, window, undefined) {


    $["fn"]["paging"] = function(number, opts) {

        var self = this,
        Paging = {

            "setOptions": function(opts) {

                var parseFormat = function(format) {

                    var gndx = 0, group = 0, num = 1, res = {
                        fstack:         [], // format stack
                        asterisk:       0, // asterisk?
                        inactive:       0, // fill empty pages with inactives up to w?
                        blockwide:      5, // width of number block
                        current:        3, // position of current element in number block
                        rights:         0, // num of rights
                        lefts:          0 // num of lefts
                    }, tok, pattern = /[*<>pq\[\]().-]|[nc]+!?/g;

                    var known = {
                        "[": "first",
                        "]": "last",
                        "<": "prev",
                        ">": "next",
                        "q": "left",
                        "p": "right",
                        "-": "fill",
                        ".": "leap"
                    }, count = {};

                    while ((tok = pattern["exec"](format))) {

                        tok = "" + (tok);

                        if (undefined === known[tok]) {

                            if ("(" === tok) {
                                group = ++gndx;
                            } else if (")" === tok) {
                                group = 0;
                            } else if (num) {

                                if ("*" === tok) {
                                    res.asterisk = 1;
                                    res.inactive = 0;
                                } else {
                                    // number block is the only thing left here
                                    res.asterisk = 0;
                                    res.inactive = "!" === tok.charAt(tok.length - 1);
                                    res.blockwide = tok["length"] - res.inactive;
                                    if (!(res.current = 1 + tok.indexOf("c"))) {
                                        res.current = (1 + res.blockwide) >> 1;
                                    }
                                }

                                res.fstack[res.fstack.length] = ({
                                    ftype: "block",	// type
                                    fgroup: 0,		// group
                                    fpos: 0		// pos
                                });
                                num = 0;
                            }

                        } else {

                            res.fstack[res.fstack.length] = ({
                                ftype: known[tok], // type
                                fgroup: group,      // group
                                fpos: undefined === count[tok] ? count[tok] = 1 : ++count[tok] // pos
                            });

                            if ("q" === tok)
                                ++res.lefts;
                            else if ("p" === tok)
                                ++res.rights;
                        }
                    }
                    return res;
                };

                Paging.opts = $.extend(Paging.opts || {
                    "lapping"		: 0,	// number of elements overlap
                    "perpage"           : 10,	// number of elements per page
                    "page"              : 1,	// current page
                    "refresh"		: {
                        "interval": 10,
                        "url": null
                    },	// refresh callback information

                    "format"		: "",	// visual format string

                    "lock"              : false, // set to true, if you want to disable the pagination for a while. 

                    "onFormat"		: function (type) {	// callback for every format element

                    /** EXAMPLE **

						switch (type) {

							case 'block':

								if (!this.active)
									return '<span class="disabled">' + this.value + '</span>';
								else if (this.value != this.page)
									return '<em><a href="#' + this.value + '">' + this.value + '</a></em>';
								return '<span class="current">' + this.value + '</span>';

							case 'right':
							case 'left':

								if (!this.active) {
									return "";
								}
								return '<a href="#' + this.value + '">' + this.value + '</a>';

							case 'next':

								if (this.active) {
									return '<a href="#' + this.value + '" class="next">Next &raquo;</a>';
								}
								return '<span class="disabled">Next &raquo;</span>';

							case 'prev':

								if (this.active) {
									return '<a href="#' + this.value + '" class="prev">&laquo; Previous</a>';
								}
								return '<span class="disabled">&laquo; Previous</span>';

							case 'first':

								if (this.active) {
									return '<a href="#' + this.value + '" class="first">|&lt;</a>';
								}
								return '<span class="disabled">|&lt;</span>';

							case 'last':

								if (this.active) {
									return '<a href="#' + this.value + '" class="prev">&gt;|</a>';
								}
								return '<span class="disabled">&gt;|</span>';

							case 'fill':
								if (this.active) {
									return "...";
								}
						}
						return ""; // return nothing for missing branches

						**/
                    },
                    "onSelect"		: function (page){	// callback for page selection

                        /** EXAMPLE SLICE **

						var data = this.slice;

						content.slice(prev[0], prev[1]).css('display', 'none');
						content.slice(data[0], data[1]).css('display', 'block');

						prev = data;

						**/


                        /** EXAMPLE AJAX **

						$.ajax({
							"url": '/data.php?start=' + this.slice[0] + '&end=' + this.slice[1] + '&page=' + page,
							"success": function(data) {
								// content replace
							}
						});

					   **/

                        // Return code indicates if the link of the clicked format element should be followed (otherwise only the click-event is used)
                        return true;
                    },
                    "onRefresh"		: function (json) {// callback for new data of refresh api

                    /** EXAMPLE **
						if (json.number) {
							Paging.setNumber(json.number);
						}

						if (json.options) {
							Paging.setOptions(json.options);
						}

						Paging.setPage(); // Call with empty params to reload the paginator
						**/
                    }
                }, opts || {});

                Paging.opts["lapping"]|= 0;
                Paging.opts["perpage"]|= 0;
                if (Paging.opts["page"] !== null)
                Paging.opts["page"]   |= 0;

                // If the number of elements per page is less then 1, set it to default
                if (Paging.opts["perpage"] < 1) {
                    Paging.opts["perpage"] = 10;
                }

                if (Paging.interval) window.clearInterval(Paging.interval);

                if (Paging.opts["refresh"]["url"]) {

                    Paging.interval = window.setInterval(function() {

                        $["ajax"]({
                            "url": Paging.opts["refresh"]["url"],
                            "success": function(data) {
                                
                                if (typeof(data) === "string") {

                                    try {
                                        data = $["parseJSON"](data);
                                    } catch (o) {
                                        return;
                                    }
                                }
                                Paging.opts["onRefresh"](data);
                            }
                        });

                    }, 1000 * Paging.opts["refresh"]["interval"]);
                }

                Paging.format = parseFormat(Paging.opts["format"]);
                return Paging;
            },

            "setNumber": function(number) {
                Paging.number = (undefined === number || number < 0) ? -1 : number;
                return Paging;
            },

            "setPage": function(page) {

		if (Paging.opts["lock"]) {
                    Paging.opts["onSelect"](0, self);
		    return Paging;
		}

                if (undefined === page) {

                    page = Paging.opts["page"];

                    if (null === page) {
                        return Paging;
                    }

                } else if (Paging.opts["page"] == page) { // Necessary to be ==, not ===
                    return Paging;
                }

                Paging.opts["page"] = (page|= 0);

                var number = Paging.number;
                var opts = Paging.opts;

                var rStart, rStop;

                var pages, buffer;

                var groups = 1, format = Paging.format;

                var data, tmp, node, lapping;

                var count = format.fstack["length"], i = count;


                // If the lapping is greater than perpage, reduce it to perpage - 1 to avoid endless loops
                if (opts["perpage"] <= opts["lapping"]) {
                    opts["lapping"] = opts["perpage"] - 1;
                }

                lapping = number <= opts["lapping"] ? 0 : opts["lapping"]|0;


                // If the number is negative, the value doesn"t matter, we loop endlessly with a constant width
                if (number < 0) {

                    number = -1;
                    pages = -1;

                    rStart = Math.max(1, page - format.current + 1 - lapping);
                    rStop  = rStart + format.blockwide;

                } else {

                    /* Calculate the number of pages
                     *
                     * Variables:
                     * - n: Number of elements
                     * - p: Elements per page
                     * - o: Offset (lapping)
                     * - x: Position of last n (aka virtual number of elements)
                     * - m: Height aka number of pages
                     *
                     * Condition: o < p
                     *
                     * Page             Last element of page
                     * =====================================
                     * 1                p
                     * 2                2p - o
                     * 3                3p - 2o
                     * ...
                     * k                kp - (k - 1)o
                     * k + 1            (k + 1)p - ko
                     *
                     *  => kp - (k - 1)o < n <= (k + 1)p - ko       (n is on page k+1)
                     * <=> k(p - o) + o < n <= k(p - o) + p
                     * <=> (n - p) / (p - o) <= k < (n - o) / (p - o)
                     *  => k = ceil((n - p) / (p - o))
                     *
                     * We know that kp - ko + i = n
                     *  => i = n - k(p - o)
                     *
                     *  => m = k + 1
                     *     x = kp + i
                     */
                    pages = 1 + Math.ceil((number - opts["perpage"]) / (opts["perpage"] - lapping));

                    // If current page is negative, start at the end and
                    // Set the current page into a valid range, includes 0, which is set to 1
                    page = Math.max(1, Math.min(page < 0 ? 1 + pages + page : page, pages));

                    // Do we need to print all numbers?
                    if (format.asterisk) {
                        rStart = 1;
                        rStop  = 1 + pages;

                        // Disable :first and :last for asterisk mode as we see all buttons
                        format.current   = page;
                        format.blockwide = pages;

                    } else {

                        // If no, start at the best position and stop at max width or at num of pages
                        rStart = Math.max(1, Math.min(page - format.current, pages - format.blockwide) + 1);
                        rStop = format.inactive ? rStart + format.blockwide : Math.min(rStart + format.blockwide, 1 + pages);
                    }
                }

                while (i--) {

                    tmp = 0; // default everything is visible
                    node = format.fstack[i];

                    switch (node.ftype) {

                        case "left":
                            tmp = (node.fpos < rStart);
                            break;
                        case "right":
                            tmp = (rStop <= pages - format.rights + node.fpos);
                            break;

                        case "first":
                            tmp = (format.current < page);
                            break;
                        case "last":
                            tmp = (format.blockwide < format.current + pages - page);
                            break;

                        case "prev":
                            tmp = (1 < page);
                            break;
                        case "next":
                            tmp = (page < pages);
                            break;
                    }
                    groups|= tmp << node.fgroup; // group visible?
                }

                data = {
                    "number"	: number,	// number of elements
                    "lapping"	: lapping,	// overlapping
                    "pages"		: pages,	// number of pages
                    "perpage"	: opts["perpage"], // number of elements per page
                    "page"		: page,		// current page
                    "slice"		: [			// two element array with bounds of the current page selection
                    (tmp = page * (opts["perpage"] - lapping) + lapping) - opts["perpage"], // Lower bound
                    Math.min(tmp, number) // Upper bound
                    ]
                };

                buffer = "";
                
                function buffer_append(opts, data, type) {
                    
                    type = "" + (opts["onFormat"].call(data, type));
                    
                    if (data["value"])
                        buffer+= type.replace(/<a/i, '<a data-page="' + data["value"] + '"');
                    else
                        buffer+= type;
                }

                while (++i < count) {

                    node = format.fstack[i];

                    tmp = (groups >> node.fgroup & 1);

                    switch (node.ftype) {
                        case "block":
                            for (; rStart < rStop; ++rStart) {

                                data["value"]      = rStart;
                                data["pos"]	       = 1 + format.blockwide - rStop + rStart;

                                data["active"]     = rStart <= pages || number < 0;     // true if infinity series and rStart <= pages
                                data["first"]      = 1 === rStart;                      // check if it is the first page
                                data["last"]       = rStart === pages && 0 < number;    // false if infinity series or rStart != pages

                                buffer_append(opts, data, node.ftype);
                            }
                            continue;

                        case "left":
                            data["value"]      = node.fpos;
                            data["active"]     = node.fpos < rStart; // Don't take group-visibility into account!
                            break;

                        case "right":
                            data["value"]      = pages - format.rights + node.fpos;
                            data["active"]     = rStop <= data["value"]; // Don't take group-visibility into account!
                            break;

                        case "first":
                            data["value"]      = 1;
                            data["active"]     = tmp && 1 < page;
                            break;
                            
                        case "prev":
                            data["value"]      = Math.max(1, page - 1);
                            data["active"]     = tmp && 1 < page;
                            break;

                        case "last":
                            if ((data["active"]	   = (number < 0))) {
                                data["value"]      = 1 + page;
                            } else {
                                data["value"]      = pages;
                                data["active"]     = tmp && page < pages;
                            }
                            break;
                            
                        case "next":
                            if ((data["active"]	   = (number < 0))) {
                                data["value"]      = 1 + page;
                            } else {
                                data["value"]      = Math.min(1 + page, pages);
                                data["active"]     = tmp && page < pages;
                            }
                            break;

                        case "leap":
                        case "fill":
                            data["pos"]        = node.fpos;
                            data["active"]     = tmp; // tmp is true by default and changes only for group behaviour
                            buffer_append(opts, data, node.ftype);
                            continue;
                    }

                    data["pos"]   = node.fpos;
                    data["last"]  = /* void */
                    data["first"] = undefined;

                    buffer_append(opts, data, node.ftype);
                }
                
                if (self.length) {

                    $("a", self["html"](buffer)).click(function(ev) {
                        ev["preventDefault"]();

                        var obj = this;

                        do {

                            if ('a' === obj["nodeName"].toLowerCase()) {
                                break;
                            }

                        } while ((obj = obj["parentNode"]));

                        Paging["setPage"]($(obj).data("page"));

                        if (Paging.locate) {
                            window.location = obj["href"];
                        }
                    });

                    Paging.locate = opts["onSelect"].call({
                        "number"	: number,
                        "lapping"	: lapping,
                        "pages"		: pages,
                        "slice"		: data["slice"]
                    }, page, self);
                }
                return Paging;
            }
        };

        return Paging
        ["setNumber"](number)
        ["setOptions"](opts)
        ["setPage"]();
    };

}(jQuery, this));

(function () {
  var jQuery;

  // TODO: we'll include jQuery in our build, so we won't need the following code.
  //       However, we may need to make sure that our jQuery is sandboxed
  //       so that it doesn't interfere with the rest of the page.

  // Load jQuery if not present
  if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.11.3') {
    var script_tag = document.createElement('script');
    script_tag.setAttribute("type", "text/javascript");
    script_tag.setAttribute("src",
      "https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js");
    if (script_tag.readyState) { // IE
      script_tag.onreadystatechange = function () { // For old versions of IE
        if (this.readyState == 'complete' || this.readyState == 'loaded') {
          scriptLoadHandler();
        }
      };
    } else { // Other browsers
      script_tag.onload = scriptLoadHandler;
    }
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
  } else {
    jQuery = window.jQuery;
    main();
  }

  function scriptLoadHandler() {
    jQuery = window.jQuery.noConflict(true);
    main();
  }

  function main() {
    jQuery(document).ready(function ($) {

      $.fn.searchWidget = function (options) {
        var endpointInfo = getEndpointInfo(options['endpoint'])
        var resultsDiv;

        var widgetContainer = $(this);
        widgetContainer.addClass('ita-search-widget-container');
        widgetContainer.empty().append(buildSearchForm());

        function loadData(search, offset, newSearch) {
          offset = typeof offset !== 'undefined' ? offset : 0;
          newSearch = typeof newSearch !== 'undefined' ? newSearch : true;

          if (!resultsDiv) {
            resultsDiv = buildResultsDiv();
            widgetContainer.append(resultsDiv);
          }
          resultsDiv.empty().append(buildSpinner());

          $.getJSON(endpointInfo.searchUrl(search, offset), function (data) {
            // Only run it on first time search, not when navigating between pages.
            if (newSearch) {
              widgetContainer.find('.ita-search-widget-footer').remove();
              widgetContainer.append(buildFooter(search, data['total']));
            }

            resultsDiv.empty().append(styleResults(data));

          });
        }

        function buildFooter(search, total) {
          var footer = $('<div class="ita-search-widget-footer"></div>');
          footer.append(buildPaginationDiv(search, total));
          footer.append(buildClearLink());
          if (options['endpoint'] == 'consolidated_screening_list') {
            footer.append(buildMoreInfoLink('http://export.gov/ecr/eg_main_023148.asp'));
          }
          return footer;
        };

        function styleResults(payload) {
          var total = $('<div class="ita-search-widget-total">').text(payload['total'] + ' results');
          var elements = [total],
            results;

          if (payload['total'] > 0) {
            results = $('<ul>');

            $.each(payload['results'], function (index, value) {
              var resultText = value[endpointInfo.resultTitleField];
              var collapsible = $('<a>').text(resultText).attr('href', '#');
              var innerTable = $('<table>').hide();

              collapsible.on('click', function (e) {
                e.preventDefault();
                var table = $(this).siblings('table');
                resultsDiv.find('table').not(table).hide();
                table.toggle();
              });

              results.append($('<li>')
                .append(collapsible)
                .append(innerTable));

              $.each(value, function (key, val) {
                if ($.inArray(key, endpointInfo.displayFields) > -1) {
                  innerTable.append($('<tr>')
                    .append($('<td>').text(key))
                    .append($('<td>').text(val)));
                }
              });
            });
            elements.push(results);
          }

          return elements;
        };

        function getEndpointInfo(endpoint) {
          var apiKey = options['apiKey'];
          var host =  options['host'] || 'https://api.govwizely.com';
          var info = {
            consolidated_screening_list: {
              title: 'the Consolidated Screening List',
              resultTitleField: 'name',
              displayFields: ['name', 'remarks', 'source', 'alt_names'],
              searchUrl: function(search, offset) {
                offset = offset || 0;
                var url = host + '/v2/consolidated_screening_list/search' +
                  '?api_key=' + apiKey +
                  (search == '' ? '' : '&fuzzy_name=true&name=' + search) +
                  '&offset=' + offset;
                return url;
              }
            },
            envirotech: {
              title: 'Envirotech Solutions',
              resultTitleField: 'name_english',
              displayFields: ['source_id', 'name_chinese', 'name_english', 'name_french', 'name_portuguese', 'name_spanish'],
              searchUrl: function(search, offset) {
                offset = offset || 0;
                var url = host + '/v2/envirotech/solutions/search' +
                  '?api_key=' + apiKey +
                  (search == '' ? '' : '&q=' + search) +
                  '&offset=' + offset;
                return url;
              }
            }
          };
          return info[endpoint];
        }

        // --- functions that return DOM elements:

        function buildResultsDiv() {
          return $('<div class="ita-search-widget-results"></div>');
        }

        function buildPaginationDiv(search, total) {
          var paginationDiv = $('<div class="ita-search-widget-pagination"></div>');
          paginationDiv.paging(total, {
            format: '[< nncnn >]',
            perpage: 10,
            lapping: 0,
            page: 1,
            onSelect: function (page) {
              loadData(search, (page - 1) * 10, false);
            },
            onFormat: function (type) {
              switch (type) {
                case 'block': // n and c
                  if (this.value == this.page) {
                    return '<span class="current">' + this.value + '</span>';
                  } else {
                    return '<a href="#">' + this.value + '</a>';
                  }
                case 'next': // >
                  return '<a href="#">&gt;</a>';
                case 'prev': // <
                  return '<a href="#">&lt;</a>';
                case 'first': // [
                  return '<a href="#">First</a>';
                case 'last': // ]
                  return '<a href="#">Last</a>';
              }
            }
          });
          return paginationDiv;
        }

        function buildSearchForm() {
          var searchForm = $('<form>' +
            '<p>Search <strong>' + endpointInfo.title + '</strong>:</p>' +
            '<input type="text" name="query">' +
            '<input type="submit" id="widget-search" value="Search">' +
          '</form>');
          searchForm.on('submit', function (e) {
            e.preventDefault();
            loadData(widgetContainer.find('input[name=query]').val());
          });
          return searchForm;
        };

        function buildClearLink() {
          var clearLink = $('<div class="ita-search-widget-clear"><a href="#">Clear</a></div>');
          clearLink.on('click', function(e) {
            e.preventDefault();
            resultsDiv = false;
            widgetContainer.find('input[name=query]').val("");
            widgetContainer.find('.ita-search-widget-results, .ita-search-widget-footer').remove();
          });
          return clearLink;
        }

        function buildMoreInfoLink(href) {
          return $('<div class="ita-search-widget-more-info"><a target="_blank" href="' + href + '">More Info</a></div>');
        }

        function buildSpinner() {
          return $('<div class="spinner">' +
            '<div class="rect1"></div>' +
            '<div class="rect2"></div>' +
            '<div class="rect3"></div>' +
            '<div class="rect4"></div>' +
            '<div class="rect5"></div>' +
          '</div>');
        }

        return this;
      };
    });
  }
})();
