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
            var css_link = $("<link>", {
                rel: "stylesheet",
                type: "text/css",
                href: "style.css"
            });
            css_link.appendTo('head');

            var html_url = "http://localhost:63342/est-ui-widget/container.html"; // used rubymine default Nginx.

            $.ajax({
                success: function (data, textStatus, jqXHR) {
                    $('#est-widget-container').html(data);
                    $('#est-widget-search').on('click', function (e) {
                        estLoadData($('#est-query').val());
                    });
                },
                error: function (jqXHR, textStatus, errorThrown) {

                },
                url: html_url
            });

            var estURL = "https://api.govwizely.com/environmental_solutions/search?q=";

            function estLoadData(search) {
                $.getJSON(estURL + search, function (data) {
                    $('#est-widget-result').html(JSON.stringify(data));
                });
            }
        });
    }
})();

