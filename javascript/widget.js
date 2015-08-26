(function () {
  jQuery(document).ready(function ($) {

    $.fn.searchWidget = function (options) {
      var endpointInfo = getEndpointInfo(options['endpoint'])
      var resultsDiv;
      var currentPage;

      var widgetContainer = $(this);
      widgetContainer.addClass('ita-search-widget-container');
      widgetContainer.empty().append(endpointInfo.buildSearchForm());

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
        if (total > 0) {
          footer.append(buildPaginationDiv(search, total));
        }
        footer.append(buildClearLink());
        return footer;
      };

      function styleResults(payload) {
        var elements = [buildTotalDiv(payload['total'])],
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
                  .append($('<td>').text(key.replace('_', ' ')))
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
            moreInfoUrl: 'http://export.gov/ecr/eg_main_023148.asp',
            searchUrl: function(search, offset) {
              offset = offset || 0;
              var url = host + '/consolidated_screening_list/search' +
                '?api_key=' + apiKey +
                (search == '' ? '' : '&fuzzy_name=true&name=' + search) +
                '&offset=' + offset;
              return url;
            },
            buildSearchForm: buildSearchForm
          },
          envirotech: {
            title: 'Envirotech Solutions',
            resultTitleField: 'name_english',
            displayFields: ['source_id', 'name_chinese', 'name_english', 'name_french', 'name_portuguese', 'name_spanish'],
            searchUrl: function(search, offset) {
              offset = offset || 0;
              var url = host + '/envirotech/solutions/search' +
                '?api_key=' + apiKey +
                (search == '' ? '' : '&q=' + search) +
                '&offset=' + offset;
              return url;
            },
            buildSearchForm: buildSearchForm
          }
        };
        return info[endpoint];
      }

      // --- functions that return DOM elements:

      function buildResultsDiv() {
        return $('<div class="ita-search-widget-results"></div>');
      }

      function buildTotalDiv(total) {
        var totalDiv = $('<div class="ita-search-widget-total">');
        var innerHtml = total + ' results';
        if (options['endpoint'] == 'consolidated_screening_list' && total > 0) {
          innerHtml = innerHtml + ' - <a target="_blank" href="' + endpointInfo.moreInfoUrl + '">More Information About the Results</a>';
        }
        totalDiv.html(innerHtml);
        return totalDiv;
      }

      function buildPaginationDiv(search, total) {
        var paginationDiv = $('<div class="ita-search-widget-pagination"></div>');
        paginationDiv.paging(total, {
          format: '[< nncnn >]',
          perpage: 10,
          lapping: 0,
          page: 1,
          onSelect: function (page) {
            if (currentPage != page) {
              loadData(search, (page - 1) * 10, false);
              currentPage = page;
            }
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
          currentPage = 1;
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
})();
