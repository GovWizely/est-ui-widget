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
        var apiKey = options['apiKey'];
        var host = options['host'] || 'https://api.govwizely.com';
        var endpointInfo = endpointInfo(options['endpoint'])
        var url = host + '/v2/' + endpointInfo.path + '/search';

        var widgetElementId = $(this).attr('id');
        $('#' + widgetElementId).addClass('widget-container');

        $('#' + widgetElementId).html(
          '<form>' +
          '<p>Search the <strong>' + endpointInfo.title + '</strong>:</p>' +
          '<input type="text" name="query">' +
          '<input type="submit" id="widget-search" value="Search">' +
          '</form>'
        );

        $('#' + widgetElementId + ' form').on('submit', function (e) {
          e.preventDefault();
          loadData($('input[name=query]').val());
        });

        function endpointInfo(endpoint) {
          var info = {
            title: 'Consolidated Screening List',
            path: 'consolidated_screening_list',
            resultTitleField: 'name'
          };
          return info;
        }

        function loadData(search, offset, init) {
          offset = typeof offset !== 'undefined' ? offset : 0;

          $.getJSON(composeURL(search, offset), function (data) {
            // Only run it on first time search, not when navigating between pages.
            if (typeof init === 'undefined' || init == false) {

              if ($('#widget-result').size() == 0) {
                $('#' + widgetElementId).append(
                  '<div id="widget-result"></div>' +
                  '<div id="pagination"></div>'
                );
              }

              $("#pagination").paging(data['total'], {
                format: '[< ncnnn >]',
                perpage: 10,
                lapping: 0,
                page: 1,
                onSelect: function (page) {
                  console.log(page);
                  loadData(search, (page - 1) * 10, true);
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
            }
            $('#widget-result').empty().append(styleResults(data));
          });
        }

        function composeURL(search, offset) {
          offset = typeof offset !== 'undefined' ? offset : 0;
          return url + '?api_key=' + apiKey + (search == '' ? '' : '&q=' + search) + '&offset=' + offset;
        }

        function styleResults(mydata) {
          var total = $('<div id="pagination-total">').text(mydata['total'] + ' results');
          var results = $('<ul>');

          $.each(mydata['results'], function (index, value) {
            var resultText = value[endpointInfo.resultTitleField];
            var collapsible = $('<a>').text(resultText).attr('href', '#');
            var innerTable = $('<table>').hide();

            collapsible.on('click', function (e) {
              e.preventDefault();
              var table = $(this).siblings('table');
              $('#widget-result').find('table').not(table).hide();
              table.toggle();
            });

            results.append($('<li>')
              .append(collapsible)
              .append(innerTable));

            $.each(value, function (key, val) {
              if ($.inArray(key, ['name', 'remarks', 'source', 'alt_names']) > -1) {
                innerTable.append($('<tr>')
                  .append($('<td>').text(key))
                  .append($('<td>').text(val)));
              }
            });
          });
          return [total, results];
        };

        return this;
      };
    });
  }
})();
