(function () {
    var jQuery;
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
            $.fn.est_widgetize = function (options) {
                var apiKey = options['api_key'];
                var widgetElementId = $(this).attr('id');

                $('#' + widgetElementId).html(
                    '<input type="text" id="est-query">' +
                    '<input type="button" id="est-widget-search" value="search">' +
                    '<div id="est-widget-result"></div>'
                );

                $('#est-widget-search').on('click', function (e) {
                    estLoadData($('#est-query').val());
                });

                var estURL = "https://api.govwizely.com/v2/environmental_solutions/search";

                function estLoadData(search) {
                    $.getJSON(composeURL(search), function (data) {
                        $('#est-widget-result').html($.estStyleResults(data));
                    });
                }

                function composeURL(search) {
                    return estURL + '?api_key=' + apiKey + (search == '' ? '' : '&q=' + search);
                }

                $.estStyleResults = function (mydata) {
                    var results = $('<ul>');
                    $.each(mydata['results'], function (index, value) {
                        var resultId = ('source-id-' + value['source_id']).replace(/\W/g, '-');
                        var collapsible = $('<a>').text(resultId).attr('href', '#');
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
