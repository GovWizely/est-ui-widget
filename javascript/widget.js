(function () {
  jQuery(document).ready(function ($) {

    $.fn.searchWidget = function (options) {
      var endpointInfo = getEndpointInfo(options['endpoint'])
      var resultsDiv;
      var currentPage;

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

        $.getJSON(searchUrl(search, offset), function (data) {
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

      function getResultTitle(record) {
        if (typeof(endpointInfo.resultTitleField) == "string") {
          return record[endpointInfo.resultTitleField];
        } else {
          return endpointInfo.resultTitleField(record);
        }
      };

      function styleResults(payload) {
        var elements = [buildTotalDiv(payload['total'])],
          results;

        if (payload['total'] > 0) {
          results = $('<ul>');

          $.each(payload['results'], function (index, value) {
            var resultText = getResultTitle(value);
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

            $.each(endpointInfo.displayFields, function(i, formatter) {
              var key, val;
              if (typeof(formatter) == "string") {
                key = formatter;
                val = value[key];
              } else {
                key = formatter.key;
                val = formatter.format(value[key]);
              }

              if (val) {
                innerTable.append($('<tr>')
                  .append($('<td>').text(key.replace('_', ' ')))
                  .append($('<td>').html(val)));
              }
            });
          });
          elements.push(results);
        }

        return elements;
      };

      function searchUrl(search, offset) {
        offset     = offset || 0;
        var apiKey = options['apiKey'];
        var host   = options['host'] || 'https://api.govwizely.com';
        var url    = host + endpointInfo['path'] +
          '?api_key=' + apiKey +
          '&offset=' + offset;
        $.each(search, function(index, value) {
          if (value != '') {
            url += '&' + index + '=' + value;
          }
        });
        return url;
      };

      function getEndpointInfo(endpoint) {
        var info = {
          consolidated_screening_list: {
            title: 'the Consolidated Screening List',
            resultTitleField: 'name',
            displayFields: ['name', 'remarks', 'source', 'alt_names'],
            moreInfoUrl: 'http://export.gov/ecr/eg_main_023148.asp',
            extraParams: {fuzzy_name: "true"},
            path: '/consolidated_screening_list/search',
            searchFieldName: 'name'
          },
          envirotech: {
            title: 'Envirotech Solutions',
            resultTitleField: 'name_english',
            displayFields: ['source_id', 'name_chinese', 'name_english', 'name_french', 'name_portuguese', 'name_spanish'],
            extraParams: {},
            path: '/envirotech/solutions/search',
          },
          trade_leads: {
            title: 'Trade Leads',
            resultTitleField: function (val) { return val['title'] || val ['description'] || val['agency']},
            displayFields: ['agency', 'topic', 'description', WidgetFieldFormatter.format_link('url'), 'contact'],
            extraParams: {},
            path: '/trade_leads/search',
            includeCountries: true
          },
          trade_events: {
            title: 'Trade Events',
            resultTitleField: 'event_name',
            displayFields: ['event_name', 'event_type', 'description', 'start_date', 'end_date', 'time_zone', WidgetFieldFormatter.format_json_objects('venues', 'country'), 'cost', WidgetFieldFormatter.format_link('registration_link'), WidgetFieldFormatter.format_link('url'), 'contact', 'source'],
            extraParams: {},
            path: '/trade_events/search',
            includeCountries: true
          },
          useac_locations: {
            title: 'Export Assistance Centers',
            resultTitleField: function (val) { return val['zip_code'] + ' - ' + val['office_name']; },
            displayFields: ['zip_code', 'office_name', WidgetFieldFormatter.format_array('address'), 'email', 'phone'],
            extraParams: {},
            path: '/ita_zipcode_to_post/search',
            searchFieldName: 'zip_codes',
            placeholder: 'Enter ZIP code'
          },
          ita_office_locations: {
            title: 'International Office Locations',
            resultTitleField: function (val) { return val['post']; },
            displayFields: ['post', WidgetFieldFormatter.format_array('address'), 'email', 'phone'],
            extraParams: {},
            path: '/ita_office_locations/search'
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
        var resultsText = (total === 1) ? ' result' : ' results';
        var innerHtml = total + resultsText;
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

        var inputsHtml = '<input type="text" placeholder="' + (endpointInfo.placeholder || 'Enter search query') + '" name="' +
          (endpointInfo.searchFieldName || 'q') + '">';
        if (endpointInfo.includeCountries) {
          inputsHtml = '<div class="ita-search-widget-input-wrapper">' +
            inputsHtml +
            Utility.countriesSelectBox() +
            '</div>';
        }

        var searchForm = $('<form>' +
          '<p>Search <strong>' + endpointInfo.title + '</strong>:</p>' +
           inputsHtml +
          '<input type="submit" id="widget-search" value="Search">' +
        '</form>');

        searchForm.on('submit', function (e) {
          e.preventDefault();
          currentPage = 1;
          loadData(Utility.mergeObjects(
              Utility.parseQueryString($(this).serialize()),
              endpointInfo.extraParams)
            );
        });
        return searchForm;
      };

      function buildClearLink() {
        var clearLink = $('<div class="ita-search-widget-clear"><a href="#">Clear</a></div>');
        clearLink.on('click', function(e) {
          e.preventDefault();
          resultsDiv = false;
          widgetContainer.find('input[name=q]').val("");
          widgetContainer.find('select[name=countries]').val("");
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
