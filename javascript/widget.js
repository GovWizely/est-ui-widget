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

          $.getJSON(composeURL(search, offset), function (data) {

            // Only run it on first time search, not when navigating between pages.
            if (newSearch) {
              widgetContainer.find('.ita-search-widget-pagination, .ita-search-widget-clear').remove();
              widgetContainer.append(buildPaginationDiv(search, data['total']));
              widgetContainer.append(buildClearLink());
            }

            resultsDiv.empty().append(styleResults(data));
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
            widgetContainer.find('.ita-search-widget-results, .ita-search-widget-pagination, .ita-search-widget-clear').remove();
          });
          return clearLink;
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
