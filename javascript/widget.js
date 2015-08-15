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
        $('#' + widgetElementId).addClass('ita-search-widget-container');

        $('#' + widgetElementId).html(
          '<form>' +
          '<p>Search <strong>' + endpointInfo.title + '</strong>:</p>' +
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
            consolidated_screening_list: {
              title: 'the Consolidated Screening List',
              path: 'consolidated_screening_list',
              resultTitleField: 'name',
              displayFields: ['name', 'remarks', 'source', 'alt_names']
            },
            envirotech: {
              title: 'Envirotech Solutions',
              path: 'envirotech/solutions',
              resultTitleField: 'name_english',
              displayFields: ['source_id', 'name_chinese', 'name_english', 'name_french', 'name_portuguese', 'name_spanish']
            }
          };
          return info[endpoint];
        }

        function loadData(search, offset, init) {
          offset = typeof offset !== 'undefined' ? offset : 0;
          init = typeof init !== 'undefined' ? init : true;

          if (init) {
            if ($('.ita-search-widget-result').size() == 0) {
              $('#' + widgetElementId).append(
                '<div class="ita-search-widget-result"></div>' +
                '<div class="ita-search-widget-pagination"></div>'
              );
            }
          }

          $('.ita-search-widget-result').html(
            '<div class="spinner">' +
              '<div class="rect1"></div>' +
              '<div class="rect2"></div>' +
              '<div class="rect3"></div>' +
              '<div class="rect4"></div>' +
              '<div class="rect5"></div>' +
            '</div>'
          );

          $.getJSON(composeURL(search, offset), function (data) {
            // Only run it on first time search, not when navigating between pages.
            if (init) {
              $(".ita-search-widget-pagination").paging(data['total'], {
                format: '[< ncnnn >]',
                perpage: 10,
                lapping: 0,
                page: 1,
                onSelect: function (page) {
                  console.log(page);
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
            }
            $('.ita-search-widget-result').empty().append(styleResults(data));
          });
        }

        function composeURL(search, offset) {
          offset = typeof offset !== 'undefined' ? offset : 0;
          return url + '?api_key=' + apiKey + (search == '' ? '' : '&q=' + search) + '&offset=' + offset;
        }

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
                $('.ita-search-widget-result').find('table').not(table).hide();
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

        return this;
      };
    });
  }
})();
