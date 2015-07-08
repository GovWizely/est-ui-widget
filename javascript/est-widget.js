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
    //var paging_script_tag = document.createElement('script');
    //paging_script_tag.setAttribute("type", "text/javascript");
    //paging_script_tag.setAttribute("src", "javascript/jquery.paging.min.js");
    //(document.getElementsByTagName("head")[0] || document.documentElement).appendChild(paging_script_tag);

    jQuery(document).ready(function ($) {
      $.fn.est_widgetize = function (options) {
        var apiKey = options['api_key'];
        var widgetElementId = $(this).attr('id');
        $('#' + widgetElementId).addClass('est-widget-container');

        $('#' + widgetElementId).html(
          '<div id="est-widget-Keyword">Keyword</div>' +
          '<input type="text" id="est-query">' +
          '<input type="button" id="est-widget-search" value="Search">' +
          '<div id="est-widget-result"></div>' +
          '<div id="est-pagination"></div>'
        );

        $('#est-widget-search').on('click', function (e) {
          estLoadData($('#est-query').val());
        });

        $("#est-query").keyup(function (e) {
          if (e.keyCode == 13) {
            $("#est-widget-search").click();
            $(this).blur();
          }
        });

        var estURL = "https://api.govwizely.com/v2/environmental_solutions/search";

        function estLoadData(search, offset, init) {
          offset = typeof offset !== 'undefined' ? offset : 0;

          $.getJSON(composeURL(search, offset), function (data) {
            // Only run it on first time search, not when navigating between pages.
            if (typeof init === 'undefined' || init == false) {
              $("#est-pagination").paging(data['total'], {
                format: '[< ncnnn >]',
                perpage: 10,
                lapping: 0,
                page: 1,
                onSelect: function (page) {
                  console.log(page);
                  estLoadData(search, (page - 1) * 10, true);
                },
                onFormat: function (type) {
                  switch (type) {
                    case 'block': // n and c
                      return '<a href="#">' + this.value + '</a>';
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
            }

            $('#est-widget-result').html($.estStyleResults(data));
          });
        }

        function composeURL(search, offset) {
          offset = typeof offset !== 'undefined' ? offset : 0;

          return estURL + '?api_key=' + apiKey + (search == '' ? '' : '&q=' + search) + '&offset=' + offset;
        }

        $.estStyleResults = function (mydata) {

          var results = $('<ul>');
          results.append($('<div id="est-pagination-total">').text(mydata['total'] + ' results.'));
          $.each(mydata['results'], function (index, value) {
            var resultId = ('source-id-' + value['source_id']).replace(/\W/g, '-');
            var resultText = 'Source ID ' + value['source_id'];
            var collapsible = $('<a>').text(resultText).attr('href', '#');
            var innerTable = $('<table>');

            collapsible.on('click', function (e) {
              e.preventDefault();
              $('#' + resultId).slideToggle()
            });

            results.append($('<li>')
              .append(collapsible)
              .append(innerTable.attr('id', resultId).hide()));

            $.each(value, function (key, val) {
              innerTable.append($('<tr>')
                .append($('<td>').text(key))
                .append($('<td>').text(val)));
            });
          });
          return results;
        };
        return this;
      };
    });
  }
})();
